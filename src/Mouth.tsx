// Vector mouths for Griff, keyed by Rhubarb's mouth shapes (A–H, X = rest).
// Drawn in a local frame centred under the nose, then skewed so the mouth
// keeps the original smirk (right corner higher) while verticals stay vertical.

export type MouthShape = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "X";

type Pt = [number, number];
type Open = { l: Pt; r: Pt; u: Pt; d: Pt; teeth: "none" | "top" | "both"; tongue: "none" | "low" | "high" };

const INK = "#111";
const STROKE = 5;
const ORIGIN: Pt = [523, 548];
const NOSE_Y = -21; // philtrum starts here, just under the nose
const REST_CHIN_Y = 33;

const OPEN: Partial<Record<MouthShape, Open>> = {
  B: { l: [-44, 2], r: [58, 0], u: [5, 3], d: [5, 24], teeth: "both", tongue: "none" },
  C: { l: [-42, 2], r: [56, 0], u: [5, -3], d: [5, 44], teeth: "top", tongue: "low" },
  D: { l: [-47, 4], r: [61, 2], u: [5, -7], d: [5, 64], teeth: "top", tongue: "low" },
  E: { l: [-32, 4], r: [44, 2], u: [6, -8], d: [6, 46], teeth: "none", tongue: "low" },
  F: { l: [-18, 6], r: [30, 4], u: [6, -12], d: [6, 30], teeth: "none", tongue: "none" },
  G: { l: [-42, 2], r: [56, 0], u: [5, -1], d: [5, 18], teeth: "top", tongue: "none" },
  H: { l: [-42, 2], r: [56, 0], u: [5, -3], d: [5, 40], teeth: "top", tongue: "high" },
};

// Quadratic midpoint: where the lip crosses the centre line.
const mid = (a: Pt, c: Pt, b: Pt) => (a[1] + 2 * c[1] + b[1]) / 4;

const Chin: React.FC<{ drop: number }> = ({ drop }) => (
  <path d={`M-13,${REST_CHIN_Y - 1 + drop} Q8,${REST_CHIN_Y + 5 + drop} 29,${REST_CHIN_Y - 1 + drop}`} />
);

type MouthProps = {
  shape: MouthShape;
  origin?: Pt; // where the local frame sits on the face
  noseY?: number; // philtrum start, in local units
  scale?: Pt;
  skew?: number; // negative lifts the right corner (Griff's smirk)
  chin?: boolean;
  open?: number; // multiplies how far the jaw drops on open shapes
  id?: string; // unique clip id when several mouths are on screen
};

export const Mouth: React.FC<MouthProps> = ({
  shape,
  origin = ORIGIN,
  noseY = NOSE_Y,
  scale = [1, 1],
  skew = -14,
  chin = true,
  open = 1,
  id = "mouth-clip",
}) => {
  const o = OPEN[shape];
  let body: React.ReactNode;
  let topLip: number;
  let drop = 0;

  if (!o) {
    // Closed shapes: the original smirk (X) or pressed lips (A).
    const d = shape === "A" ? "M-46,3 Q5,13 60,1" : "M-50,1.5 Q5,17 65,0";
    topLip = shape === "A" ? 7.5 : 8.8;
    body = <path d={d} />;
  } else {
    const { l, r, u } = o;
    const d: Pt = [o.d[0], o.d[1] * open];
    topLip = mid(l, u, r);
    // Lower lip is a cubic so open mouths read as a full "U", not a sliver.
    const k = (r[0] - l[0]) * 0.18;
    const lowLip = (l[1] + r[1]) / 8 + d[1] * 0.75;
    drop = Math.max(0, lowLip - 12) * 0.7;
    const outline = `M${l} Q${u} ${r} C${r[0] - k},${d[1]} ${l[0] + k},${d[1]} ${l} Z`;
    body = (
      <>
        <clipPath id={id}>
          <path d={outline} />
        </clipPath>
        <path d={outline} fill="#4a1a1f" />
        <g clipPath={`url(#${id})`} stroke="none">
          {o.tongue !== "none" && (
            <ellipse cx={8} cy={o.tongue === "high" ? topLip + 12 : lowLip - 9} rx={26} ry={11} fill="#e07a86" />
          )}
          {o.teeth !== "none" && <rect x={-60} y={topLip - 6} width={130} height={11} fill="#fffaf0" />}
          {o.teeth === "both" && <rect x={-60} y={lowLip - 7} width={130} height={12} fill="#fffaf0" />}
        </g>
        <path d={outline} fill="none" />
      </>
    );
  }

  return (
    <g
      transform={`translate(${origin[0]} ${origin[1]}) scale(${scale[0]} ${scale[1]}) skewY(${skew})`}
      fill="none"
      stroke={INK}
      strokeWidth={STROKE / Math.sqrt(scale[0] * scale[1])}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={0} y1={noseY} x2={0} y2={topLip} />
      {body}
      {chin && <Chin drop={drop} />}
    </g>
  );
};
