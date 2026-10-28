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
type HandData = { w: number; h: number; markup: string; wrist: Pt; dir: "down" | "up"; height: number };

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
 *  elbow: bend, positive swings the forearm up on the outside (hand beside the head). wrist: extra tilt of the hand.
 *  forward: 0..1, the forearm coming toward the camera: it foreshortens, crosses in front of the
 *  body, and gesture hands turn fingers-up. The relaxed way to "raise" a hand in front views. */
export type ArmPose = {
  shoulder: number;
  elbow: number;
  wrist?: number;
  forward?: number;
  hand?: string;
  mirrorHand?: boolean;
};
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
    const s = SIGN[side];
    const sh = `rotate(${p.shoulder * s.sh} ${a.shoulder[0]} ${a.shoulder[1]})`;
    const el = `rotate(${p.elbow * s.el} ${a.elbow[0]} ${a.elbow[1]})`;
    const wr = `rotate(${(p.wrist ?? 0) * s.el} ${a.wrist[0]} ${a.wrist[1]})`;
    // Foreshortening: squash the forearm along its own axis, about the elbow.
    const f = p.forward ?? 0;
    const q = 1 - 0.45 * f;
    const [ux, uy] = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]].map((v, _, w) => v / Math.hypot(w[0], w[1]));
    const [m0, m1, m3] = [1 + (q - 1) * ux * ux, (q - 1) * ux * uy, 1 + (q - 1) * uy * uy];
    const short = `matrix(${m0} ${m1} ${m1} ${m3} ${a.elbow[0] - m0 * a.elbow[0] - m1 * a.elbow[1]} ${a.elbow[1] - m1 * a.elbow[0] - m3 * a.elbow[1]})`;
    const lower = `${el} ${short}`;
    // The hand rides to the shortened wrist without being squashed, a touch bigger as it nears the camera.
    const k = 1 + 0.12 * f;
    const handAt = `${el} translate(${(q - 1) * (a.wrist[0] - a.elbow[0])} ${(q - 1) * (a.wrist[1] - a.elbow[1])}) ${wr} translate(${a.wrist[0]} ${a.wrist[1]}) scale(${k}) translate(${-a.wrist[0]} ${-a.wrist[1]})`;
    // Arms tucked behind the torso bring the forearm and hand in front of it once they come forward.
    const front = f > 0.35 && view.order.indexOf(`arm-${side}`) < view.order.indexOf("torso");
    return { a, p, f, sh, lower, handAt, front };
  };

  const libHand = (side: string, a: ArmData, p: ArmPose) => {
    const hand = RIG.hands[p.hand!];
    const scale = view.handHeight / RIG.hands["turn-01"].height;
    // Library hands are drawn as the screen-left hand of the front view.
    const flip = (side === "r") !== !!p.mirrorHand ? -1 : 1;
    // Gesture hands are drawn fingers-up; they hang down at rest and stand up as the forearm comes forward.
    const turn = hand.dir === "up" ? 180 * (1 - (p.forward ?? 0)) : 0;
    return (
      <Svg
        markup={hand.markup}
        transform={`translate(${a.wrist[0]} ${a.wrist[1]}) rotate(${turn}) scale(${flip * scale} ${scale}) translate(${-hand.wrist[0]} ${-hand.wrist[1]})`}
      />
    );
  };

  const hand = (side: string) => {
    const { a, p, sh, handAt } = armChain(side);
    return (
      <g transform={`${vt} ${sh} ${handAt}`}>
        {p.hand ? libHand(side, a, p) : <Svg markup={view.pieces[`hand-${side}`]} transform={a.handFix} />}
      </g>
    );
  };

  // Forearm and hand drawn above everything else, for arms tucked behind the torso
  // whose forearm has come forward. The elbow patch is kept small so it only
  // erases the forearm's cap line, not the vest next to the arm.
  const forearm = (side: string) => {
    const { a, sh, lower } = armChain(side);
    const clip = `${id}-elbow-front-${side}`;
    return (
      <g key={`front-${side}`}>
        <g transform={vt}>
          <g transform={sh}>
            <Svg markup={a.lower} transform={lower} />
            <clipPath id={clip}>
              <circle cx={a.elbow[0]} cy={a.elbow[1]} r={a.patch * 0.35} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              <Svg markup={a.upperFill} />
              <Svg markup={a.lowerFill} transform={lower} />
            </g>
          </g>
        </g>
        {hand(side)}
      </g>
    );
  };
  const frontLayer: React.ReactNode[] = [];

  const head = pose.head ?? {};

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
                {pose.face && <Face view={SOURCE[headView].src} mirror={SOURCE[headView].mirror} pose={pose.face} id={id} />}
              </g>
            </g>
          );
        }
        if (name.startsWith("arm-")) {
          const side = name.slice(4);
          const { a, sh, lower, front } = armChain(side);
          const clip = `${id}-elbow-${side}`;
          if (front) frontLayer.push(forearm(side));
          return (
            <g key={name} transform={vt}>
              <g transform={sh}>
                <Svg markup={a.upper} />
                {!front && (
                  <>
                    <Svg markup={a.lower} transform={lower} />
                    {/* Elbow patch: both sleeve fills, clipped to a circle at the joint,
                        paint over the outlines where the two pieces cross. */}
                    <clipPath id={clip}>
                      <circle cx={a.elbow[0]} cy={a.elbow[1]} r={a.patch} />
                    </clipPath>
                    <g clipPath={`url(#${clip})`}>
                      <Svg markup={a.upperFill} />
                      <Svg markup={a.lowerFill} transform={lower} />
                    </g>
                  </>
                )}
              </g>
            </g>
          );
        }
        if (name.startsWith("hand-")) {
          const side = name.slice(5);
          if (armChain(side).front) return null;
          return <g key={name}>{hand(side)}</g>;
        }
        return <Svg key={name} markup={view.pieces[name]} transform={vt} />;
      })}
      {frontLayer}
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
