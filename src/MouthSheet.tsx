import { AbsoluteFill } from "remotion";
import { Griff } from "./Griff";
import { MouthShape } from "./Mouth";

// Dev aid: every mouth shape side by side, cropped to the face.
const SHAPES: MouthShape[] = ["X", "A", "B", "C", "D", "E", "F", "G", "H"];

export const MouthSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#ccc", flexDirection: "row", flexWrap: "wrap" }}>
    {SHAPES.map((m) => (
      <div key={m} style={{ width: 360, height: 360, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: -340, top: -300 }}>
          <Griff pose={{ mouth: m, browLeft: 0, browRight: m === "D" ? 10 : 0, handAngle: 0, glint: -1 }} />
        </div>
        <div style={{ position: "absolute", top: 8, left: 12, font: "bold 36px sans-serif" }}>{m}</div>
      </div>
    ))}
  </AbsoluteFill>
);
