// Cut-out rig built from the Illustrator export (see scripts/rig_from_svg.mjs).
// Each view is a stack of pieces; arms bend at shoulder, elbow and wrist, and
// hands can be swapped for any hand in the library.
import rigData from "../data/griff.rig.json";
import hand3dData from "../data/griff.hand3d.json";
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
  sleeve: { upper: [number, number]; lower: [number, number] }; // half-widths left (+) / right (−) of each axis, near the elbow
};
type ViewData = {
  w: number;
  h: number;
  order: string[];
  pieces: Record<string, string>;
  arms: Record<string, ArmData>;
  neck: Pt;
  anchorX: number;
  waist: Pt;
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

// Turntable views of the hand with its forearm (scripts/hand3d.mjs), placed by
// hand in the playground. Joint (wrist/cuff) at the origin, in hand-art units.
type Hand3dView = { markup: string; wrist: Pt };
type Forearm3dView = { markup: string; cuff: Pt; elbow: Pt; front: boolean; mouth?: { x: number; y: number; rx: number; ry: number; rot: number } };
type Offset = { hand?: Pt; arm?: Pt; mouth?: Forearm3dView["mouth"] | false };
const H3 = hand3dData as unknown as {
  sets: Record<string, Record<string, Hand3dView>>;
  forearm3d: Record<string, Record<string, Forearm3dView>>;
  forearm3dScale: Record<string, number>;
  hand3dScale: Record<string, number>;
  offsets: Record<string, Offset>;
  handScale: number;
};

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
export type ArmPose = {
  shoulder: number;
  elbow: number;
  wrist?: number;
  hand?: string;
  mirrorHand?: boolean;
  hand3d?: Hand3dPose;
  /** Forearm and hand in front of the torso (0–1; between, the front copy fades
   *  in over the back one). Defaults to on once the elbow swings the forearm in
   *  across the body (elbow < -ACROSS_AT) in front/back views; acrossAt() in
   *  the timeline eases that switch over a few frames. */
  across?: number;
  /** Elbow drop in stage units, overriding the automatic one. */
  drop?: number;
};
/** A Turntable view of hand and forearm together, drawn instead of the flat
 *  forearm and hand: turn rolls the hand around the forearm (15° steps). */
export type Hand3dPose = {
  turn: number;
  tilt?: number;
  set?: "hang" | "flat";
  /** "rig" (default): laid along the rig's forearm, stretched to its length.
   *  "free": the view as drawn, its far end on the rig's elbow (the elbow angle
   *  is ignored); for the lying set, where the forearm swings toward the camera. */
  fit?: "rig" | "free";
  /** Draw the forearm and hand over the torso (reaching toward the camera). */
  front?: boolean;
};
export type RigPose = {
  view: View;
  headView?: View; // lets the head lead the body by a frame during turns
  arms: { l?: ArmPose; r?: ArmPose; near?: ArmPose }; // screen sides
  head?: { tilt?: number; nod?: number };
  face?: FacePose;
  /** Upper body: lift (px up, a shrug) and lean (degrees, tilting from the waist,
   *  which raises one shoulder; vest, sleeves and head go with it). */
  body?: { lift?: number; lean?: number };
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

const white = (markup: string) => markup.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#fff"');

type V = [number, number];
const norm = (v: V): V => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const turnV = (v: V, deg: number): V => {
  const t = (deg * Math.PI) / 180;
  return [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
};

/** Fold lines on the inside of a bent elbow. The first starts right in the
 *  "V" where the inner edges of upper arm and forearm meet (from ~12° of bend);
 *  the second, past ~50°, floats a little further along the forearm. */
function elbowFolds(a: ArmData, bend: number, deg = Math.abs(bend)) {
  const E = a.elbow;
  const u = norm([E[0] - a.shoulder[0], E[1] - a.shoulder[1]]);
  const f = turnV(norm([a.wrist[0] - E[0], a.wrist[1] - E[1]]), bend);
  const c = norm([f[0] - u[0], f[1] - u[1]]); // toward the inside of the bend
  const hw = a.patch / 2.3; // half the sleeve width
  if (deg < 12) return [];
  // Inner edges: each limb's axis pushed half a sleeve toward the inside.
  // Push each axis out to its inner edge, using the sleeve's measured width on that side.
  const edge = (d: V, widths: [number, number]): V => {
    const n: V = [-d[1], d[0]]; // the "+" side of the axis
    const plus = n[0] * c[0] + n[1] * c[1] > 0;
    const w = plus ? widths[0] : widths[1];
    return [E[0] + (plus ? n[0] : -n[0]) * w, E[1] + (plus ? n[1] : -n[1]) * w];
  };
  const p1 = edge(u, a.sleeve.upper);
  const p2 = edge(f, a.sleeve.lower);
  // Intersect p1 + s·u with p2 + t·f.
  const den = u[0] * f[1] - u[1] * f[0];
  const sAlong = ((p2[0] - p1[0]) * f[1] - (p2[1] - p1[1]) * f[0]) / den;
  const V: V = [p1[0] + u[0] * sAlong, p1[1] + u[1] * sAlong];
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  // Each crease runs from the inside edge back toward the joint, bowing toward the shoulder.
  const crease = (start: V, amount: number) => {
    const len = hw * (0.22 + 0.3 * amount);
    const end: V = [start[0] - c[0] * len, start[1] - c[1] * len];
    const q: V = [(start[0] + end[0]) / 2 - u[0] * hw * 0.1, (start[1] + end[1]) / 2 - u[1] * hw * 0.1];
    return `M${start} Q${q} ${end}`;
  };
  const tuck = 2; // just inside the outline
  const folds = [crease([V[0] - c[0] * tuck, V[1] - c[1] * tuck], clamp((deg - 12) / 50))];
  if (deg > 50) {
    const s2: V = [V[0] - c[0] * hw * 0.08 + f[0] * hw * 0.2, V[1] - c[1] * hw * 0.08 + f[1] * hw * 0.2];
    folds.push(crease(s2, clamp((deg - 50) / 50) * 0.7));
  }
  return folds;
}

const HAND3D_TUCK = 24;
// Measured on the front view: turn-03 reached 30 stage units past the
// Turntable palm it follows.
const TURN_HAND_TUCK = 30;
// The Turntable cuff ends lower than the rig's sleeve (measured on the front
// view: 20 stage units), so the whole Turntable arm sits that much up the forearm.
const HAND3D_LIFT = 20;
// The elbow joint: the rig's sleeve pieces end in round caps of radius CAP_R,
// the upper arm's UPPER_CAP above the rig's elbow point and the forearm's
// LOWER_CAP below it, half-widths UPPER_W and LOWER_W (measured, the same in every view). The joint sits
// ELBOW_PIVOT further down the arm, where the elbow reads right.
const UPPER_CAP = 11, LOWER_CAP = 13, UPPER_W = 66, LOWER_W = 67.6, CAP_R = LOWER_W;
const ELBOW_PIVOT = 70;
// Elbow bend (degrees, inward) past which the forearm comes over the torso.
// The elbow's round end stays behind the vest, so only the forearm's inner
// edge over the vest changes at the switch.
export const ACROSS_AT = 5;

/** Hand and forearm from one Turntable camera, laid along the rig's forearm:
 *  the cuff on the rig's wrist, the far end on its elbow (the forearm is
 *  stretched along its length to fit), the hand at the rig's hand size. */
function Hand3d({ a, p, flip, id, over }: { a: ArmData; p: Hand3dPose; flip: number; id: string; over?: string }) {
  const set = p.set ?? "hang";
  const key = `${p.turn},${p.tilt ?? 0}`;
  const v = H3.sets[set][key], f = H3.forearm3d[set][key];
  if (!v || !f) return null;
  const o = H3.offsets[`${set}|${key}`] ?? {};
  const [hx, hy] = o.hand ?? [0, 0], [ax, ay] = o.arm ?? [0, 0];
  const fs = H3.forearm3dScale[set];
  // The forearm's far end relative to the joint, mirrored with the hand.
  const E: V = [flip * (ax + fs * (f.elbow[0] - f.cuff[0])), ay + fs * (f.elbow[1] - f.cuff[1])];
  const s = H3.handScale;
  const R0: V = [a.elbow[0] - a.wrist[0], a.elbow[1] - a.wrist[1]];
  const r0 = Math.hypot(...R0);
  const joint: V = [a.wrist[0] + (R0[0] / r0) * HAND3D_LIFT, a.wrist[1] + (R0[1] / r0) * HAND3D_LIFT];
  const R: V = [a.elbow[0] - joint[0], a.elbow[1] - joint[1]];
  const deg = (v: V) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const rot = deg(R) - deg(E);
  const stretch = Math.hypot(...R) / (Math.hypot(...E) * s);
  const armT = `translate(${ax} ${ay}) scale(${fs}) translate(${-f.cuff[0]} ${-f.cuff[1]})`;
  // The Turntable hands come out of the cuff with a long wrist showing: slide
  // each one up the forearm, under the cuff, by HAND3D_TUCK (hand-art units).
  const u: V = [(f.elbow[0] - f.cuff[0]) * fs + ax, (f.elbow[1] - f.cuff[1]) * fs + ay];
  const ul = Math.hypot(...u);
  const m = o.mouth === false ? null : o.mouth ?? f.mouth ?? null;
  // Not where the cuff opening shows: there the hand comes out of the opening as placed.
  const tuck = m ? 0 : HAND3D_TUCK;
  const tx = hx + (u[0] / ul) * tuck, ty = hy + (u[1] / ul) * tuck;
  const handM = `<g transform="translate(${tx} ${ty}) scale(${H3.hand3dScale[set] ?? 1}) translate(${-v.wrist[0]} ${-v.wrist[1]})">${v.markup}</g>`;
  const armM = `<g transform="${armT}">${f.markup}</g>`;
  // Each layer is [markup, part of the forearm?]; only the forearm stretches,
  // about the joint, so the hand keeps its size and place.
  let layers: [string, boolean][] = f.front ? [[handM, false], [armM, true]] : [[armM, true], [handM, false]];
  if (m) {
    // Sleeve, hand, then the sleeve again except inside the cuff opening.
    const ex = f.cuff[0] + m.x, ey = f.cuff[1] + m.y;
    const mask = `<mask id="${id}" maskUnits="userSpaceOnUse" x="-20000" y="-20000" width="40000" height="40000"><rect x="-20000" y="-20000" width="40000" height="40000" fill="#fff"/><ellipse cx="${ex}" cy="${ey}" rx="${m.rx}" ry="${m.ry}" transform="rotate(${m.rot} ${ex} ${ey})" fill="#000"/></mask>`;
    layers = [[armM, true], [handM, false], [`<g transform="${armT}" mask="url(#${id})">${mask}${f.markup}</g>`, true]];
  }
  if (p.fit === "free") {
    const at = `translate(${a.elbow[0] - E[0] * s} ${a.elbow[1] - E[1] * s}) scale(${flip * s} ${s})`;
    const html = layers.map(([markup]) => `<g transform="${at}">${markup}</g>`).join("");
    // Seen at length (out to the side), the forearm's rounded far end would show
    // over the upper arm: paint the upper arm's fill over the joint and add the
    // crease on the inside of the bend. Toward the camera the forearm is in
    // front of the upper arm, so it stays whole.
    const len = Math.hypot(...E) * s;
    const side = len > Math.hypot(a.elbow[0] - a.wrist[0], a.elbow[1] - a.wrist[1]) * 0.6;
    const d = norm([-E[0], -E[1]]);
    const u = norm([a.elbow[0] - a.shoulder[0], a.elbow[1] - a.shoulder[1]]);
    const bendDeg = (Math.acos(Math.max(-1, Math.min(1, u[0] * d[0] + u[1] * d[1]))) * 180) / Math.PI;
    const joint: V = [a.elbow[0] + d[0] * 100, a.elbow[1] + d[1] * 100];
    // The lying forearm is slimmer than the rig's (half-width ~52 on the sheet).
    const sleeve = { upper: a.sleeve.upper, lower: [52, 52] as [number, number] };
    const folds = side ? elbowFolds({ ...a, wrist: joint, sleeve }, 0, bendDeg).slice(0, 1) : [];
    return (
      <>
        <g dangerouslySetInnerHTML={{ __html: html }} />
        {side && (
          <>
            <clipPath id={`${id}-joint`}>
              <circle cx={a.elbow[0]} cy={a.elbow[1]} r={a.patch * 0.55} />
            </clipPath>
            {/* Drawn over the torso, the patch must not paint the upper arm over it. */}
            {over && (
              <mask id={`${id}-over`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
                <rect x={-2000} y={-2000} width={6000} height={6000} fill="#fff" />
                <g dangerouslySetInnerHTML={{ __html: over }} />
              </mask>
            )}
            <g mask={over ? `url(#${id}-over)` : undefined}>
              <g clipPath={`url(#${id}-joint)`} dangerouslySetInnerHTML={{ __html: a.upperFill }} />
            </g>
            <mask id={`${id}-fold`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
              <g dangerouslySetInnerHTML={{ __html: white(a.upperFill) }} />
              <g dangerouslySetInnerHTML={{ __html: `<g transform="${at}">${white(armM)}</g>` }} />
            </mask>
            <g mask={`url(#${id}-fold)`} fill="none" stroke="#111" strokeWidth={5} strokeLinecap="round">
              {folds.map((path) => (
                <path key={path} d={path} />
              ))}
            </g>
          </>
        )}
      </>
    );
  }
  const html = layers
    .map(([markup, arm]) => `<g transform="rotate(${deg(E)}) scale(${arm ? stretch : 1} 1) rotate(${-deg(E)}) scale(${flip * s} ${s})">${markup}</g>`)
    .join("");
  return <g transform={`translate(${joint[0]} ${joint[1]}) rotate(${rot})`} dangerouslySetInnerHTML={{ __html: html }} />;
}

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
    const bend = p.elbow * s.el, shAngle = p.shoulder * s.sh;
    // One fixed joint for every angle: ELBOW_PIVOT below the forearm's own
    // rounded end. The upper arm stretches so its rounded end sits on the
    // joint (that end moves rigidly, only the sleeve above it stretches); the
    // forearm is trimmed to a round end of the same radius there, so the two
    // circles overlap exactly as it bends.
    const jointed = !a.swingIn;
    const D = jointed ? p.drop ?? ELBOW_PIVOT : 0;
    const ua = norm([a.elbow[0] - a.shoulder[0], a.elbow[1] - a.shoulder[1]]);
    const fa = norm([a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]]);
    // The joint sits on the forearm's own axis, so the sleeve stays straight at rest.
    const J: V = jointed ? [a.elbow[0] + fa[0] * (LOWER_CAP + D), a.elbow[1] + fa[1] * (LOWER_CAP + D)] : a.elbow;
    const Cu: V = [a.elbow[0] - ua[0] * UPPER_CAP, a.elbow[1] - ua[1] * UPPER_CAP];
    // Upper arm: a shear-stretch about the shoulder that carries its rounded
    // end's centre Cu onto J, and every point on the line across Cu with it.
    const L = Math.hypot(Cu[0] - a.shoulder[0], Cu[1] - a.shoulder[1]);
    const dl: V = [J[0] - Cu[0], J[1] - Cu[1]];
    // Widened a touch to the forearm's width, so the two outlines run on.
    const nx = -ua[1], ny = ua[0], wk = LOWER_W / UPPER_W - 1;
    const W = [1 + wk * nx * nx, wk * nx * ny, wk * nx * ny, 1 + wk * ny * ny]; // [a, b, c, d]
    const M = [1 + (dl[0] * ua[0]) / L, (dl[1] * ua[0]) / L, (dl[0] * ua[1]) / L, 1 + (dl[1] * ua[1]) / L];
    const mul = (A: number[], B: number[]) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3]];
    // A linear map about the shoulder, then a shift.
    const about = (A: number[], t: V = [0, 0]) => {
      const S0 = a.shoulder;
      return `matrix(${A[0]} ${A[1]} ${A[2]} ${A[3]} ${S0[0] - A[0] * S0[0] - A[2] * S0[1] + t[0]} ${S0[1] - A[1] * S0[0] - A[3] * S0[1] + t[1]})`;
    };
    const up = jointed ? about(mul(M, W)) : undefined;
    const tip = about(W, dl);
    const el = `rotate(${bend} ${J[0]} ${J[1]})`;
    const wr = `rotate(${(p.wrist ?? 0) * s.el} ${a.wrist[0]} ${a.wrist[1]})`;
    const across = a.swingIn ? 0 : p.across ?? (p.elbow < -ACROSS_AT ? 1 : 0);
    // The joint, for the patch and folds.
    const moved: ArmData = { ...a, elbow: J };
    const plane = (c: V, ax: V, dir: 1 | -1) => {
      const n: V = [-ax[1] * 4000, ax[0] * 4000], f: V = [ax[0] * 4000 * dir, ax[1] * 4000 * dir];
      return `M${c[0] + n[0]} ${c[1] + n[1]}L${c[0] - n[0]} ${c[1] - n[1]}L${c[0] - n[0] + f[0]} ${c[1] - n[1] + f[1]}L${c[0] + n[0] + f[0]} ${c[1] + n[1] + f[1]}Z`;
    };
    const at = (o: number): V => [Cu[0] + ua[0] * o, Cu[1] + ua[1] * o];
    const cut = jointed ? { near: plane(at(0.75), ua, -1), far: plane(at(-0.75), ua, 1) } : undefined;
    // The forearm past the joint, plus a round end on it (forearm's own frame).
    const trim = jointed ? { plane: plane(J, fa, 1), J } : undefined;
    return { a, p, sh, el, wr, bend, across, shAngle, up, tip, cut, moved, trim };
  };

  /** Upper-arm markup, stretched to the dropped elbow (see armChain). */
  const upperArm = (side: string, markup: string, key: string) => {
    const { up, tip, cut } = armChain(side);
    if (!cut) return <Svg markup={markup} />;
    const n = `${id}-ua-${side}-${key}`;
    return (
      <>
        <clipPath id={`${n}-a`}><path d={cut.near} /></clipPath>
        <clipPath id={`${n}-b`}><path d={cut.far} /></clipPath>
        <Svg markup={markup} transform={up} clipPath={`url(#${n}-a)`} />
        <Svg markup={markup} transform={tip} clipPath={`url(#${n}-b)`} />
      </>
    );
  };

  /** Forearm (rig or Turntable), elbow patch and folds, in the shoulder's frame.
   *  `hide` names a mask that keeps the upper arm's patch off the torso, for a
   *  forearm drawn over it. */
  const forearm = (side: string, hide?: string) => {
    const { a, p, el, bend, shAngle, moved, trim } = armChain(side);
    const trimId = `${id}-trim-${side}`;
    const trimmed = trim ? `url(#${trimId})` : undefined;
    // Drawn over the torso, only the forearm past the joint comes in front:
    // its round end belongs to the elbow, which stays behind the vest.
    const trimmedDraw = (draw: (clip?: string) => React.ReactNode) =>
      !trim ? draw() : !hide ? draw(trimmed) : (
        <>
          {draw(`url(#${trimId}-plane)`)}
          <g mask={`url(#${hide})`}>{draw(`url(#${trimId}-disc)`)}</g>
        </>
      );
    const black = view.pieces.torso.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#000"');
    const unSh = `rotate(${-shAngle} ${a.shoulder[0]} ${a.shoulder[1]})`;
    const clip = `${id}-elbow-${side}`;
    const sleeve = `${id}-sleeve-${side}`;
    // A free Turntable forearm carries its own bend and patches its own joint.
    const free = p.hand3d?.fit === "free";
    const folds = free ? [] : elbowFolds(moved, bend);
    return (
      <>
        {trim && (
          <>
            <clipPath id={trimId}>
              <path d={trim.plane} />
              <circle cx={trim.J[0]} cy={trim.J[1]} r={CAP_R} />
            </clipPath>
            <clipPath id={`${trimId}-plane`}>
              <path d={trim.plane} />
            </clipPath>
            <clipPath id={`${trimId}-disc`}>
              <circle cx={trim.J[0]} cy={trim.J[1]} r={CAP_R} />
            </clipPath>
          </>
        )}
        {p.hand3d?.front ? null : p.hand3d ? (
          free ? (
            <Hand3d a={a} p={p.hand3d} flip={hand3dFlip(side, p)} id={`${id}-cuff-${side}`} />
          ) : (
            trimmedDraw((clip) => (
              <g transform={el}>
                <g clipPath={clip}>
                  <Hand3d a={a} p={p.hand3d!} flip={hand3dFlip(side, p)} id={`${id}-cuff-${side}${clip?.includes("disc") ? "-d" : ""}`} />
                </g>
              </g>
            ))
          )
        ) : (
          trimmedDraw((clip) => <Svg markup={a.lower} transform={el} clipPath={clip} />)
        )}
        {/* Elbow patch: both sleeve fills, clipped to a circle at the joint,
            paint over the outlines where the two pieces cross. */}
        <clipPath id={clip}>
          <circle cx={moved.elbow[0]} cy={moved.elbow[1]} r={a.patch} />
        </clipPath>
        {hide && (
          <mask id={hide} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
            <rect x={-2000} y={-2000} width={6000} height={6000} fill="#fff" />
            <g transform={unSh} dangerouslySetInnerHTML={{ __html: black }} />
          </mask>
        )}
        {!free && (
          <g clipPath={`url(#${clip})`}>
            <g mask={hide ? `url(#${hide})` : undefined}>
              {upperArm(side, a.upperFill, "patch")}
            </g>
            {trimmedDraw((clip) => <Svg markup={a.lowerFill} transform={el} clipPath={clip} />)}
          </g>
        )}
        {folds.length > 0 && (
          <>
            {/* A mask, not a clipPath: the fills come wrapped in groups. */}
            <mask id={sleeve} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
              {upperArm(side, white(a.upperFill), "fold")}
              <g transform={el} clipPath={trimmed} dangerouslySetInnerHTML={{ __html: white(a.lowerFill) }} />
            </mask>
            <g mask={`url(#${sleeve})`} fill="none" stroke="#111" strokeWidth={5} strokeLinecap="round">
              {folds.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
          </>
        )}
      </>
    );
  };

  const hand = (side: string) => {
    const { a, p, sh, el, wr } = armChain(side);
    return (
      <g transform={`${sh} ${el} ${wr}`}>
        {p.hand3d ? null : p.hand ? libHand(side, a, p) : <Svg markup={view.pieces[`hand-${side}`]} transform={a.handFix} />}
      </g>
    );
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
    // The turn series shows a long wrist below the cuff: slide those hands up
    // the forearm, under the sleeve, to meet the Turntable hands of the roll.
    const tuck = p.hand!.startsWith("turn-") ? TURN_HAND_TUCK : 0;
    const up = norm([a.elbow[0] - a.wrist[0], a.elbow[1] - a.wrist[1]]);
    const at: V = [a.wrist[0] + up[0] * tuck, a.wrist[1] + up[1] * tuck];
    return (
      <Svg
        markup={hand.markup}
        transform={`translate(${at[0]} ${at[1]}) rotate(${turn}) scale(${flip * scale} ${scale}) translate(${-hand.wrist[0]} ${-hand.wrist[1]})`}
      />
    );
  };

  // The Turntable hand is a left hand (its turns run the same way as the
  // turn-01…10 series); Griff's left hand is the screen-right arm.
  const hand3dFlip = (side: string, p: ArmPose) => ((side === "l") !== !!p.mirrorHand ? -1 : 1);

  const head = pose.head ?? {};
  // Everything above the legs rides the body lift and lean.
  const body = pose.body ?? {};
  const bodyT = `translate(0 ${-(body.lift ?? 0)}) rotate(${body.lean ?? 0} ${view.waist[0]} ${view.waist[1]})`;

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} width="100%" height="100%" overflow="visible">
      {view.order
        .filter((name) => !name.startsWith("hand-"))
        .flatMap((name) => (name.startsWith("arm-") ? [`hand-${name.slice(4)}`, name] : [name]))
        // Forearms swung in across the body come over the torso.
        .flatMap((name) => (name === "torso" ? [name, ...Object.keys(view.arms).map((side) => `across-${side}`)] : [name]))
        .map((name) => {
        if (name === "head") {
          const hn = headSrc.neck;
          return (
            <g key={name} transform={`${viewTransform(headView)} ${bodyT}`}>
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
        if (name.startsWith("across-")) {
          // Forearm, hand and elbow over the torso; the upper arm stays behind it.
          const side = name.slice(7);
          const { sh, across } = armChain(side);
          if (!across) return null;
          const hide = `${id}-torso-${side}`;
          return (
            <g key={name} transform={`${vt} ${bodyT}`} opacity={across < 1 ? across : undefined}>
              {/* The hand first, so the cuff covers its wrist, as at rest. */}
              {hand(side)}
              <g transform={sh}>{forearm(side, hide)}</g>
            </g>
          );
        }
        if (name.startsWith("arm-")) {
          const side = name.slice(4);
          const { sh, a, across } = armChain(side);
          return (
            <g key={name} transform={`${vt} ${bodyT}`}>
              <g transform={sh}>
                {upperArm(side, a.upper, "arm")}
                {across < 1 && forearm(side)}
              </g>
            </g>
          );
        }
        if (name.startsWith("hand-")) {
          const side = name.slice(5);
          return armChain(side).across === 1 ? null : <g key={name} transform={`${vt} ${bodyT}`}>{hand(side)}</g>;
        }
        return <Svg key={name} markup={view.pieces[name]} transform={name === "legs" ? vt : `${vt} ${bodyT}`} />;
      })}
      {Object.keys(view.arms).map((side) => {
        const { a, p, sh, el, shAngle } = armChain(side);
        if (!p.hand3d?.front) return null;
        // The torso in the arm's frame (undoing the shoulder turn), in black for a mask.
        const torso = `<g transform="rotate(${-shAngle} ${a.shoulder[0]} ${a.shoulder[1]})">${view.pieces.torso.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#000"')}</g>`;
        return (
          <g key={`front-${side}`} transform={`${vt} ${bodyT} ${sh} ${p.hand3d.fit === "free" ? "" : el}`}>
            <Hand3d a={a} p={p.hand3d} flip={hand3dFlip(side, p)} id={`${id}-cuff-${side}`} over={torso} />
          </g>
        );
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
