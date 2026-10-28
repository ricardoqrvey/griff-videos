import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { shapeAt, WORDS } from "./performance";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";
import { ArmKey, armAt } from "./rig/timeline";

// Griff presenting, front view, waist up, 1:1. Every gesture answers a line:
// open hand to introduce, shrug for "good luck", fingers to count the list,
// a wag for "not next quarter", a frown for "no excuses", rock for the name.
const FPS = 30;

/** Seconds where the nth occurrence of a word starts (case and punctuation ignored). */
const w = (word: string, nth = 0) => WORDS.filter((x) => x.text.toLowerCase().replace(/[^a-z0-9-]/g, "") === word)[nth].start;
const f = (sec: number) => Math.round(sec * FPS);

const REST: ArmPose = { shoulder: 0, elbow: 0 };
// Open palm toward the camera: the presenting hand.
const PALM = "turn-03";
// "Done": the thumbs-up drawn lying on its side, mirrored, on a low forearm.
const THUMB = "thumbs-up_000";

// The house style is the low, open gesture: forearm out to the side at hip
// height, palm open (the "good luck with that" shrug). The forearm comes all
// the way up only twice: the count, and the name at the end. The shoulder
// anchor never moves; the arm swings out from it a few degrees at a time.
const pose = (shoulder: number, elbow: number, hand?: string, mirrorHand?: boolean): ArmPose => ({ shoulder, elbow, hand, mirrorHand });
const low = (shoulder: number, elbow: number) => pose(shoulder, elbow, PALM);

const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });

// Screen-left arm (Griff's right hand): the shrug, the count, "Done", the close.
const LEFT: ArmKey[] = [
  key(w("adorable"), pose(7, 0)),
  key(w("good"), low(4, 30)),
  key(w("that") + 0.4, pose(1, 3)),
  key(w("build"), pose(8, 6)),
  key(w("sure"), pose(3, 2)),
  // Up #1: counting the DIY list.
  key(w("dashboards") - 0.1, pose(10, 120, "index-up")),
  key(w("multi-tenant"), pose(13, 124, "peace")),
  key(w("maintenance"), pose(16, 127, "three")),
  key(w("until"), pose(6, 40, "three")),
  key(w("or"), pose(2, 3)),
  key(w("done") - 0.1, pose(3, 52, THUMB, true)),
  key(w("nonsense"), pose(6, 4)),
  key(w("no", 2), pose(2, 2)),
  key(w("embedded", 1), low(4, 30)),
];

// Screen-right arm (Griff's left hand): the introduction, the GOAT IQ steps,
// "this afternoon", and the name.
const RIGHT: ArmKey[] = [
  key(w("your") - 0.1, low(6, 40)),
  key(w("baked"), low(8, 42)),
  key(w("app"), low(5, 36)),
  key(w("adorable"), pose(6, 3)),
  key(w("good"), low(0, 36)),
  key(w("that") + 0.4, pose(2, 2)),
  key(w("multi-tenant"), pose(7, 4)),
  key(w("until"), pose(1, 2)),
  key(w("drop"), low(8, 42)),
  key(w("plug"), low(6, 38)),
  key(w("embed"), low(9, 43)),
  key(w("let"), low(7, 40)),
  key(w("themselves"), pose(6, 6)),
  key(w("live"), low(8, 44)),
  key(w("not"), low(4, 36)),
  key(w("embedded"), pose(3, 3)),
  key(w("30"), pose(8, 5)),
  key(w("no", 2), pose(1, 2)),
  // Up #2: the name.
  key(w("goatiq", 1) - 0.1, pose(14, 126, "rock")),
  key(w("embedded", 1), low(5, 32)),
];

