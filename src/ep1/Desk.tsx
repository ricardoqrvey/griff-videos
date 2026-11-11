import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig, RigPose, STAGE_H, STAGE_W, View } from "../rig/Rig";
import { Layer, SVG } from "./Layer";
import { FPS, T, mouthAt, w } from "./timing";
import { BLUR, PUSH, camEase, enterK, exitK } from "./transitions";

// The two desk shots, drawn from the episode's scene SVGs at their own
// coordinates (scene units), seen through a camera that fills the frame
// (9:16 or 16:9; each format has its own framings).
type Cam = { cx: number; cy: number; s: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.76, 0, 0.24, 1);
const mix = (a: Cam, b: Cam, k: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, s: a.s + (b.s - a.s) * k });
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: camEase });

const useSize = () => {
  const { width: W, height: H } = useVideoConfig();
  return { W, H, wide: W > H };
};
const Svg: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const { W, H } = useSize();
  return (
    <svg viewBox={`${cam.cx - W / 2 / cam.s} ${cam.cy - H / 2 / cam.s} ${W / cam.s} ${H / cam.s}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} preserveAspectRatio="none">
      {children}
    </svg>
  );
};
const far = (x: number, y: number, dx: number, dy: number) => [x, y, x + dx * 40, y + dy * 40];
const WALLS: Record<string, number[][]> = {
  back_90: [
    [154, 0, 154, -3000],
    [1261, 0, 1261, -3000],
    far(153.4, 584.9, -157, 70),
    far(1259.6, 584.9, 157, 70),
  ],
  back_0: [
    [156, 0, 156, -3000],
    far(155.4, 698.9, -157, 70),
    [1375, 699, 4000, 699],
  ],
};

/** The room's radial gradient carried past the art's edges (the 9:16 frame is taller). */
const Room: React.FC<{ name: string }> = ({ name }) => {
  const id = SVG[name].inner.match(/id="(paint0_radial_[^"]+)"/)![1];
  return (
    <>
      <rect x={-1500} y={-1500} width={4400} height={3800} fill={`url(#${id})`} />
      <Layer name={name} />
      {/* The room's corner lines run on past the art, to the frame's edges. */}
      <g stroke="black" strokeWidth={2}>
        {WALLS[name]?.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
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
  const { wide } = useSize();
  const base: Cam = wide ? { cx: 690, cy: 384, s: 1.45 } : { cx: 690, cy: 384, s: 2.5 };
  // A slow drift in, then the push through to the chat.
  const out = exitK(t, T.chatFrom);
  const cam: Cam = { ...base, s: base.s * (1 + (t / T.chatFrom) * 0.05) * (1 + out * PUSH) };
  // Unhurried typing: each upper arm rocks a degree or so at the shoulder, out of step.
  const rockL = Math.sin(t * 2 * Math.PI * 1.6) * 0.9 + Math.sin(t * 2 * Math.PI * 0.45) * 0.4;
  const rockR = Math.sin(t * 2 * Math.PI * 1.4 + 2) * 0.9 + Math.sin(t * 2 * Math.PI * 0.4 + 1) * 0.4;
  const X = 481, Y = 105;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: out > 0 ? `blur(${out * BLUR}px)` : undefined }}>
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
const CAMS = {
  tall: {
    TYPING: { cx: 770, cy: 288, s: 2.0 },
    THREE_Q: { cx: 840, cy: 260, s: 2.25 },
    FACE: { cx: 920, cy: 225, s: 3.3 },
    FACE_EASED: { cx: 918, cy: 262, s: 2.75 },
  },
  wide: {
    // The frame is short: keep headroom for the horns.
    TYPING: { cx: 720, cy: 330, s: 1.35 },
    THREE_Q: { cx: 860, cy: 240, s: 1.85 },
    FACE: { cx: 912, cy: 195, s: 2.3 },
    FACE_EASED: { cx: 905, cy: 225, s: 2.0 },
  },
} satisfies Record<string, Record<string, Cam>>;

/** What draws Griff: the drawn profile body (griff_90, typing) under the
 *  rig's head — always the rig's head, griff_90's own is cut off at the top of
 *  its canvas — or the whole rig, turned to 3/4 or to the front, to talk. The
 *  head leads the body by a couple of frames on the way in and out. */
type Look = { mode: "drawn" | "full" | "tween"; view: View };
/** The 3/4 ↔ profile in-between (griff_070, mirrored like the rig's 315), held a few frames. */
const TWEEN = 0.1;
export const TWEEN_AX = 452; // its torso's centre on its canvas, as the rig's anchorX
/** The view swaps, each placed mid camera move so the move carries it. */
const ZI = (T.zoomIn[0] + T.zoomIn[1]) / 2;
const ZO = (T.zoomOut[0] + T.zoomOut[1]) / 2;
const lookAt = (t: number): Look => {
  if (t < T.headIn || t >= T.headOut + TWEEN) return { mode: "drawn", view: "270" };
  if (t < T.headIn + TWEEN || t >= T.headOut) return { mode: "tween", view: "315" };
  if (t >= ZI && t < ZO) return { mode: "full", view: "000" };
  return { mode: "full", view: "315" };
};
/** Each swap: when, and which way he turns (+1 toward the camera, −1 away). */
const SWAPS: [number, number][] = [
  [T.headIn, 1],
  [ZI, 1],
  [ZO, -1],
  [T.headOut, -1],
];
/** A turn read as a turn, not a jump: a small dip against the turn before
 *  the swap, a two-frame smear through it, a settle past it after. */
const turnAt = (t: number) => {
  let tilt = 0, nod = 0, smear = 0, sway = 0;
  for (const [at, dir] of SWAPS) {
    const d = t - at;
    // Anticipation: tilt away and dip, 0.2 s before.
    const ant = interpolate(d, [-0.22, -0.06, 0], [0, 1, 0.4], clamp);
    tilt -= dir * ant * 3;
    nod += ant * 2.5;
    // Smear: a short blur over the swap (through the in-between, on the profile turns).
    const span = at === T.headIn || at === T.headOut ? TWEEN : 0;
    smear = Math.max(smear, interpolate(d, [-0.06, span / 2, span + 0.06], [0, 1, 0], clamp));
    // Settle: a damped overshoot past the new view.
    if (d > 0) {
      const k = Math.exp(-d * 7) * Math.sin(d * 2 * Math.PI * 1.8);
      tilt += dir * k * 4;
      sway += dir * k;
    }
  }
  return { tilt, nod, smear, sway };
};

// griff_90's two sleeve fills (upper arm, forearm), painted again over the
// elbow so the forearm's outline doesn't cut across the upper arm.
const G90 = SVG.griff_90.inner.split(/(?=<path)/);
const sleeveD = (start: string) => G90.find((p) => p.includes(start))!.match(/ d="([^"]+)"/)![1];
const UPPER_ARM = sleeveD("M390.414 365.289");
const FOREARM = sleeveD("M299.736 490.581");

type Brows = { l: number; r: number; tilt: number; nod: number };
/** Brows (screen sides) and head per beat: the knowing look, then the brows at work in the close-up. */
const BEATS: [number, Brows][] = [
  [0, { l: 0, r: 0, tilt: 0, nod: 0 }],
  [T.headIn + 0.1, { l: 0, r: 14, tilt: -2, nod: 0 }], // one brow up, he already knows the ending
  [w("sprints"), { l: -2, r: 16, tilt: -3, nod: 2 }],
  [T.zoomIn[1] - 0.15, { l: 0, r: 18, tilt: 2, nod: 0 }],
  [w("hey") - 0.05, { l: 8, r: 11, tilt: 2, nod: -1 }], // an easy lift, not a flash
  [w("hey") + 0.3, { l: 2, r: 9, tilt: 1, nod: 0 }], // the beat before his name
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
  const { W, H, wide } = useSize();
  const { TYPING, THREE_Q, FACE, FACE_EASED } = CAMS[wide ? "wide" : "tall"];

  // Each move starts a little before its view swap, so the swap falls mid move.
  let cam = TYPING;
  cam = mix(cam, THREE_Q, ramp(t, T.headIn - 0.3, T.headIn + 0.45) * (1 - ramp(t, T.headOut - 0.3, T.headOut + 0.45)));
  cam = mix(cam, FACE, ramp(t, T.zoomIn[0], T.zoomIn[1]) * (1 - ramp(t, T.zoomOut[0], T.zoomOut[1])));
  // After "Hey, I'm Griff" the close-up eases back a little, for rhythm.
  const ease = ramp(t, w("griff") + 0.45, w("griff") + 1.25) * (1 - ramp(t, T.zoomOut[0], T.zoomOut[1]));
  cam = mix(cam, FACE_EASED, ease);
  // Zoom-through from the chat: the cut lands pushed in and settles.
  const enter = enterK(t, T.chatEnd);
  cam = { ...cam, s: cam.s * (1 + enter * PUSH) };
  const turn = turnAt(t);

  // Typing while his face is to the screen, at an easy pace.
  const typing = look.mode === "drawn" && look.view === "270";
  const tap = typing ? Math.max(0, Math.sin(t * 2 * Math.PI * 2.2)) * 1.8 + Math.max(0, Math.sin(t * 2 * Math.PI * 1.3 + 1)) * 0.9 : 0;

  const b = browsAt(t);
  const pose: RigPose = {
    view: look.mode === "full" ? look.view : "270",
    headView: look.view,
    arms: {},
    head: { tilt: b.tilt + turn.tilt + Math.sin(t * 0.8) * 0.6, nod: b.nod + turn.nod + Math.sin(t * 2.1) * 0.8 },
    face: { mouth: mouthAt(t), brows: { l: b.l, r: b.r }, browShape: { l: { arch: b.l > 8 ? 3 : 1 }, r: { arch: b.r > 8 ? 4 : 1 } } },
  };

  const px = (x: number) => (x - (cam.cx - W / 2 / cam.s)) * cam.s;
  const py = (y: number) => (y - (cam.cy - H / 2 / cam.s)) * cam.s;

  const blur = enter * BLUR + turn.smear * 2.5;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      <Svg cam={cam}>
        <Room name="back_90" />
        <Layer name="desktop_90" x={0} y={332} />
        {/* griff_90 without its head (the rig's goes on top), the typing hand split off so it can tap. */}
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
          {look.mode === "drawn" && (
            <g clipPath="url(#ep1-body)">
              <g clipPath="url(#ep1-nohand)">
                <Layer name="griff_90" />
              </g>
              <g clipPath="url(#ep1-hand)" transform={`translate(0 ${-tap})`}>
                <Layer name="griff_90" />
              </g>
              <clipPath id="ep1-elbow">
                <rect x={250} y={430} width={220} height={240} />
              </clipPath>
              <g clipPath="url(#ep1-elbow)" fill="#CF2E9E">
                <path d={UPPER_ARM} />
                <path d={FOREARM} />
              </g>
              {/* One fold from the inside corner into the elbow, as on the rig. */}
              <path d="M288 495 Q326 486 350 505" fill="none" stroke="#111" strokeWidth={3.6} strokeLinecap="round" />
            </g>
          )}
        </g>
        {/* Turned to talk, the chair is behind him. */}
        {look.mode !== "drawn" && look.view === "315" && <Layer name="chair_90" x={620} y={318} />}
      </Svg>
      <div style={{ position: "absolute", left: px(RIG.x), top: py(RIG.y), width: RIG.w * cam.s, height: ((RIG.w * STAGE_H) / STAGE_W) * cam.s, transform: look.mode !== "drawn" ? `translateX(${turn.sway * 6 * cam.s}px)` : undefined }}>
        {look.mode === "tween" ? (
          <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width="100%" height="100%" overflow="visible">
            <g transform={`translate(${STAGE_W / 2} 0) scale(-1 1) translate(${-TWEEN_AX} 0)`} dangerouslySetInnerHTML={{ __html: SVG.griff_070.inner }} />
          </svg>
        ) : (
          <Rig pose={pose} id="ep1" only={look.mode === "drawn" ? ["head"] : undefined} />
        )}
      </div>
      <Svg cam={cam}>
        {look.mode === "drawn" && <Layer name="chair_90" x={620} y={318} />}
      </Svg>
    </div>
  );
};
