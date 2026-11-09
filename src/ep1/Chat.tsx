import { Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig, STAGE_H, STAGE_W } from "../rig/Rig";
import { C, MONO, SANS } from "./brand";
import { FPS, GRIFF_SEND, T, w } from "./timing";
import { WORDMARK } from "./wordmark";

// The developer chat, dressed as GOAT IQ: near-black canvas, flat surfaces,
// square corners, hard offset shadows, Archivo with Space Mono for metadata.
const CHANNEL = "dashboard-squad";
const DEV_LINE = "Should be a quick dashboard project.";
const GRIFF_LINE = ["Someone", "say", "quick", "dashboard?"];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.76, 0, 0.24, 1);

/** A photo avatar: the image framed on the face (`pos` = background-position, `zoom` = background-size). */
const Photo: React.FC<{ src: string; pos?: string; zoom?: string }> = ({ src, pos = "50% 50%", zoom = "cover" }) => (
  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile(src)})`, backgroundSize: zoom, backgroundPosition: pos }} />
);

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
      <div style={{ font: `500 var(--msg, 50px)/1.22 ${SANS}`, color: C.cream, marginTop: 8 }}>{children}</div>
    </div>
  </div>
);

/** Desktop only (16:9): channels and direct messages down the left. */
const Sidebar: React.FC<{ t: number }> = ({ t }) => {
  const item = (label: React.ReactNode, active = false, key?: string) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 30px", font: `${active ? 800 : 500} 30px ${SANS}`, color: active ? C.cream : C.muted, background: active ? "#1f1f25" : undefined, borderLeft: `6px solid ${active ? C.green : "transparent"}` }}>
      {label}
    </div>
  );
  const head = (label: string) => (
    <div style={{ padding: "30px 36px 12px", font: `700 18px ${MONO}`, letterSpacing: "0.08em", color: C.muted }}>{label}</div>
  );
  const dm = (name: string, avatar: React.ReactNode, online = true) => (
    <>
      <div style={{ width: 40, height: 40, position: "relative", overflow: "hidden", flex: "none" }}>{avatar}</div>
      <span>{name}</span>
      <span style={{ marginLeft: "auto", width: 12, height: 12, background: online ? C.green : C.line }} />
    </>
  );
  return (
    <div style={{ width: 380, flex: "none", background: C.bgDeep, borderRight: `2px solid ${C.line}` }}>
      {head("CHANNELS")}
      {["general", CHANNEL, "releases", "random"].map((c) => item(<><span style={{ color: C.green }}>#</span> {c}</>, c === CHANNEL, c))}
      {head("DIRECT MESSAGES")}
      {item(dm("Jess", <Photo src="ep1/avatars/jess.jpg" pos="53% 38%" zoom="175%" />), false, "jess")}
      {item(dm("Mike", <Photo src="ep1/avatars/mike.png" />), false, "mike")}
      {t >= T.notify && item(dm("Griff", <div style={{ position: "absolute", inset: 0, background: C.green }}><GriffHead size={40} /></div>), false, "griff")}
    </div>
  );
};

export const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { width, height } = useVideoConfig();
  const wide = width > height;

  // The window rises in, then leaves with a fast push toward the camera.
  const enter = spring({ frame: frame - Math.round(T.chatFrom * FPS), fps: FPS, config: { damping: 200 }, durationInFrames: 14 });
  const pop = (at: number) => spring({ frame: frame - Math.round(at * FPS), fps: FPS, config: { damping: 18, stiffness: 220 } });
  const jessIn = pop(T.jess), mikeIn = pop(T.mike);
  const leave = interpolate(t, [T.chatEnd - 0.3, T.chatEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  // Mike is typing (the indicator), then his line lands.
  const mikeTyping = t >= T.typeFrom && t < T.send;
  const sent = t >= T.send;
  const devIn = spring({ frame: frame - Math.round(T.send * FPS), fps: FPS, config: { damping: 18, stiffness: 220 } });

  // GRIFF HAS ENTERED THE CHAT slams in.
  const nf = frame - Math.round(T.notify * FPS);
  const notifyIn = spring({ frame: nf, fps: FPS, config: { damping: 13, stiffness: 260 } });
  const flash = interpolate(nf, [0, 2, 8], [0, 0.35, 0], clamp);

  // Griff types his line in the input as he says it, then sends it.
  const line = GRIFF_LINE.join(" ");
  const griffTyped = Math.round(interpolate(t, [w("someone") - 0.05, GRIFF_SEND - 0.12], [0, line.length], clamp));
  const griffSent = t >= GRIFF_SEND;
  const griffIn = pop(GRIFF_SEND);
  const inputLive = griffTyped > 0 && !griffSent;

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
          // 16:9: the same window, scaled down to fit the height.
          ...(wide ? { left: 60, top: 54, width: 1782, height: 954 } : { left: 64, top: 300, width: 952, height: 1300 }),
          transform: `translateY(${(1 - enter) * 220}px) scale(${1 + leave * 0.5})`,
          opacity: enter * (1 - leave),
          transformOrigin: wide ? "50% 50%" : "50% 70%",
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

          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {wide && <Sidebar t={t} />}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Log */}
          <div style={{ flex: 1, padding: wide ? "24px 40px 0" : "40px 40px 0", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: wide ? 20 : 40, overflow: "hidden", ...(wide ? { "--msg": "42px" } : {}) } as React.CSSProperties}>
            {t >= T.jess && (
              <Message avatar={<Tile bg={C.cyan}><Photo src="ep1/avatars/jess.jpg" pos="53% 38%" zoom="175%" /></Tile>} name="Jess" time="4:52 PM" style={{ transform: `translateY(${(1 - jessIn) * 60}px)`, opacity: jessIn }}>
                Sales wants customer analytics in the app. Who's taking it?
              </Message>
            )}
            {t >= T.mike && (
              <Message avatar={<Tile bg={C.purple}><Photo src="ep1/avatars/mike.png" /></Tile>} name="Mike" time="4:53 PM" style={{ transform: `translateY(${(1 - mikeIn) * 60}px)`, opacity: mikeIn }}>
                I can pick it up this sprint.
              </Message>
            )}
            {sent && (
              <Message
                avatar={<Tile bg={C.purple}><Photo src="ep1/avatars/mike.png" /></Tile>}
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

            {griffSent && (
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
                {line}
              </Message>
            )}
            {mikeTyping && <span style={{ font: `400 28px ${MONO}`, color: C.muted, marginLeft: 118 }}>Mike is typing…</span>}
            <div style={{ height: 10 }} />
          </div>

          {/* Input */}
          <div style={{ margin: 36, marginTop: 30, border: `2px solid ${inputLive ? C.green : C.line}`, background: C.bgDeep, padding: "26px 28px", display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ font: `500 38px ${SANS}`, color: inputLive ? C.cream : C.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
              {inputLive ? line.slice(0, griffTyped) : `Message #${CHANNEL}`}
              {inputLive && <span style={{ color: C.green, opacity: caret ? 1 : 0 }}>▍</span>}
            </span>
            <span style={{ marginLeft: "auto", background: C.green, color: C.greenInk, font: `800 26px ${SANS}`, padding: "12px 20px 10px", textTransform: "uppercase" }}>Send</span>
          </div>
          </div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: C.green, opacity: flash, mixBlendMode: "screen" }} />
    </div>
  );
};

export { io };
