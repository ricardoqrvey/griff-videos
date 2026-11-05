import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the rig's own and library hands next to the Turntable hand at
// each roll, on the front view's arms, to pick which views match which hands.
const CELL = { w: 560, h: 220, scale: 0.38, top: 840, left: -240 };
const TURNS = [-90, -105, -120, -135, -150, -165, -180];

type Cell = { label: string; l: ArmPose; r: ArmPose };
const cells: Cell[] = [
  { label: "reposo (mano propia)", l: { shoulder: 0, elbow: 0 }, r: { shoulder: 0, elbow: 0 } },
  { label: "bajo: turn-03", l: { shoulder: 4, elbow: 34, hand: "turn-03" }, r: { shoulder: 4, elbow: 34, hand: "turn-03" } },
  ...TURNS.map((turn) => ({ label: `reposo 3D ${turn}`, l: { shoulder: 0, elbow: 0, hand3d: { turn } }, r: { shoulder: 0, elbow: 0, hand3d: { turn } } })),
  ...TURNS.map((turn) => ({ label: `bajo 3D ${turn}`, l: { shoulder: 4, elbow: 34, hand3d: { turn } }, r: { shoulder: 4, elbow: 34, hand3d: { turn } } })),
];
const COLS = 3;
export const HAND3D_SHEET_SIZE = { width: CELL.w * COLS, height: CELL.h * Math.ceil(cells.length / COLS) };

export const Hand3dSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1d3a26" }}>
    {cells.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: (i % COLS) * CELL.w, top: Math.floor(i / COLS) * CELL.h, width: CELL.w, height: CELL.h, overflow: "hidden", borderRight: "1px solid #0005", borderBottom: "1px solid #0005" }}>
        <div style={{ position: "absolute", left: -CELL.left * CELL.scale, top: -CELL.top * CELL.scale, width: STAGE_W * CELL.scale, height: 1764 * CELL.scale }}>
          <Rig pose={{ view: "000", arms: { l: c.l, r: c.r } }} id={`c${i}`} />
        </div>
        <div style={{ position: "absolute", left: 8, top: 6, color: "#fff", font: "600 18px sans-serif" }}>{c.label}</div>
      </div>
    ))}
  </AbsoluteFill>
);
