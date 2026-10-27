import { Img, staticFile } from "remotion";
import { Mouth, MouthShape } from "./Mouth";

// Canvas of the source still; every layer shares it.
export const GRIFF_W = 944;
export const GRIFF_H = 1118;
const WRIST: [number, number] = [118, 697];

export type GriffPose = {
  mouth: MouthShape;
  browLeft: number; // px up (negative = frown)
  browRight: number;
  handAngle: number; // degrees around the wrist
  glint: number; // 0..1 sweep across the lenses, outside that range = hidden
};

const LENSES = (
  <>
    <rect x={366} y={344} width={136} height={102} rx={18} />
    <rect x={546} y={344} width={136} height={102} rx={18} />
  </>
);

export const Griff: React.FC<{ pose: GriffPose }> = ({ pose }) => {
  const layer: React.CSSProperties = { position: "absolute", inset: 0, width: GRIFF_W, height: GRIFF_H };
  const glintX = -160 + pose.glint * 520;

  return (
    <div style={{ position: "relative", width: GRIFF_W, height: GRIFF_H }}>
      <Img src={staticFile("griff/body.png")} style={layer} />
      <Img
        src={staticFile("griff/hand.png")}
        style={{ ...layer, transformOrigin: `${WRIST[0]}px ${WRIST[1]}px`, transform: `rotate(${pose.handAngle}deg)` }}
      />
      <svg viewBox={`0 0 ${GRIFF_W} ${GRIFF_H}`} style={layer}>
        <defs>
          <clipPath id="lenses">{LENSES}</clipPath>
        </defs>
        {pose.glint >= 0 && pose.glint <= 1 && (
          <g clipPath="url(#lenses)">
            <polygon
              points={`${glintX},460 ${glintX + 40},460 ${glintX + 150},330 ${glintX + 110},330`}
              fill="#fff"
              opacity={0.55}
            />
          </g>
        )}
        <g fill="none" stroke="#111" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M413,310 Q446,298 474,322 Q479,327 484,318"
            transform={`translate(0 ${-pose.browLeft}) rotate(${-pose.browLeft * 0.6} 448 312)`}
          />
          <path
            d="M561,316 Q590,286 628,293"
            transform={`translate(0 ${-pose.browRight}) rotate(${pose.browRight * 0.6} 594 300)`}
          />
        </g>
        <Mouth shape={pose.mouth} />
      </svg>
    </div>
  );
};
