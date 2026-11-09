import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Rig, RigPose, STAGE_H, STAGE_W, View } from "../rig/Rig";
import { Layer, SVG } from "./Layer";
import { FPS, T, mouthAt, w } from "./timing";

// The two desk shots, drawn from the episode's scene SVGs at their own
// coordinates (scene units), seen through a 9:16 camera.
const W = 1080, H = 1920;
type Cam = { cx: number; cy: number; s: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.76, 0, 0.24, 1);
const mix = (a: Cam, b: Cam, k: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, s: a.s + (b.s - a.s) * k });
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: io });

const viewBox = (c: Cam) => `${c.cx - W / 2 / c.s} ${c.cy - H / 2 / c.s} ${W / c.s} ${H / c.s}`;
const Svg: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <svg viewBox={viewBox(cam)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} preserveAspectRatio="none">
    {children}
  </svg>
);
/** The room's radial gradient carried past the art's edges (the 9:16 frame is taller). */
const Room: React.FC<{ name: string }> = ({ name }) => {
  const id = SVG[name].inner.match(/id="(paint0_radial_[^"]+)"/)![1];
  return (
    <>
      <rect x={-1500} y={-1500} width={4400} height={3800} fill={`url(#${id})`} />
      <Layer name={name} />
    </>
  );
};

// ---------------------------------------------------------------- back view
// grif_0 split into its parts: legs + everything else, and the two sleeves
// (paths 2–3 and 4–5), so only the arms move.
const GRIF0 = SVG.grif_0.inner.split(/(?=<path)/);
const BACK_BODY = [GRIF0[0], GRIF0[1], ...GRIF0.slice(6)].join("");
const SLEEVE_L = GRIF0[2] + GRIF0[3];
const SLEEVE_R = GRIF0[4] + GRIF0[5];
const Markup: React.FC<{ html: string; transform?: string }> = ({ html, transform }) => (
  <g transform={transform} fill="none" dangerouslySetInnerHTML={{ __html: html }} />
);

/** Griff from behind at his desk, facing the monitor, typing: only the arms move. */
export const BackShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam: Cam = { cx: 690, cy: 384, s: 2.5 * (1 + ramp(t, 0, T.chatFrom) * 0.05) };
  // Unhurried typing: each upper arm rocks a degree or so at the shoulder, out of step.
  const rockL = Math.sin(t * 2 * Math.PI * 1.6) * 0.9 + Math.sin(t * 2 * Math.PI * 0.45) * 0.4;
  const rockR = Math.sin(t * 2 * Math.PI * 1.4 + 2) * 0.9 + Math.sin(t * 2 * Math.PI * 0.4 + 1) * 0.4;
  const X = 481, Y = 105;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Svg cam={cam}>
        <Room name="back_0" />
        <Layer name="desktop_0" x={277} y={287} />
        <g transform={`translate(${X} ${Y})`}>
          {/* Sleeves first: the jacket covers their tops, as in the drawing. */}
          <Markup html={SLEEVE_L} transform={`rotate(${-rockL} 72 322)`} />
          <Markup html={SLEEVE_R} transform={`rotate(${rockR} 347 322)`} />
          <Markup html={BACK_BODY} />
        </g>
        <Layer name="CHAIR_BACK_0" x={500} y={390} />
      </Svg>
    </div>
  );
};

// ------------------------------------------------------------- profile shot
// The rig's head, scaled and placed so its profile (view 270) sits on griff_90's neck.
const RIG = { x: 531, y: -60, w: 775 };
const TYPING: Cam = { cx: 770, cy: 288, s: 2.0 };
const THREE_Q: Cam = { cx: 840, cy: 260, s: 2.25 };
const FACE: Cam = { cx: 920, cy: 225, s: 3.3 };

/** What draws Griff: griff_90 itself (typing, face to the screen), griff_90's
 *  body under the rig's head (he turns his head to talk, still seated), or the
 *  whole rig (the close-up, chest and face to the camera; the chair is behind him). */
type Look = { mode: "typing" } | { mode: "head" | "full"; view: View };
const lookAt = (t: number): Look => {
  const zi = (T.zoomIn[0] + T.zoomIn[1]) / 2, zo = T.zoomOut[0] + 0.25;
  if (t < T.headIn || t >= T.headOut + 0.14) return { mode: "typing" };
  if (t >= T.headOut || t < T.headIn + 0.07) return { mode: "head", view: "270" }; // a frame or two in profile either side of the turn
  if (t >= zi - 0.1 && t < zi) return { mode: "full", view: "315" };
  if (t >= zi && t < zo) return { mode: "full", view: "000" };
  if (t >= zo && t < zo + 0.1) return { mode: "full", view: "315" };
  return { mode: "head", view: "315" };
};

