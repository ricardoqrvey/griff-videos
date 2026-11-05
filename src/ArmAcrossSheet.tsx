import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the forearm swung in across the torso, front view, waist up.
const CELL = { w: 400, h: 400, scale: 0.6, top: 480, left: 170 };
type Cell = { label: string; arm: ArmPose; side?: "l" | "r" };
const cells: Cell[] = [
  ...[-105, -120, -135, -150, -165, 180].map((turn) => ({ label: `pecho 3D ${turn}`, arm: { shoulder: 5, elbow: -120, hand3d: { turn } } })),
  ...[-105, -135].map((turn) => ({ label: `izq pecho 3D ${turn}`, side: "l" as const, arm: { shoulder: 5, elbow: -120, hand3d: { turn } } })),
  { label: "izq -80 propia", side: "l" as const, arm: { shoulder: 2, elbow: -80 } },
];
const COLS = 3;
export const ARM_ACROSS_SHEET_SIZE = { width: CELL.w * COLS, height: CELL.h * Math.ceil(cells.length / COLS) };

export const ArmAcrossSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1d3a26" }}>
    {cells.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: (i % COLS) * CELL.w, top: Math.floor(i / COLS) * CELL.h, width: CELL.w, height: CELL.h, overflow: "hidden", borderRight: "1px solid #0005", borderBottom: "1px solid #0005" }}>
        <div style={{ position: "absolute", left: -CELL.left * CELL.scale, top: -CELL.top * CELL.scale, width: STAGE_W * CELL.scale, height: 1764 * CELL.scale }}>
          <Rig pose={{ view: "000", arms: { [c.side ?? "r"]: c.arm } }} id={`c${i}`} />
        </div>
        <div style={{ position: "absolute", left: 8, top: 6, color: "#fff", font: "600 20px sans-serif" }}>{c.label}</div>
      </div>
    ))}
  </AbsoluteFill>
);
