import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { Rig, STAGE_H, STAGE_W } from "../rig/Rig";
import { C, MONO, SANS } from "./brand";
import { FPS, T, w } from "./timing";
import { WORDMARK } from "./wordmark";

// The developer chat, dressed as GOAT IQ: near-black canvas, flat surfaces,
// square corners, hard offset shadows, Archivo with Space Mono for metadata.
const CHANNEL = "dashboard-squad";
const DEV_LINE = "Should be a quick dashboard project.";
const GRIFF_LINE = ["Someone", "say", "quick", "dashboard?"];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.76, 0, 0.24, 1);

const Tile: React.FC<{ bg: string; children?: React.ReactNode; size?: number }> = ({ bg, children, size = 92 }) => (
  <div
    style={{
      width: size,
      height: size,
      flex: "none",
      background: bg,
      color: C.ink,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: `800 ${size * 0.38}px ${SANS}`,
      overflow: "hidden",
      position: "relative",
    }}
  >
    {children}
  </div>
);

/** Griff's head from the rig, framed in an avatar tile. */
const GriffHead: React.FC<{ size: number }> = ({ size }) => {
  const W = size * 2.15;
  return (
    <div style={{ position: "absolute", left: -W * 0.27, top: -W * 0.035, width: W, height: (W * STAGE_H) / STAGE_W }}>
      <Rig pose={{ view: "000", arms: {}, face: { mouth: "X", brows: { l: 6, r: 2 } } }} id="avatar" />
    </div>
  );
};

const Message: React.FC<{
  avatar: React.ReactNode;
  name: string;
  nameColor?: string;
  tag?: string;
  time: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ avatar, name, nameColor = C.cream, tag, time, children, style }) => (
  <div style={{ display: "flex", gap: 26, alignItems: "flex-start", ...style }}>
    {avatar}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ font: `800 38px ${SANS}`, color: nameColor }}>{name}</span>
        {tag && (
          <span style={{ font: `700 18px ${MONO}`, letterSpacing: "0.08em", background: C.green, color: C.greenInk, padding: "4px 10px 2px" }}>
            {tag}
          </span>
        )}
        <span style={{ font: `400 20px ${MONO}`, color: C.muted }}>{time}</span>
      </div>
      <div style={{ font: `500 50px/1.22 ${SANS}`, color: C.cream, marginTop: 8 }}>{children}</div>
    </div>
  </div>
);

