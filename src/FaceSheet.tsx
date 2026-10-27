import { AbsoluteFill } from "remotion";
import { MouthShape } from "./Mouth";
import rig from "./data/griff.rig.json";
import { Rig, View } from "./rig/Rig";

// Dev aid: mouth shapes and brows on every view that has a face.
const VIEWS: View[] = ["000", "045", "090", "315", "270"];
const SHAPES: MouthShape[] = ["X", "A", "B", "C", "D", "E", "F", "H"];
const CELL = 220;
const ZOOM = 0.6;
// Face centre in each source view, used to frame the cells.
const FACE: Record<string, { src: "000" | "045" | "090"; mirror: boolean; at: [number, number] }> = {
  "000": { src: "000", mirror: false, at: [458, 400] },
  "045": { src: "045", mirror: false, at: [560, 400] },
  "090": { src: "090", mirror: false, at: [630, 390] },
  "315": { src: "045", mirror: true, at: [560, 400] },
  "270": { src: "090", mirror: true, at: [630, 390] },
};
const frame = (view: View) => {
  const f = FACE[view];
  const ax = rig.views[f.src].anchorX;
  const x = f.mirror ? 500 + ax - f.at[0] : 500 - ax + f.at[0];
  return { left: CELL / 2 - x * ZOOM, top: CELL / 2 - f.at[1] * ZOOM };
};

export const FaceSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#555" }}>
    {VIEWS.map((view, row) =>
      SHAPES.map((mouth, col) => (
        <div
          key={view + mouth}
          style={{ position: "absolute", left: col * CELL, top: row * CELL, width: CELL, height: CELL, overflow: "hidden" }}
        >
          <div style={{ position: "absolute", ...frame(view), width: 1000 * ZOOM, height: 1764 * ZOOM }}>
            <Rig
              id={`fs-${view}-${mouth}`}
              pose={{ view, arms: {}, face: { mouth, brows: { l: col % 3 === 1 ? 10 : 0, r: col % 3 === 2 ? 10 : col === 7 ? -5 : 0 } } }}
            />
          </div>
          <div style={{ position: "absolute", left: 6, top: 4, font: "bold 22px sans-serif", color: "#fff" }}>
            {view} {mouth}
          </div>
        </div>
      )),
    )}
  </AbsoluteFill>
);
