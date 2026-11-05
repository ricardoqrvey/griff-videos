import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the rig's own and library hands next to the Turntable hand at
// each roll, on one arm of the front view, to pick which views match which hands.
const SIDE: "l" | "r" = "l";
const CELL = { w: 300, h: 300, scale: 0.75, top: 900, left: SIDE === "r" ? 640 : -40 };
const TURNS = Array.from({ length: 24 }, (_, i) => -180 + i * 15);

type Cell = { label: string; arm: ArmPose };
const cells: Cell[] = [
  { label: "propia", arm: { shoulder: 0, elbow: 0 } },
  ...Array.from({ length: 10 }, (_, i) => `turn-${String(i + 1).padStart(2, "0")}`).map((hand) => ({ label: hand, arm: { shoulder: 0, elbow: 0, hand } })),
  ...TURNS.map((turn) => ({ label: `3D ${turn}`, arm: { shoulder: 0, elbow: 0, hand3d: { turn } } })),
];
const COLS = 7;
export const HAND3D_SHEET_SIZE = { width: CELL.w * COLS, height: CELL.h * Math.ceil(cells.length / COLS) };

export const Hand3dSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1d3a26" }}>
    {cells.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: (i % COLS) * CELL.w, top: Math.floor(i / COLS) * CELL.h, width: CELL.w, height: CELL.h, overflow: "hidden", borderRight: "1px solid #0005", borderBottom: "1px solid #0005" }}>
        <div style={{ position: "absolute", left: -CELL.left * CELL.scale, top: -CELL.top * CELL.scale, width: STAGE_W * CELL.scale, height: 1764 * CELL.scale }}>
          <Rig pose={{ view: "000", arms: { [SIDE]: c.arm } }} id={`c${i}`} />
        </div>
        <div style={{ position: "absolute", left: 8, top: 6, color: "#fff", font: "600 20px sans-serif" }}>{c.label}</div>
      </div>
    ))}
  </AbsoluteFill>
);