type Brows = { l: number; r: number; tilt: number; nod: number };
/** Brows (screen sides) and head per beat: the knowing look, then the brows at work in the close-up. */
const BEATS: [number, Brows][] = [
  [0, { l: 0, r: 0, tilt: 0, nod: 0 }],
  [T.headIn + 0.1, { l: 0, r: 14, tilt: -2, nod: 0 }], // one brow up, he already knows the ending
  [w("sprints"), { l: -2, r: 16, tilt: -3, nod: 2 }],
  [T.zoomIn[1] - 0.15, { l: 0, r: 18, tilt: 2, nod: 0 }],
  [w("hey") - 0.05, { l: 16, r: 16, tilt: 3, nod: -3 }], // both flash up
  [w("hey") + 0.25, { l: 4, r: 6, tilt: 2, nod: 0 }],
  [w("griff") - 0.05, { l: -3, r: 15, tilt: -2, nod: 0 }], // cocky
  [w("might"), { l: 12, r: 12, tilt: 0, nod: 0 }], // the waggle
  [w("might") + 0.17, { l: 0, r: 0, tilt: 0, nod: 0 }],
  [w("might") + 0.34, { l: 13, r: 13, tilt: 0, nod: 0 }],
  [w("might") + 0.5, { l: 1, r: 1, tilt: 0, nod: 0 }],
  [w("shortcut") - 0.05, { l: -4, r: 18, tilt: -4, nod: 2 }],
  [w("shortcut") + 0.9, { l: -2, r: 10, tilt: -2, nod: 0 }],
  [w("come") - 0.1, { l: 9, r: 11, tilt: 2, nod: -2 }],
  [w("goat") - 0.05, { l: 6, r: 14, tilt: 0, nod: -4 }],
  [T.headOut, { l: 0, r: 0, tilt: 0, nod: 0 }],
];
const browsAt = (t: number): Brows => {
  let i = 0;
  while (i + 1 < BEATS.length && BEATS[i + 1][0] <= t) i++;
  const [at, cur] = BEATS[i];
  const prev = BEATS[Math.max(0, i - 1)][1];
  const k = interpolate(t, [at, at + 0.14], [0, 1], { ...clamp, easing: io });
  const lerp = (a: number, b: number) => a + (b - a) * k;
  return { l: lerp(prev.l, cur.l), r: lerp(prev.r, cur.r), tilt: lerp(prev.tilt, cur.tilt), nod: lerp(prev.nod, cur.nod) };
};

/** Griff in profile at the laptop. He turns only his head to talk; the camera pushes in to his face and back. */
export const ProfileShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const look = lookAt(t);

  let cam = TYPING;
  cam = mix(cam, THREE_Q, ramp(t, T.headIn, T.headIn + 0.6) * (1 - ramp(t, T.headOut, T.headOut + 0.6)));
  cam = mix(cam, FACE, ramp(t, T.zoomIn[0], T.zoomIn[1]) * (1 - ramp(t, T.zoomOut[0], T.zoomOut[1])));

  // Typing while his face is to the screen, at an easy pace; the hand rests while he talks.
  const typing = look.mode === "typing";
  const tap = typing ? Math.max(0, Math.sin(t * 2 * Math.PI * 2.2)) * 1.8 + Math.max(0, Math.sin(t * 2 * Math.PI * 1.3 + 1)) * 0.9 : 0;

  const b = browsAt(t);
  const pose: RigPose = {
    view: look.mode === "full" ? look.view : "270",
    headView: look.mode === "typing" ? "270" : look.view,
    arms: {},
    head: { tilt: b.tilt + Math.sin(t * 0.8) * 0.6, nod: b.nod + Math.sin(t * 2.1) * 0.8 },
    face: { mouth: mouthAt(t), brows: { l: b.l, r: b.r }, browShape: { l: { arch: b.l > 8 ? 3 : 1 }, r: { arch: b.r > 8 ? 4 : 1 } } },
  };

  const px = (x: number) => (x - (cam.cx - W / 2 / cam.s)) * cam.s;
  const py = (y: number) => (y - (cam.cy - H / 2 / cam.s)) * cam.s;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Svg cam={cam}>
        <Room name="back_90" />
        <Layer name="desktop_90" x={0} y={332} />
        {/* griff_90 split three ways: the head (gone while the rig's head talks), the typing hand, the rest. */}
        <clipPath id="ep1-body">
          <path d="M0 420 H250 L262 300 L455 240 H533 V900 H0 Z" />
        </clipPath>
        <clipPath id="ep1-nohand">
          <path d="M0 -60 H533 V900 H0 V640 H190 V540 H0 Z" />
        </clipPath>
        <clipPath id="ep1-hand">
          <rect x={0} y={540} width={190} height={100} />
        </clipPath>
        <g transform="translate(555 0)">
          <g clipPath={typing ? undefined : "url(#ep1-body)"} opacity={look.mode === "full" ? 0 : 1}>
            <g clipPath="url(#ep1-nohand)">
              <Layer name="griff_90" />
            </g>
            <g clipPath="url(#ep1-hand)" transform={`translate(0 ${-tap})`}>
              <Layer name="griff_90" />
            </g>
          </g>
        </g>
      </Svg>
      {!typing && (
        <div style={{ position: "absolute", left: px(RIG.x), top: py(RIG.y), width: RIG.w * cam.s, height: ((RIG.w * STAGE_H) / STAGE_W) * cam.s }}>
          <Rig pose={pose} id="ep1" only={look.mode === "head" ? ["head"] : undefined} />
        </div>
      )}
      <Svg cam={cam}>
        {look.mode !== "full" && <Layer name="chair_90" x={620} y={318} />}
      </Svg>
    </div>
  );
};
