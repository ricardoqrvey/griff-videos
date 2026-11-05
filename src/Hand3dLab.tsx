import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ArmPose, Hand3dPose, Rig, STAGE_W } from "./rig/Rig";
import { ArmKey, armAt, Hand3dKey, hand3dAt } from "./rig/timeline";

// Explorations with the Turntable hand and forearm, one move per segment,
// front view, waist up, 1:1. The resting hand is turn -105, the open palm -15.
const FPS = 30;
const f = (sec: number) => Math.round(sec * FPS);
const REST = -105, PALM = -15;
const pose = (shoulder: number, elbow: number, hand?: string): ArmPose => ({ shoulder, elbow, hand });
const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });
const h = (sec: number, to?: Hand3dPose, frames?: number): Hand3dKey => ({ at: f(sec), to, frames });
// Roll in from the resting hand at `sec`, and back out at `out`.
const rollIn = (sec: number, to = PALM): Hand3dKey[] => [h(sec, { turn: REST }), { at: f(sec) + 1, to: { turn: to } }];
const rollOut = (sec: number, from = PALM): Hand3dKey[] => [h(sec, { turn: from }), { at: f(sec) + 1, to: { turn: REST } }, h(sec + 0.34)];
const FLAT = (turn: number): Hand3dPose => ({ set: "flat", tilt: 30, fit: "free", front: true, turn });

const SEGMENTS: [number, string][] = [
  [0, "1. Giro de muñeca en el gesto bajo"],
  [4.4, "2. Palma → dorso → palma"],
  [8.6, "3. Brazo arriba: entra girando y oscila"],
  [13.4, "4. Antebrazo hacia la cámara (vistas acostadas)"],
  [19.6, "5. Ambas manos a la vez"],
];
export const HAND3D_LAB_FRAMES = f(23.5);

// Screen-right arm (Griff's left hand) does segments 1–4.
const RIGHT: ArmKey[] = [
  key(0.3, pose(6, 40, "turn-03")),
  key(3.4, pose(0, 0)),
  key(4.7, pose(8, 44, "turn-03")),
  key(7.6, pose(0, 0)),
  key(8.9, pose(12, 122, "index-up")),
  key(11.9, pose(0, 0)),
  key(13.7, pose(6, 40, "turn-03")),
  key(14.5, pose(6, 62, "turn-03")),
  key(17.9, pose(6, 40, "turn-03")),
  key(18.7, pose(0, 0)),
  key(19.9, pose(7, 42, "turn-03")),
  key(22.4, pose(0, 0)),
];
const RIGHT3D: Hand3dKey[] = [
  ...rollIn(0.3),
  h(1.4, { turn: -45 }, 8), h(1.9, { turn: PALM }, 8), h(2.4, { turn: -45 }, 8), h(2.9, { turn: PALM }, 8),
  ...rollOut(3.4),
  ...rollIn(4.7),
  h(5.7, { turn: -195 }, 14), // palm down: back through the side view to the back of the hand
  h(6.6, { turn: 345 }, 14), // and over again to the palm
  ...rollOut(7.6),
  ...rollIn(8.9),
  h(9.9, { turn: -60 }, 6), h(10.2, { turn: 0 }, 7), h(10.5, { turn: -45 }, 6), h(10.8, { turn: PALM }, 6),
  h(11.2), // the rig's index-up
  ...rollOut(11.9, PALM),
  ...rollIn(13.7),
  h(14.9, FLAT(120)), // the lying forearm, out to the side
  { at: f(15.1), to: FLAT(60), frames: 14 }, // swings round toward the camera
  h(16.6, FLAT(60)), { at: f(16.6) + 1, to: FLAT(120), frames: 14 },
  h(17.6, { turn: PALM }),
  ...rollOut(18.7),
  ...rollIn(19.9),
  h(20.9, { turn: -45 }, 8), h(21.4, { turn: PALM }, 8),
  ...rollOut(22.4),
];
const LEFT: ArmKey[] = [key(19.9, pose(5, 38, "turn-03")), key(22.4, pose(0, 0))];
const LEFT3D: Hand3dKey[] = [...rollIn(19.9), h(21.0, { turn: -45 }, 8), h(21.5, { turn: PALM }, 8), ...rollOut(22.4)];

const idle = (p: ArmPose, t: number, phase: number): ArmPose => ({
  ...p,
  shoulder: p.shoulder + Math.sin(t * 0.7 + phase) * 1.2,
  elbow: p.elbow + Math.sin(t * 1.1 + phase) * 1.5,
});
const arm = (frame: number, t: number, keys: ArmKey[], keys3d: Hand3dKey[], phase: number): ArmPose => {
  const p = idle(armAt(frame, FPS, keys), t, phase);
  const hand3d = hand3dAt(frame, keys3d);
  return hand3d ? { ...p, hand3d } : p;
};

export const Hand3dLab: React.FC = () => {
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
