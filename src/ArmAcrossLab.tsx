import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ArmPose, Hand3dPose, Rig, STAGE_W } from "./rig/Rig";
import { acrossAt, ArmKey, armAt, Hand3dKey, hand3dAt } from "./rig/timeline";

// Explorations with the forearm swung in across the torso (it comes over the
// vest on its own once the elbow bends inward), front view, waist up, 1:1.
const FPS = 30;
const f = (sec: number) => Math.round(sec * FPS);
const REST = -105, PALM = -15, CHEST = -135; // CHEST: hand flat on the chest
const pose = (shoulder: number, elbow: number, hand?: string): ArmPose => ({ shoulder, elbow, hand });
const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });
const h = (sec: number, to?: Hand3dPose, frames?: number): Hand3dKey => ({ at: f(sec), to, frames });
// Roll from one Turntable view to another starting at `sec`.
const roll = (sec: number, from: number, to: number, frames = 10): Hand3dKey[] => [h(sec, { turn: from }), { at: f(sec) + 1, to: { turn: to }, frames }];
// Back to the resting view, then the rig's own hand.
const rollOut = (sec: number, from: number): Hand3dKey[] => [...roll(sec, from, REST), h(sec + 0.4)];

const SEGMENTS: [number, string][] = [
  [0, "1. Mano al pecho"],
  [4.4, "2. Antebrazo cruzado; la otra mano habla"],
  [9.0, "3. Del gesto bajo al cruce, palma arriba"],
  [13.4, "4. Del pecho hacia afuera"],
  [17.8, "5. Uno cruzado, el otro arriba"],
];
export const ARM_ACROSS_LAB_FRAMES = f(22.4);

// Screen-right arm (Griff's left hand).
const RIGHT: ArmKey[] = [
  key(0.4, pose(5, -120)),
  key(3.2, pose(0, 0)),
  key(4.6, pose(2, -75)),
  key(8.4, pose(0, 0)),
  key(9.2, pose(6, 40, "turn-03")),
  key(10.4, pose(3, -85, "turn-03")),
  key(11.7, pose(6, 40, "turn-03")),
  key(12.6, pose(0, 0)),
  key(13.6, pose(5, -120)),
  key(15.0, pose(8, 44, "turn-03")),
  key(16.7, pose(0, 0)),
  key(18.5, pose(12, 122, "index-up")),
  key(21.0, pose(0, 0)),
];
const RIGHT3D: Hand3dKey[] = [
  ...roll(0.4, REST, CHEST, 14),
  ...rollOut(3.2, CHEST),
  h(4.6, { turn: REST }), // the side view rides the forearm across the belly
  h(8.8),
  ...roll(9.2, REST, PALM),
  ...rollOut(12.6, PALM),
  ...roll(13.6, REST, CHEST, 14),
  { at: f(15.0), to: { turn: PALM }, frames: 14 }, // back of the hand round to the palm as it opens out
  ...rollOut(16.7, PALM),
  ...roll(18.5, REST, PALM),
  h(19.6), // the rig's index-up
  ...rollOut(21.0, PALM),
];
// Screen-left arm (Griff's right hand).
const LEFT: ArmKey[] = [
  key(5.4, pose(6, 42, "turn-03")),
  key(7.7, pose(0, 0)),
  key(18.0, pose(2, -78)),
  key(21.4, pose(0, 0)),
];
const LEFT3D: Hand3dKey[] = [
  ...roll(5.4, REST, PALM),
  h(6.3, { turn: -45 }, 8), h(6.8, { turn: PALM }, 8),
  ...rollOut(7.7, PALM),
];

const idle = (p: ArmPose, t: number, phase: number): ArmPose => ({
  ...p,
  shoulder: p.shoulder + Math.sin(t * 0.7 + phase) * 1.2,
  elbow: p.elbow + Math.sin(t * 1.1 + phase) * 1.5,
});
const arm = (frame: number, _t: number, keys: ArmKey[], keys3d: Hand3dKey[], phase: number): ArmPose => {
  const at = (fr: number) => idle(armAt(fr, FPS, keys), fr / FPS, phase);
  const p = { ...at(frame), across: acrossAt(frame, (fr) => at(fr).elbow) };
  const hand3d = hand3dAt(frame, keys3d);
  return hand3d ? { ...p, hand3d } : p;
};

export const ArmAcrossLab: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const label = [...SEGMENTS].reverse().find(([at]) => t >= at)?.[1] ?? "";
  const k = width / 1080;
  const scale = 0.84 * k;
  const rigW = STAGE_W * scale;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d3a26 0%, #101011 65%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (width - rigW) / 2, top: -10 * scale, width: rigW, height: 1764 * scale }}>
        <Rig
          pose={{
            view: "000",
            arms: { l: arm(frame, t, LEFT, LEFT3D, 0), r: arm(frame, t, RIGHT, RIGHT3D, 2) },
            head: { tilt: Math.sin(t * 0.8) * 0.6, nod: Math.sin(t * 2.1) * 0.8 },
            face: { mouth: "X", brows: { l: 4, r: 4 }, browShape: { l: { arch: 2 }, r: { arch: 2 } } },
            body: { lift: Math.sin(t * 1.6) * 1 },
          }}
        />
      </div>
      <div style={{ position: "absolute", left: 28 * k, top: 24 * k, color: "#f3efe4", font: `600 ${30 * k}px -apple-system, Helvetica, sans-serif`, opacity: 0.85 }}>{label}</div>
    </AbsoluteFill>
  );
};
