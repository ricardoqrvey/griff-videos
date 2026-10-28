// Cut-out rig built from the Illustrator export (see scripts/rig_from_svg.mjs).
// Each view is a stack of pieces; arms bend at shoulder, elbow and wrist, and
// hands can be swapped for any hand in the library.
import rigData from "../data/griff.rig.json";
import { Face, FacePose } from "./Face";

type Pt = [number, number];
type ArmData = {
  upper: string;
  lower: string;
  upperFill: string;
  lowerFill: string;
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  patch: number;
  handFix?: string; // moves a view's own hand onto a borrowed arm's wrist
  handTurn?: number; // and the angle that hand was turned by, for library hands
  swingIn?: boolean; // in front of the torso: the elbow bends across the body
  forearmLean: number; // forearm direction at rest, degrees from straight down
};
type ViewData = {
  w: number;
  h: number;
  order: string[];
  pieces: Record<string, string>;
  arms: Record<string, ArmData>;
  neck: Pt;
  anchorX: number;
  ground: number;
  handHeight: number;
};
type HandData = {
  w: number;
  h: number;
  markup: string;
  wrist: Pt;
  axis: Pt; // wrist to palm centre, as drawn
  left: boolean; // drawn as a left hand
  scale: number; // size correction for shapes exported smaller than the set
  dir: "down" | "up" | "left" | "right";
  height: number;
};

const RIG = rigData as unknown as { views: Record<string, ViewData>; hands: Record<string, HandData> };

// Views on the left half of the turn are the right half, mirrored.
export const VIEWS = ["000", "045", "090", "135", "180", "225", "270", "315"] as const;
export type View = (typeof VIEWS)[number];
const SOURCE: Record<View, { src: string; mirror: boolean }> = {
  "000": { src: "000", mirror: false },
  "045": { src: "045", mirror: false },
  "090": { src: "090", mirror: false },
  "135": { src: "135", mirror: false },
  "180": { src: "180", mirror: false },
  "225": { src: "135", mirror: true },
  "270": { src: "090", mirror: true },
  "315": { src: "045", mirror: true },
};

export const HANDS = Object.keys(RIG.hands);

/** Angles in degrees. shoulder: raise (outward in front/back views, forward in profile).
 *  elbow: bend, positive swings the forearm up on the outside (hand beside the head). wrist: extra tilt of the hand. */
export type ArmPose = { shoulder: number; elbow: number; wrist?: number; hand?: string; mirrorHand?: boolean };
export type RigPose = {
  view: View;
  headView?: View; // lets the head lead the body by a frame during turns
  arms: { l?: ArmPose; r?: ArmPose; near?: ArmPose }; // screen sides
  head?: { tilt?: number; nod?: number };
  face?: FacePose;
};

export const STAGE_W = 1000;
export const STAGE_H = 1764;
const REST: ArmPose = { shoulder: 0, elbow: 0 };

// Svg-angle signs per source arm, so poses read the same on every side.
const SIGN: Record<string, { sh: number; el: number }> = {
  l: { sh: 1, el: 1 },
  r: { sh: -1, el: -1 },
  near: { sh: -1, el: -1 },
};

const viewTransform = (view: View) => {
  const { src, mirror } = SOURCE[view];
  const ax = RIG.views[src].anchorX;
  return mirror
    ? `translate(${STAGE_W / 2} 0) scale(-1 1) translate(${-ax} 0)`
    : `translate(${STAGE_W / 2 - ax} 0)`;
};

// In a mirrored view the source's right arm is on the screen's left.
const screenSide = (srcSide: string, mirror: boolean) =>
  !mirror || srcSide === "near" ? srcSide : srcSide === "l" ? "r" : "l";

const Svg: React.FC<{ markup: string; transform?: string; clipPath?: string }> = ({ markup, transform, clipPath }) => (
  <g transform={transform} clipPath={clipPath} dangerouslySetInnerHTML={{ __html: markup }} />
);