// Brows (px up; negative frowns) and head (degrees tilt, px nod), per beat.
type Face = { l: number; r: number; tilt: number; nod: number };
const FACE: [number, Face][] = [
  [0, { l: 5, r: 5, tilt: 0, nod: 0 }],
  [w("adorable"), { l: -3, r: 12, tilt: -4, nod: 0 }], // skeptical
  [w("good"), { l: 8, r: 8, tilt: -2, nod: -3 }], // shrug
  [w("build"), { l: 12, r: 12, tilt: 3, nod: 0 }], // question
  [w("sure"), { l: 0, r: 8, tilt: 0, nod: 0 }], // sarcasm
  [w("until"), { l: -4, r: -4, tilt: -3, nod: 2 }], // deadpan
  [w("or"), { l: 2, r: 2, tilt: 0, nod: 0 }],
  [w("goatiq"), { l: 10, r: 10, tilt: 2, nod: -3 }], // the answer
  [w("plug"), { l: 3, r: 3, tilt: 0, nod: 0 }],
  [w("done"), { l: 6, r: 6, tilt: 0, nod: -4 }],
  [w("no"), { l: 2, r: 2, tilt: -2, nod: 0 }], // "no ... no ..." small shake
  [w("no", 1), { l: 2, r: 8, tilt: 2, nod: 0 }],
  [w("live"), { l: 8, r: 8, tilt: 0, nod: 0 }],
  [w("embedded"), { l: 3, r: 3, tilt: 0, nod: 0 }],
  [w("30"), { l: 10, r: 10, tilt: 2, nod: -2 }],
  [w("no", 2), { l: -5, r: -5, tilt: 0, nod: 3 }], // no excuses
  [w("goatiq", 1), { l: 10, r: 10, tilt: -2, nod: -3 }],
  [w("ai-powered"), { l: 5, r: 5, tilt: 0, nod: 0 }],
];

const faceAt = (t: number): Face => {
  let i = 0;
  while (i + 1 < FACE.length && FACE[i + 1][0] <= t) i++;
  const [at, cur] = FACE[i];
  const prev = FACE[Math.max(0, i - 1)][1];
  const k = interpolate(t, [at, at + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const mix = (a: number, b: number) => a + (b - a) * k;
  return { l: mix(prev.l, cur.l), r: mix(prev.r, cur.r), tilt: mix(prev.tilt, cur.tilt), nod: mix(prev.nod, cur.nod) };
};

// A slow drift at shoulder and elbow so the arms never freeze (the wrist stays straight).
const idle = (p: ArmPose, t: number, phase: number): ArmPose => ({
  ...p,
  shoulder: p.shoulder + Math.sin(t * 0.7 + phase) * 1.2,
  elbow: p.elbow + Math.sin(t * 1.1 + phase) * 1.5,
});

export const GRIFF_PRESENT_FRAMES = Math.ceil(36.48 * FPS);

export const GriffPresent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const face = faceAt(t);

  const pose = {
    view: "000" as const,
    arms: { l: idle(armAt(frame, fps, LEFT), t, 0), r: idle(armAt(frame, fps, RIGHT), t, 2) },
    head: { tilt: face.tilt + Math.sin(t * 0.8) * 0.6, nod: face.nod + Math.sin(t * 2.1) * 0.8 },
    face: { mouth: shapeAt(t), brows: { l: face.l, r: face.r } },
  };

  // Waist up: horn tips to just below the jacket hem, with room for the hands at the sides.
  const k = width / 1080;
  const scale = 0.84 * k;
  const rigW = STAGE_W * scale;
  const push = 1 + t * 0.0015;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d3a26 0%, #101011 65%)", overflow: "hidden" }}>
      <Audio src={staticFile("audio/griff1.m4a")} />
      <div
        style={{
          position: "absolute",
          left: (width - rigW) / 2,
          top: -10 * scale,
          width: rigW,
          height: 1764 * scale,
          transformOrigin: `50% ${600 * scale}px`,
          transform: `scale(${push}) rotate(${Math.sin(t * 0.8) * 0.4}deg)`,
        }}
      >
        <Rig pose={pose} />
      </div>
    </AbsoluteFill>
  );
};
