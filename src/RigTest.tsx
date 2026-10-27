import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig, STAGE_H, STAGE_W } from "./rig/Rig";
import { ArmKey, armAt, TurnKey, viewAt } from "./rig/timeline";

// Showcase of the Illustrator rig: gestures, hand swaps and a full turn.
const s = (sec: number) => Math.round(sec * 30);

const TURNS: TurnKey[] = [
  { at: s(4.6), to: "090" },
  { at: s(6.8), to: "180" },
  { at: s(8.4), to: "000", dir: "cw" },
];

const LEFT: ArmKey[] = [
  { at: s(0.8), pose: { shoulder: 28, elbow: 150, wrist: -10, hand: "index-up" } },
  { at: s(2.2), pose: { shoulder: 0, elbow: 0 } },
  { at: s(9.6), pose: { shoulder: 24, elbow: 152, wrist: -8, hand: "ok" } },
  { at: s(12.2), pose: { shoulder: 0, elbow: 0 } },
];

const RIGHT: ArmKey[] = [
  { at: s(2.6), pose: { shoulder: 42, elbow: 118, hand: "peace" } },
  { at: s(3.0), pose: { shoulder: 42, elbow: 118, wrist: 14, hand: "peace" } },
  { at: s(3.3), pose: { shoulder: 42, elbow: 118, wrist: -10, hand: "peace" } },
  { at: s(3.6), pose: { shoulder: 42, elbow: 118, wrist: 14, hand: "peace" } },
  { at: s(4.0), pose: { shoulder: 0, elbow: 0 } },
  { at: s(10.6), pose: { shoulder: 30, elbow: 140, hand: "rock" } },
  { at: s(12.2), pose: { shoulder: 0, elbow: 0 } },
];

const NEAR: ArmKey[] = [
  { at: s(5.3), pose: { shoulder: 75, elbow: 15, wrist: 0, hand: "index-up" } },
  { at: s(6.3), pose: { shoulder: 0, elbow: 0 } },
];

const LABELS: [number, string][] = [
  [0, "Reposo"],
  [0.8, "Índice arriba (brazo izq.)"],
  [2.6, "Saludo con peace (brazo der.)"],
  [4.6, "Giro 000 → 090"],
  [5.3, "Señala en perfil"],
  [6.8, "Giro 090 → 180"],
  [8.4, "Giro 180 → 360, vistas espejadas"],
  [9.6, "Pose firma: ok + rock"],
];

export const RigTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const view = viewAt(frame, "000", TURNS);
  const headView = viewAt(frame + 1, "000", TURNS);
  const pose = {
    view,
    headView,
    arms: { l: armAt(frame, fps, LEFT), r: armAt(frame, fps, RIGHT), near: armAt(frame, fps, NEAR) },
    head: {
      tilt: interpolate(t, [9.6, 10, 12, 12.4], [0, -5, -5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      nod: Math.sin(t * 2.4) * 2,
    },
  };

  const rigH = height * 0.86;
  const rigW = (rigH * STAGE_W) / STAGE_H;
  const label = [...LABELS].reverse().find(([at]) => t >= at)?.[1];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1d3a26 0%, #101011 60%)" }}>
      <div
        style={{
          position: "absolute",
          left: (width - rigW) / 2,
          top: height - rigH - 40,
          width: rigW,
          height: rigH,
          transformOrigin: "50% 100%",
          transform: `scaleY(${1 + Math.sin(t * 2.6) * 0.004})`,
        }}
      >
        <Rig pose={pose} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          font: "800 44px Helvetica Neue, Arial, sans-serif",
          color: "#35E06A",
        }}
      >
        {label}
      </div>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", font: "500 30px Helvetica Neue, Arial", color: "#B4B4BA" }}>
        vista {view}
      </div>
    </AbsoluteFill>
  );
};
