// Splits the "3d HAND" artboard (Turntable views of one hand) into per-view
// data for the hand playground (playground/hand3d.html).
//
//   node scripts/hand3d.mjs assets/characters/griff/hand3d/hand3d_sheet.svg \
//     assets/characters/griff/hand3d/forearm3d_sheet.svg src/data/griff.rig.json playground/hand3d.data.js
//
// Two sets: "hang" (hand hanging from the wrist, turning around the forearm)
// and "flat" (the All Views Grid: hand lying sideways, so turning it points
// the fingers toward or away from the camera). Each view is named by its
// Turntable (turn, tilt) angles. The "3D Antebrazo" artboard has the same two
// sets for the forearm.
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";
import { bbox, endCentre, markup, pointsOf, pt, round, SHAPES } from "./svg-geometry.mjs";

const [sheetFile, forearmFile, rigFile, outFile] = process.argv.slice(2);
const load = (file) => parse(readFileSync(file, "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, ""));
const root = load(sheetFile);
const rig = JSON.parse(readFileSync(rigFile, "utf8"));

// Nails are the dark brown fills; the wrist is the end of the hand away from them.
const isNail = (fill) => {
  if (!fill || !/^#[0-9a-f]{6}$/i.test(fill)) return false;
  const n = parseInt(fill.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  return lum > 45 && lum < 125 && r >= g && g >= b;
};

const sets = { hang: {}, flat: {} };
for (const g of root.querySelectorAll("g")) {
  const m = (g.getAttribute("id") ?? "").match(/^Generative_Object_(-?\d+)_(-?\d+)_(-2)?$/);
  if (!m) continue;
  const [, turn, tilt, second] = m;
  const set = second ? "flat" : "hang";
  const shapes = g.querySelectorAll(SHAPES);
  const P = shapes.flatMap(pointsOf);
  const b = bbox(P);
  const centre = [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2];
  const nails = shapes.filter((el) => isNail(el.getAttribute("fill"))).flatMap(pointsOf);
  const tips = nails.length ? [nails.reduce((s, p) => s + p[0], 0) / nails.length, nails.reduce((s, p) => s + p[1], 0) / nails.length] : [centre[0], b.maxY];
  // Hanging hands: wrist on top. Lying hands: the far end from the nails.
  const wrist =
    set === "hang" ? endCentre(P, centre, [centre[0], b.minY], 12, 14) : endCentre(P, tips, centre, 12, 14);
  sets[set][`${turn},${tilt}`] = {
    markup: markup(g),
    wrist: pt(...wrist),
    tips: pt(...tips),
    box: [round(b.minX), round(b.minY), round(b.maxX - b.minX), round(b.maxY - b.minY)],
  };
}

// Turning around a vertical axis moves any fixed point of the hand along a
// smooth curve. Detection per view jumps where the hand is foreshortened
// (fingers toward or away from the camera), so in the lying set the wrist and
// fingertip positions (relative to each view's box) are replaced by a fit of
// that curve over the 25 turns of each tilt: a0 + a1·cos θ + b1·sin θ +
// a2·cos 2θ + b2·sin 2θ, weighted toward the views where the hand is long.
function fitTurns(samples) {
  // samples: [{ theta (deg), value, weight }]
  const basis = (t) => {
    const r = (t * Math.PI) / 180;
    return [1, Math.cos(r), Math.sin(r), Math.cos(2 * r), Math.sin(2 * r)];
  };
  const n = 5;
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  const y = Array(n).fill(0);
  for (const { theta, value, weight } of samples) {
    const f = basis(theta);
    for (let i = 0; i < n; i++) {
      y[i] += weight * f[i] * value;
      for (let j = 0; j < n; j++) A[i][j] += weight * f[i] * f[j];
    }
  }
  // Gaussian elimination.
  for (let i = 0; i < n; i++) {
    const p = A[i][i];
    for (let j = i + 1; j < n; j++) {
      const k = A[j][i] / p;
      for (let c = i; c < n; c++) A[j][c] -= k * A[i][c];
      y[j] -= k * y[i];
    }
  }
  const coef = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let acc = y[i];
    for (let c = i + 1; c < n; c++) acc -= A[i][c] * coef[c];
    coef[i] = acc / A[i][i];
  }
  return (t) => basis(t).reduce((sum, f, i) => sum + f * coef[i], 0);
}

function smoothFlat(views) {
  const centre = (v) => [v.box[0] + v.box[2] / 2, v.box[1] + v.box[3] / 2];
  const longest = Math.max(...Object.values(views).map((v) => Math.hypot(v.tips[0] - v.wrist[0], v.tips[1] - v.wrist[1])));
  for (const tilt of [-30, 0, 30]) {
    const row = Object.entries(views)
      .map(([k, v]) => [Number(k.split(",")[0]), Number(k.split(",")[1]), v])
      .filter(([, tl]) => tl === tilt);
    const weight = (v) => Math.max(0.05, Math.hypot(v.tips[0] - v.wrist[0], v.tips[1] - v.wrist[1]) / longest) ** 2;
    const fit = (pick) => fitTurns(row.map(([t, , v]) => ({ theta: t, value: pick(v), weight: weight(v) })));
    const fx = fit((v) => v.wrist[0] - centre(v)[0]), fy = fit((v) => v.wrist[1] - centre(v)[1]);
    const gx = fit((v) => v.tips[0] - centre(v)[0]), gy = fit((v) => v.tips[1] - centre(v)[1]);
    for (const [t, , v] of row) {
      const c = centre(v);
      v.wrist = pt(c[0] + fx(t), c[1] + fy(t));
      v.tips = pt(c[0] + gx(t), c[1] + gy(t));
    }
  }
}
smoothFlat(sets.flat);

// Forearm views. The lying forearm was generated from a different starting
// angle: measured on the sheets, the hand is most foreshortened (fingers to the
// camera) at turn 60 and the forearm shows its cuff opening head-on at -75,
// and likewise elbow-on at 105 against fingers-away at -120. So hand T pairs
// with forearm T - 135.
const PAIR_OFFSET = { hang: 0, flat: -135 };
const turnKey = (t) => (((t + 180) % 360) + 360) % 360 - 180;
const forearms = { hang: {}, flat: {} };
for (const g of load(forearmFile).querySelectorAll("g")) {
  const m = (g.getAttribute("id") ?? "").match(/^Generative_Object_(-?\d+)_(-?\d+)_(-2)?$/);
  if (!m) continue;
  const P = g.querySelectorAll(SHAPES).flatMap(pointsOf);
  const b = bbox(P);
  // The grid of upright forearms is the hanging set.
  const set = b.maxY - b.minY > (b.maxX - b.minX) * 1.3 ? "hang" : "flat";
  forearms[set][`${m[1]},${m[2]}`] = { markup: markup(g), P, b };
}
const forearm3d = { hang: {}, flat: {} };
for (const set of ["hang", "flat"]) {
  for (const [key, hand] of Object.entries(sets[set])) {
    const [turn, tilt] = key.split(",").map(Number);
    const ft = turnKey(turn + PAIR_OFFSET[set]);
    const f = forearms[set][`${ft},${tilt}`] ?? forearms[set][`${-ft},${tilt}`];
    if (!f) continue;
    const c = [(f.b.minX + f.b.maxX) / 2, (f.b.minY + f.b.maxY) / 2];
    // The cuff is the end of the forearm in the direction the hand points.
    const d = set === "hang" ? [0, 1] : [hand.tips[0] - hand.wrist[0], hand.tips[1] - hand.wrist[1]];
    const cuff = endCentre(f.P, c, [c[0] + d[0], c[1] + d[1]], 12, 22);
    // The cuff wraps the wrist, so the forearm draws on top, except while its
    // opening faces the camera (lying, forearm turns -135..-15, centred on -75)
    // and the hand comes out toward the viewer.
    const front = set === "hang" || !(ft > -135 && ft < -15);
    forearm3d[set][key] = { markup: f.markup, cuff: pt(...cuff), front, turn: ft, centre: c, len: Math.max(f.b.maxX - f.b.minX, f.b.maxY - f.b.minY) };
  }
}

// Same smoothing for the cuff of the lying forearm: a fit over its own turns,
// weighted toward the views where the forearm is seen full length.
{
  const views = Object.entries(forearm3d.flat).map(([k, f]) => [Number(k.split(",")[1]), f]);
  const longest = Math.max(...views.map(([, f]) => f.len));
  for (const tilt of [-30, 0, 30]) {
    const row = views.filter(([tl]) => tl === tilt).map(([, f]) => f);
    const weight = (f) => Math.max(0.05, f.len / longest) ** 4;
    const fit = (pick) => fitTurns(row.map((f) => ({ theta: f.turn, value: pick(f), weight: weight(f) })));
    const fx = fit((f) => f.cuff[0] - f.centre[0]), fy = fit((f) => f.cuff[1] - f.centre[1]);
    for (const f of row) f.cuff = pt(f.centre[0] + fx(f.turn), f.centre[1] + fy(f.turn));
  }
}
for (const set of Object.values(forearm3d)) for (const f of Object.values(set)) {
  delete f.centre;
  delete f.len;
}

// The forearm the hand hangs from: the front view's left forearm, at rest.
const arm = rig.views["000"].arms.l;
const data = {
  sets,
  forearm3d,
  // The Turntable forearm came out small next to the hand.
  forearm3dScale: 1.3,
  forearm: { markup: arm.lower, elbow: arm.elbow, wrist: arm.wrist },
  // Same scale the rig gives library hands, relative to the forearm.
  handScale: rig.views["000"].handHeight / rig.hands["turn-01"].height,
};

writeFileSync(outFile, `window.HAND3D = ${JSON.stringify(data)};\n`);
console.log(
  Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, Object.keys(v).length])), "hand views,",
  Object.fromEntries(Object.entries(forearm3d).map(([k, v]) => [k, Object.keys(v).length])), "paired forearms",
);
