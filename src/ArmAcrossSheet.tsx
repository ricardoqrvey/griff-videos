import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the forearm swung in across the torso, front view, waist up.
const CELL = { w: 440, h: 520, scale: 0.55, top: 300, left: 200 };
type Cell = { label: string; arm: ArmPose; side?: "l" | "r" };
const cells: Cell[] = [
  { label: "brazo arriba", arm: { shoulder: 12, elbow: 122, hand: "index-up" } },
  { label: "mano al pecho", arm: { shoulder: 5, elbow: -120, hand3d: { turn: -135 } } },
  { label: "más cerrado", arm: { shoulder: 5, elbow: -140, hand3d: { turn: -135 } } },
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
