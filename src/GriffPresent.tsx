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
// Forearm up from the elbow, hand at chest (LOW) or shoulder (UP) height.
const LOW = { shoulder: 4, elbow: 112 };
const UP = { shoulder: 6, elbow: 128 };
// Forearm out to the side at hip height: the shrug.
const SHRUG = { shoulder: 2, elbow: 32 };
// Open palm toward the camera: the presenting hand.
const PALM = "turn-03";
// The wrist never bends away from the forearm; emphasis comes from the elbow.
// `lift` raises (+) or drops (−) the forearm a few degrees from the base pose.
const OPEN = (lift = 0) => ({ ...LOW, elbow: LOW.elbow + lift, hand: PALM });
const show = (hand: string, lift = 0, pose = UP) => ({ ...pose, elbow: pose.elbow + lift, hand });

const key = (sec: number, pose: ArmPose): ArmKey => ({ at: f(sec), pose });

// Screen-left arm (Griff's right hand).
const LEFT: ArmKey[] = [
  key(w("good"), { ...SHRUG, hand: PALM }),
  key(w("that") + 0.4, REST),
  key(w("build"), show("index-up")),
  key(w("sure"), REST),
  key(w("dashboards") - 0.1, show("index-up")),
  key(w("multi-tenant"), show("peace")),
  key(w("maintenance"), show("three")),
  key(w("until"), show("three", -12)),
  key(w("or"), REST),
  key(w("done") - 0.1, show("ok")),
  key(w("nonsense"), REST),
  key(w("embedded"), OPEN()),
  key(w("herd"), OPEN(10)),
  key(w("engineers"), REST),
  key(w("goatiq", 1) - 0.1, show("rock")),
  key(w("ai-powered"), REST),
  key(w("embedded", 1), OPEN()),
];

// Screen-right arm (Griff's left hand).
const RIGHT: ArmKey[] = [
  key(w("your") - 0.1, OPEN()),
  key(w("baked"), OPEN(8)),
  key(w("app"), OPEN()),
  key(w("adorable"), REST),
  key(w("good"), { ...SHRUG, hand: PALM }),
  key(w("that") + 0.4, REST),
  key(w("got"), OPEN(-8)),
  key(w("dashboards") - 0.1, REST),
  key(w("drop"), OPEN(-6)),
  key(w("goatiq") - 0.05, show("index-up")),
  key(w("plug"), { ...LOW, hand: "fist" }),
  key(w("embed"), OPEN(6)),
  key(w("let"), { ...LOW, hand: "index-up" }),
  // "poke around": two small jabs of the forearm.
  key(w("poke"), { ...LOW, elbow: LOW.elbow + 8, hand: "index-up" }),
  key(w("around"), { ...LOW, elbow: LOW.elbow - 4, hand: "index-up" }),
  key(w("themselves"), REST),
  key(w("live"), show("index-up")),
  // "not next quarter": the finger wags with the forearm, not the wrist.
  key(w("not"), show("index-up", 10)),
  key(w("next"), show("index-up", -8)),
  key(w("quarter"), show("index-up", 10)),
  key(w("embedded"), REST),
  key(w("30"), show("three")),
  key(w("no", 2), REST),
  key(w("embedded", 1), OPEN()),
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

// A slow drift at the elbow so the arms never freeze (the wrist stays straight).
const idle = (p: ArmPose, t: number, phase: number): ArmPose => ({ ...p, elbow: p.elbow + Math.sin(t * 1.1 + phase) * 1.5 });

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
  const scale = 0.9 * k;
  const rigW = STAGE_W * scale;
  const push = 1 + t * 0.0015;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d3a26 0%, #101011 65%)", overflow: "hidden" }}>
      <Audio src={staticFile("audio/griff1.m4a")} />
      <div
        style={{
          position: "absolute",
          left: (width - rigW) / 2,
          top: -40 * scale,
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
