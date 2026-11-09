import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ArmPose, Rig, RigPose, STAGE_H, STAGE_W, View } from "../rig/Rig";
import { ArmKey, armAt } from "../rig/timeline";
import { Layer, SVG } from "./Layer";
import { FPS, T, f, mouthAt, w } from "./timing";

// The two desk shots, drawn from the episode's scene SVGs at their own
// coordinates (scene units), seen through a 9:16 camera.
const W = 1080, H = 1920;
type Cam = { cx: number; cy: number; s: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.76, 0, 0.24, 1);
const mix = (a: Cam, b: Cam, k: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, s: a.s + (b.s - a.s) * k });

/** A stack of absolutely placed layers sharing one camera. */
const Shot: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{children}</div>
);
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
const BACK_CAM: Cam = { cx: 690, cy: 384, s: 2.5 };

/** Griff from behind at his desk, facing the monitor, typing. */
export const BackShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const k = interpolate(t, [T.chatEnd, T.backEnd], [0, 1], clamp);
  const cam = { ...BACK_CAM, s: BACK_CAM.s * (1 + k * 0.04) };
  const tap = Math.sin(frame * 2.1) * 1.2 + Math.sin(frame * 3.3) * 0.6; // typing, felt in the shoulders
  return (
    <Shot cam={cam}>
      <Svg cam={cam}>
        <Room name="back_0" />
        <Layer name="desktop_0" x={277} y={287} />
        <Layer name="grif_0" x={481} y={105 + tap * 0.4} />
        <Layer name="CHAIR_BACK_0" x={500} y={390} />
      </Svg>
    </Shot>
  );
};

// ---------------------------------------------------------- profile / front
// The rig, scaled and placed so its profile (view 270) sits on griff_90.
const RIG = { x: 531, y: -60, w: 775 };
const PROFILE: Cam = { cx: 770, cy: 288, s: 2.0 };
const FRONT_WIDE: Cam = { cx: 898, cy: 330, s: 1.46 };
// Wide enough for the gestures, which reach out to shoulder height.
const CLOSE: Cam = { cx: 898, cy: 330, s: 1.52 };

const pose = (shoulder: number, elbow: number, hand?: string): ArmPose => ({ shoulder, elbow, hand });
const REST = pose(0, 0);
const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });

// Screen-left arm (Griff's right hand): the two-finger "hey".
const LEFT: ArmKey[] = [key(0, REST), key(w("hey") - 0.12, pose(10, 122, "peace")), key(w("i", 1) + 0.15, REST)];
// Screen-right arm (Griff's left hand): the low open hand, the invitation.
const RIGHT: ArmKey[] = [
  key(0, REST),
  key(w("sprints") - 0.1, pose(2, 24, "turn-03")),
  key(w("hey") - 0.1, pose(2, 2)),
  key(w("shortcut") - 0.15, pose(2, 26, "turn-03")),
  key(w("come") - 0.4, pose(3, 4)),
  key(w("come") - 0.05, pose(3, 28, "turn-03")),
  key(T.closeOut[0], REST),
];

/** Brows (screen sides) and head per beat: one brow up and a smirk, he knows the ending. */
const face = (t: number) => {
  const beats: [number, { l: number; r: number; tilt: number; nod: number }][] = [
    [0, { l: 2, r: 2, tilt: 0, nod: 0 }],
    [T.landed + 0.1, { l: 0, r: 14, tilt: -3, nod: 0 }],
    [w("hey"), { l: 8, r: 8, tilt: 2, nod: -3 }],
    [w("might"), { l: 0, r: 12, tilt: -2, nod: 0 }],
    [w("come"), { l: 5, r: 9, tilt: 1, nod: -2 }],
    [w("goat"), { l: 8, r: 8, tilt: 0, nod: -4 }],
  ];
  let i = 0;
  while (i + 1 < beats.length && beats[i + 1][0] <= t) i++;
  const [at, cur] = beats[i];
  const prev = beats[Math.max(0, i - 1)][1];
  const k = interpolate(t, [at, at + 0.25], [0, 1], { ...clamp, easing: io });
  const lerp = (a: number, b: number) => a + (b - a) * k;
  return { l: lerp(prev.l, cur.l), r: lerp(prev.r, cur.r), tilt: lerp(prev.tilt, cur.tilt), nod: lerp(prev.nod, cur.nod) };
};

/** Which way Griff faces: the drawn profile (typing) or the rig's views. */
const viewAt = (t: number): "typing" | View => {
  const fr = Math.round(t * FPS);
  const a = f(T.turnIn), b = f(T.turnOut);
  if (fr < a) return "typing";
  if (fr < b) {
    const d = fr - a;
    return d < 2 ? "270" : d < 5 ? "315" : "000";
  }
  const d = fr - b;
  return d < 3 ? "315" : d < 6 ? "270" : "typing";
};

