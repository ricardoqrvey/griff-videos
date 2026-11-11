import { AbsoluteFill } from "remotion";
import { Rig, STAGE_H, STAGE_W } from "../rig/Rig";
import { SVG } from "./Layer";
import { TWEEN_AX } from "./Desk";

// Alignment check for the 070 in-between: rig 270, griff_070 (mirrored), rig 315, then all three overlaid.
const Tween: React.FC<{ opacity?: number }> = ({ opacity }) => (
  <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width="100%" height="100%" overflow="visible" style={{ position: "absolute", inset: 0, opacity }}>
    <g transform={`translate(${STAGE_W / 2} 0) scale(-1 1) translate(${-TWEEN_AX} 0)`} dangerouslySetInnerHTML={{ __html: SVG.griff_070.inner }} />
    <line x1={500} y1={0} x2={500} y2={STAGE_H} stroke="red" strokeWidth={3} />
  </svg>
);
const Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", width: 500, height: 882 }}>{children}<div style={{ position: "absolute", left: 249, top: 0, bottom: 0, width: 2, background: "red" }} /></div>
);
const R = (v: "270" | "315", o?: number) => (
  <div style={{ position: "absolute", inset: 0, opacity: o }}><Rig pose={{ view: v, arms: {} }} id={`c${v}${o ?? ""}`} /></div>
);
export const TweenCheck: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff", flexDirection: "row" }}>
    <Cell>{R("270")}</Cell>
    <Cell><Tween /></Cell>
    <Cell>{R("315")}</Cell>
    <Cell>{R("270", 0.35)}<Tween opacity={0.45} />{R("315", 0.35)}</Cell>
  </AbsoluteFill>
);
