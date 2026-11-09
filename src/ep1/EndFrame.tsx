import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "./brand";
import { FPS, T } from "./timing";
import { WORDMARK } from "./wordmark";

// End frame: the GOAT IQ wordmark builds as in the product tour's finale (the
// green horn mark spins in, GOAT wipes on, IQ pops), then the tagline and URL.
const io = Easing.bezier(0.76, 0, 0.24, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const EndFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS - T.endFrom;
  const k = (a: number, d: number) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: io });
  const mark = k(0.1, 0.9), goat = k(0.3, 0.6), iq = k(0.65, 0.5);
  const line = (a: number) => ({ transform: `translateY(${(1 - k(a, 0.6)) * 108}%)`, display: "block" });
  const css = `
    .ep1-wm svg { width: 100%; height: auto; display: block; overflow: visible; }
    .ep1-wm .wm-mark { transform-box: fill-box; transform-origin: 50% 50%; opacity: ${mark}; transform: rotate(${(1 - mark) * -160}deg) scale(${0.3 + mark * 0.7}); }
    .ep1-wm .wm-goat { clip-path: inset(0 ${(1 - goat) * 100}% 0 0); }
    .ep1-wm .wm-iq { transform-box: fill-box; transform-origin: 0% 100%; opacity: ${iq}; transform: translateY(${(1 - iq) * 40}%) scale(${0.7 + iq * 0.3}); }
  `;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
      <style>{css}</style>
      <div className="ep1-wm" style={{ width: 760 }} dangerouslySetInnerHTML={{ __html: WORDMARK }} />
      <div style={{ marginTop: 70, textAlign: "center", font: `800 58px/1.0 ${SANS}`, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.cream }}>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={line(1.1)}>AI-powered</span>
        </span>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={line(1.25)}>embedded analytics</span>
        </span>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={{ ...line(1.4), color: C.green }}>for Google Cloud.</span>
        </span>
      </div>
      <div style={{ marginTop: 80, overflow: "hidden", padding: "4px 4px 8px" }}>
        <span style={{ ...line(1.7), font: `700 48px ${MONO}`, color: C.cream, letterSpacing: "0.02em", background: C.surface, border: `2px solid ${C.green}`, padding: "18px 34px", display: "inline-block" }}>
          goatiq.ai
        </span>
      </div>
    </div>
  );
};
