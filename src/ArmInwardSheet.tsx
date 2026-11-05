import { AbsoluteFill } from "remotion";
import { ArmPose, Rig, STAGE_W } from "./rig/Rig";

// Contact sheet: the forearm flexing inward over the torso, step by step, with
// the dropped elbow (front view, waist up).
const CELL = { w: 420, h: 500, scale: 0.55, top: 330, left: 230 };
const BACK = 150; // back of the hand to camera
type Cell = { label: string; arms: { l?: ArmPose; r?: ArmPose } };
const r = (shoulder: number, elbow: number, extra: Partial<ArmPose> = {}): Cell["arms"] => ({ r: { shoulder, elbow, ...extra } });
const cells: Cell[] = [
  { label: "reposo", arms: r(0, 0) },
  { label: "-30°", arms: r(3, -30) },
  { label: "-60°", arms: r(5, -60) },
  { label: "-90°", arms: r(5, -90) },
  { label: "-110° (tope), dorso", arms: r(5, -110, { hand3d: { turn: BACK } }) },
  { label: "hacia afuera, arriba", arms: r(13, 124, { hand: "peace" }) },
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
