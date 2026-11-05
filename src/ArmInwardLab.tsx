import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ArmPose, Hand3dPose, Rig, STAGE_W } from "./rig/Rig";
import { acrossAt, ArmKey, armAt, Hand3dKey, hand3dAt } from "./rig/timeline";

// The forearm flexing inward over the torso with the dropped elbow, front view,
// waist up, 1:1.
const FPS = 30;
const f = (sec: number) => Math.round(sec * FPS);
const REST = -105, CHEST = -135; // CHEST: hand flat on the chest
const pose = (shoulder: number, elbow: number, hand?: string): ArmPose => ({ shoulder, elbow, hand });
const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });
const h = (sec: number, to?: Hand3dPose, frames?: number): Hand3dKey => ({ at: f(sec), to, frames });
// Roll from one Turntable view to another starting at `sec`.
const roll = (sec: number, from: number, to: number, frames = 10): Hand3dKey[] => [h(sec, { turn: from }), { at: f(sec) + 1, to: { turn: to }, frames }];
// Back to the resting view, then the rig's own hand.
const rollOut = (sec: number, from: number): Hand3dKey[] => [...roll(sec, from, REST), h(sec + 0.4)];

const SEGMENTS: [number, string][] = [
  [0, "1. Flexión lenta hacia adentro"],
  [6.8, "2. Mano al pecho; el hombro se abre y se cierra"],
  [11.4, "3. Brazos cruzados"],
];
export const ARM_INWARD_LAB_FRAMES = f(16.4);

// Screen-right arm (Griff's left hand).
const RIGHT: ArmKey[] = [
  key(0.6, pose(0, 0)),
  key(1.2, pose(3, -45)),
  key(2.3, pose(4, -90)),
  key(3.3, pose(5, -125)),
  key(4.7, pose(4, -90)),
  key(5.6, pose(0, 0)),
  key(7.0, pose(5, -120)),
  key(8.4, pose(14, -118)),
  key(9.6, pose(-4, -124)),
  key(10.6, pose(0, 0)),
  key(12.1, pose(4, -100)),
  key(15.2, pose(0, 0)),
];
const RIGHT3D: Hand3dKey[] = [
  ...roll(2.8, REST, CHEST, 14),
  ...rollOut(4.7, CHEST),
  ...roll(7.0, REST, CHEST, 14),
  ...rollOut(10.6, CHEST),
];
// Screen-left arm (Griff's right hand).
const LEFT: ArmKey[] = [
  key(11.8, pose(4, -95)),
  key(15.0, pose(0, 0)),
];
const LEFT3D: Hand3dKey[] = [];

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

export const ArmInwardLab: React.FC = () => {
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