export const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // The window rises in, then leaves with a fast push toward the camera.
  const enter = spring({ frame, fps: FPS, config: { damping: 200 }, durationInFrames: 14 });
  const leave = interpolate(t, [T.chatEnd - 0.3, T.chatEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  // The developer types in the input, then sends.
  const typed = Math.round(interpolate(t, [T.typeFrom, T.send - 0.12], [0, DEV_LINE.length], clamp));
  const sent = t >= T.send;
  const devIn = spring({ frame: frame - Math.round(T.send * FPS), fps: FPS, config: { damping: 18, stiffness: 220 } });

  // GRIFF HAS ENTERED THE CHAT slams in.
  const nf = frame - Math.round(T.notify * FPS);
  const notifyIn = spring({ frame: nf, fps: FPS, config: { damping: 13, stiffness: 260 } });
  const flash = interpolate(nf, [0, 2, 8], [0, 0.35, 0], clamp);

  // Griff's message, word by word with the voice.
  const griffAt = w("someone") - 0.25;
  const griffIn = spring({ frame: frame - Math.round(griffAt * FPS), fps: FPS, config: { damping: 18, stiffness: 220 } });
  const shown = GRIFF_LINE.map((_, i) => t >= w(["someone", "say", "quick", "dashboard"][i]));
  const typing = t >= griffAt && !shown[0];

  const caret = Math.floor(t * 2.2) % 2 === 0;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, fontFamily: SANS, overflow: "hidden" }}>
      {/* Grid crosses, as on the GOAT IQ stage. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cpath d='M36 31v10M31 36h10' stroke='rgba(255,255,255,0.1)' stroke-width='1.5'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 300,
          width: 952,
          height: 1300,
          transform: `translateY(${(1 - enter) * 220}px) scale(${1 + leave * 0.5})`,
          opacity: enter * (1 - leave),
          transformOrigin: "50% 70%",
        }}
      >
        {/* Hard offset frame behind the window. */}
        <div style={{ position: "absolute", inset: 0, transform: "translate(18px, 18px)", border: `3px solid ${C.frame}` }} />
        <div style={{ position: "absolute", inset: 0, background: C.surface, border: `2px solid ${C.line}`, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "30px 36px", borderBottom: `2px solid ${C.line}`, background: C.bgDeep }}>
            <div style={{ width: 150, height: 32 }} dangerouslySetInnerHTML={{ __html: WORDMARK.replace('class="wm"', 'class="wm" width="150" height="32"') }} />
            <div style={{ width: 2, height: 40, background: C.line }} />
            <span style={{ font: `800 38px ${SANS}`, color: C.cream }}>
              <span style={{ color: C.green }}>#</span> {CHANNEL}
            </span>
            <span style={{ marginLeft: "auto", font: `700 20px ${MONO}`, color: C.muted, letterSpacing: "0.08em" }}>{t >= T.notify ? "4" : "3"} ONLINE</span>
          </div>

          {/* Log */}
          <div style={{ flex: 1, padding: "40px 40px 0", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 40, overflow: "hidden" }}>
            <Message avatar={<Tile bg={C.cyan}>JS</Tile>} name="Jess" time="4:52 PM" style={{ opacity: 0.55 }}>
              Sales wants customer analytics in the app. Who's taking it?
            </Message>
            <Message avatar={<Tile bg={C.purple}>MK</Tile>} name="Mike" time="4:53 PM" style={{ opacity: 0.55 }}>
              I can pick it up this sprint.
            </Message>
            {sent && (
              <Message
                avatar={<Tile bg={C.purple}>MK</Tile>}
                name="Mike"
                time="4:53 PM"
                style={{ transform: `translateY(${(1 - devIn) * 60}px)`, opacity: devIn }}
              >
                {DEV_LINE}
              </Message>
            )}

            {t >= T.notify && (
              <div style={{ position: "relative", alignSelf: "center", margin: "8px 0", transform: `scale(${0.5 + notifyIn * 0.5})`, opacity: Math.min(1, notifyIn * 1.6) }}>
                <div style={{ position: "absolute", inset: 0, transform: "translate(12px, 12px)", background: C.yellow }} />
                <div style={{ position: "relative", background: C.green, color: C.greenInk, padding: "22px 30px 18px", display: "flex", alignItems: "center", gap: 20 }}>
                  <svg width="54" height="54" viewBox="0 0 54 54" dangerouslySetInnerHTML={{ __html: WORDMARK.match(/<g class="wm-mark">([\s\S]*?)<\/g><\/g>/)![1] + "</g>" }} />
                  <span style={{ font: `900 44px/1 ${SANS}`, letterSpacing: "-0.01em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Griff has entered the chat</span>
                </div>
              </div>
            )}

            {t >= griffAt && (
              <Message
                avatar={
                  <Tile bg={C.green}>
                    <GriffHead size={92} />
                  </Tile>
                }
                name="Griff"
                nameColor={C.green}
                tag="GOAT"
                time="4:54 PM"
                style={{ transform: `translateY(${(1 - griffIn) * 60}px)`, opacity: griffIn }}
              >
                {typing ? (
                  <span style={{ color: C.muted, font: `400 30px ${MONO}` }}>typing…</span>
                ) : (
                  GRIFF_LINE.map((word, i) => (
                    <span key={i} style={{ opacity: shown[i] ? 1 : 0 }}>
                      {word}{" "}
                    </span>
                  ))
                )}
              </Message>
            )}
            <div style={{ height: 10 }} />
          </div>

          {/* Input */}
          <div style={{ margin: 36, marginTop: 30, border: `2px solid ${typed > 0 && !sent ? C.green : C.line}`, background: C.bgDeep, padding: "26px 28px", display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ font: `500 38px ${SANS}`, color: typed > 0 && !sent ? C.cream : C.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
              {!sent && typed > 0 ? DEV_LINE.slice(0, typed) : `Message #${CHANNEL}`}
              {!sent && typed > 0 && <span style={{ color: C.green, opacity: caret ? 1 : 0 }}>▍</span>}
            </span>
            <span style={{ marginLeft: "auto", background: C.green, color: C.greenInk, font: `800 26px ${SANS}`, padding: "12px 20px 10px", textTransform: "uppercase" }}>Send</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: C.green, opacity: flash, mixBlendMode: "screen" }} />
    </div>
  );
};

export { io };