export const DeskShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const view = viewAt(t);

  // Camera: profile while typing, pans to the front as he swivels, pushes in
  // to talk, and pulls back out before he swivels back.
  let cam = PROFILE;
  if (t >= T.turnIn) cam = mix(PROFILE, FRONT_WIDE, interpolate(t, [T.turnIn, T.landed + 0.1], [0, 1], { ...clamp, easing: io }));
  if (t >= T.closeIn[0]) cam = mix(FRONT_WIDE, CLOSE, interpolate(t, [T.closeIn[0], T.closeOut[0]], [0, 1], clamp)); // a slow push while he talks
  if (t >= T.closeOut[0]) cam = mix(CLOSE, FRONT_WIDE, interpolate(t, [T.closeOut[0], T.closeOut[1]], [0, 1], { ...clamp, easing: io }));
  if (t >= T.turnOut) cam = mix(FRONT_WIDE, PROFILE, interpolate(t, [T.turnOut, T.backAtDesk], [0, 1], { ...clamp, easing: io }));

  // The chair turns with him: its side view squeezes away as he comes round
  // (from the front it is hidden behind him) and opens again as he goes back.
  const fa = f(T.turnIn), fb = f(T.turnOut);
  const chairK =
    frame < fb ? interpolate(frame, [fa, fa + 3], [1, 0], clamp) : interpolate(frame, [fb + 3, fb + 6], [0, 1], clamp);

  // Typing: the hand taps on the keys.
  const typing = view === "typing";
  const tap = typing ? Math.max(0, Math.sin(frame * 1.9)) * 2.2 + Math.max(0, Math.sin(frame * 2.7 + 1)) * 1.4 : 0;

  // Landing: a small overshoot as the swivel stops.
  const land = (fr: number) => interpolate(frame, [fr, fr + 3, fr + 9], [0, 1, 0], clamp);
  const settle = land(fa + 5) + land(fb + 6) * 0.7;

  const h = face(t);
  const rigPose: RigPose = {
    view: view === "typing" ? "270" : view,
    arms: {
      l: { ...armAt(frame, FPS, LEFT), shoulder: armAt(frame, FPS, LEFT).shoulder + Math.sin(t * 0.7) * 1 },
      r: { ...armAt(frame, FPS, RIGHT), shoulder: armAt(frame, FPS, RIGHT).shoulder + Math.sin(t * 0.7 + 2) * 1 },
    },
    head: { tilt: h.tilt + Math.sin(t * 0.8) * 0.6, nod: h.nod + Math.sin(t * 2.1) * 0.8 },
    face: { mouth: view === "000" ? mouthAt(t) : "X", brows: { l: h.l, r: h.r }, browShape: { r: { arch: h.r > 8 ? 4 : 1 } } },
    body: { lift: Math.sin(t * 1.6) * 1 + settle * -6 },
  };

  const px = (x: number) => (x - (cam.cx - W / 2 / cam.s)) * cam.s;
  const py = (y: number) => (y - (cam.cy - H / 2 / cam.s)) * cam.s;
  const chairCx = 1150; // the chair's back: it swings round behind him

  return (
    <Shot cam={cam}>
      <Svg cam={cam}>
        <Room name="back_90" />
        <Layer name="desktop_90" x={0} y={332} />
        {typing && (
          <>
            {/* The drawn profile, with the typing hand split off so it can tap. */}
            <clipPath id="ep1-nohand">
              <path d="M0 -40 H533 V800 H0 V640 H190 V540 H0 Z" />
            </clipPath>
            <clipPath id="ep1-hand">
              <rect x={0} y={540} width={190} height={100} />
            </clipPath>
            <g transform="translate(555 0)">
              <g clipPath="url(#ep1-nohand)">
                <Layer name="griff_90" />
              </g>
              <g clipPath="url(#ep1-hand)" transform={`translate(0 ${-tap})`}>
                <Layer name="griff_90" />
              </g>
            </g>
          </>
        )}
      </Svg>
      {!typing && (
        <div
          style={{
            position: "absolute",
            left: px(RIG.x),
            top: py(RIG.y),
            width: RIG.w * cam.s,
            height: ((RIG.w * STAGE_H) / STAGE_W) * cam.s,
            transform: `scaleX(${1 + settle * 0.025})`,
            transformOrigin: "50% 40%",
          }}
        >
          <Rig pose={rigPose} id="ep1" />
        </div>
      )}
      <Svg cam={cam}>
        {chairK > 0 && (
          <g opacity={chairK} transform={`translate(${chairCx} 0) scale(${chairK} 1) translate(${-chairCx} 0)`}>
            <Layer name="chair_90" x={620} y={318} />
          </g>
        )}
      </Svg>
    </Shot>
  );
};
