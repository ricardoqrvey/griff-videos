import { AbsoluteFill } from "remotion";
import { HANDS, Rig } from "./rig/Rig";

// Dev aid: every gesture hand from the library, mounted on Griff's raised forearm.
const SHAPES = HANDS.filter((h) => /_\d{3}$/.test(h));
const COLS = 8;
const CELL = 240;
const ZOOM = 0.75;
const FOCUS = [110, 420]; // around the raised screen-left hand, in stage units

export const HAND_SHEET_SIZE = { width: COLS * CELL, height: Math.ceil(SHAPES.length / COLS) * CELL };

export const HandSheet: React.FC<{ hands?: string[]; elbow?: number }> = ({ hands = SHAPES, elbow = 128 }) => (
  <AbsoluteFill style={{ background: "#555" }}>
    {hands.map((hand, i) => (
      <div
        key={hand}
        style={{ position: "absolute", left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL, width: CELL, height: CELL, overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            left: CELL / 2 - FOCUS[0] * ZOOM,
            top: CELL / 2 - FOCUS[1] * ZOOM,
            width: 1000 * ZOOM,
            height: 1764 * ZOOM,
          }}
        >
          <Rig id={`hs-${i}`} pose={{ view: "000", arms: { l: { shoulder: 6, elbow, wrist: 18, hand } } }} />
        </div>
        <div style={{ position: "absolute", left: 6, top: 4, font: "bold 18px sans-serif", color: "#fff" }}>{hand}</div>
      </div>
    ))}
  </AbsoluteFill>
);