export const Rig: React.FC<{ pose: RigPose; id?: string }> = ({ pose, id = "rig" }) => {
  const { src, mirror } = SOURCE[pose.view];
  const view = RIG.views[src];
  const vt = viewTransform(pose.view);
  const headView = pose.headView ?? pose.view;
  const headSrc = RIG.views[SOURCE[headView].src];

  const armChain = (side: string) => {
    const a = view.arms[side];
    const p = pose.arms[screenSide(side, mirror) as "l" | "r" | "near"] ?? REST;
    const s = a.swingIn ? { ...SIGN[side], el: -SIGN[side].el } : SIGN[side];
    const sh = `rotate(${p.shoulder * s.sh} ${a.shoulder[0]} ${a.shoulder[1]})`;
    const el = `rotate(${p.elbow * s.el} ${a.elbow[0]} ${a.elbow[1]})`;
    const wr = `rotate(${(p.wrist ?? 0) * s.el} ${a.wrist[0]} ${a.wrist[1]})`;
    return { a, p, sh, el, wr };
  };

  const libHand = (side: string, a: ArmData, p: ArmPose) => {
    const hand = RIG.hands[p.hand!];
    const scale = (view.handHeight / RIG.hands["turn-01"].height) * hand.scale;
    // Thumb on the correct side: the screen-left arm is Griff's right hand, so
    // left-hand drawings (and every hand on the right arm) are mirrored.
    const flip = (side === "r") !== hand.left !== !!p.mirrorHand ? -1 : 1;
    // Lay the hand's own axis exactly along the forearm.
    const lean = (x: number, y: number) => (Math.atan2(x, y) * 180) / Math.PI;
    const turn = lean(flip * hand.axis[0], hand.axis[1]) - a.forearmLean;
    return (
      <Svg
        markup={hand.markup}
        transform={`translate(${a.wrist[0]} ${a.wrist[1]}) rotate(${turn}) scale(${flip * scale} ${scale}) translate(${-hand.wrist[0]} ${-hand.wrist[1]})`}
      />
    );
  };

  const head = pose.head ?? {};
  const neck = view.neck;

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width="100%" height="100%" overflow="visible">
      {view.order
        .filter((name) => !name.startsWith("hand-"))
        .flatMap((name) => (name.startsWith("arm-") ? [`hand-${name.slice(4)}`, name] : [name]))
        .map((name) => {
        if (name === "head") {
          const hn = headSrc.neck;
          return (
            <g key={name} transform={viewTransform(headView)}>
              <g transform={`translate(0 ${head.nod ?? 0}) rotate(${head.tilt ?? 0} ${hn[0]} ${hn[1]})`}>
                <Svg markup={headSrc.pieces.head} />
                {headSrc.pieces.glare && (
                  // The glare lags the head a little, as a reflection would.
                  <>
                    <clipPath id={`${id}-lens`} dangerouslySetInnerHTML={{ __html: headSrc.pieces.lens }} />
                    <g clipPath={`url(#${id}-lens)`}>
                      <Svg markup={headSrc.pieces.glare} transform={`translate(${-(head.tilt ?? 0) * 3.5} ${(head.nod ?? 0) * 1.2})`} />
                    </g>
                  </>
                )}
                {pose.face && <Face view={SOURCE[headView].src} mirror={SOURCE[headView].mirror} pose={pose.face} id={id} />}
              </g>
            </g>
          );
        }
        if (name.startsWith("arm-")) {
          const side = name.slice(4);
          const { a, sh, el } = armChain(side);
          const clip = `${id}-elbow-${side}`;
          return (
            <g key={name} transform={vt}>
              <g transform={sh}>
                <Svg markup={a.upper} />
                <Svg markup={a.lower} transform={el} />
                {/* Elbow patch: both sleeve fills, clipped to a circle at the joint,
                    paint over the outlines where the two pieces cross. */}
                <clipPath id={clip}>
                  <circle cx={a.elbow[0]} cy={a.elbow[1]} r={a.patch} />
                </clipPath>
                <g clipPath={`url(#${clip})`}>
                  <Svg markup={a.upperFill} />
                  <Svg markup={a.lowerFill} transform={el} />
                </g>
              </g>
            </g>
          );
        }
        if (name.startsWith("hand-")) {
          const side = name.slice(5);
          const { a, p, sh, el, wr } = armChain(side);
          return (
            <g key={name} transform={`${vt} ${sh} ${el} ${wr}`}>
              {p.hand ? libHand(side, a, p) : <Svg markup={view.pieces[name]} transform={a.handFix} />}
            </g>
          );
        }
        return <Svg key={name} markup={view.pieces[name]} transform={vt} />;
      })}
    </svg>
  );
};

// --- Turns -------------------------------------------------------------------

/** Views passed through going from one angle to another, the short way unless forced. */
export function turnPath(from: View, to: View, dir?: "cw" | "ccw"): View[] {
  const i = VIEWS.indexOf(from), j = VIEWS.indexOf(to);
  const fwd = (j - i + 8) % 8;
  const step = dir === "cw" ? 1 : dir === "ccw" ? -1 : fwd <= 4 ? 1 : -1;
  const path: View[] = [];
  for (let k = i; k !== j; k = (k + step + 8) % 8) path.push(VIEWS[k]);
  path.push(to);
  return path;
}
