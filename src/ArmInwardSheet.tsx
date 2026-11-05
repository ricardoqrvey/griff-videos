import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the forearm flexing inward over the torso, step by step, with
// the dropped elbow (front view, waist up).
const CELL = { w: 420, h: 500, scale: 0.55, top: 330, left: 230 };
const CHEST = -135;
type Cell = { label: string; arms: { l?: ArmPose; r?: ArmPose } };
const r = (shoulder: number, elbow: number, extra: Partial<ArmPose> = {}): Cell["arms"] => ({ r: { shoulder, elbow, ...extra } });
const cells: Cell[] = [
  { label: "-30°", arms: r(5, -30) },
  { label: "-60°", arms: r(5, -60) },
  { label: "-90° (horizontal)", arms: r(5, -90) },
  { label: "-110°", arms: r(5, -110, { hand3d: { turn: CHEST } }) },
  { label: "-130°", arms: r(5, -130, { hand3d: { turn: CHEST } }) },
  { label: "-150°", arms: r(5, -150, { hand3d: { turn: CHEST } }) },
  { label: "hombro abierto 15 / -120", arms: r(15, -120, { hand3d: { turn: CHEST } }) },
  { label: "hombro cerrado -5 / -120", arms: r(-5, -120, { hand3d: { turn: CHEST } }) },
  { label: "brazos cruzados", arms: { l: { shoulder: 4, elbow: -95 }, r: { shoulder: 4, elbow: -100 } } },
];
const COLS = 3;
export const ARM_INWARD_SHEET_SIZE = { width: CELL.w * COLS, height: CELL.h * Math.ceil(cells.length / COLS) };

export const ArmInwardSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#1d3a26" }}>
    {cells.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: (i % COLS) * CELL.w, top: Math.floor(i / COLS) * CELL.h, width: CELL.w, height: CELL.h, overflow: "hidden", borderRight: "1px solid #0005", borderBottom: "1px solid #0005" }}>
        <div style={{ position: "absolute", left: -CELL.left * CELL.scale, top: -CELL.top * CELL.scale, width: STAGE_W * CELL.scale, height: 1764 * CELL.scale }}>
          <Rig pose={{ view: "000", arms: c.arms }} id={`c${i}`} />
        </div>
        <div style={{ position: "absolute", left: 8, top: 6, color: "#fff", font: "600 20px sans-serif" }}>{c.label}</div>
      </div>
    ))}
  </AbsoluteFill>
);
