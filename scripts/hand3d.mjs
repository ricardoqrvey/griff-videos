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
    // Lying, forearm turns around 105 (15..195) put the elbow toward the camera:
    // the forearm is in front of the hand. Hanging, the cuff covers the wrist.
    const front = set === "hang" || ft > 15 || ft < -165;
    forearm3d[set][key] = { markup: f.markup, cuff: pt(...cuff), front, turn: ft };
  }
}

// The forearm the hand hangs from: the front view's left forearm, at rest.
const arm = rig.views["000"].arms.l;
const data = {
  sets,
  forearm3d,
  forearm: { markup: arm.lower, elbow: arm.elbow, wrist: arm.wrist },
  // Same scale the rig gives library hands, relative to the forearm.
  handScale: rig.views["000"].handHeight / rig.hands["turn-01"].height,
};

writeFileSync(outFile, `window.HAND3D = ${JSON.stringify(data)};\n`);
console.log(
  Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, Object.keys(v).length])), "hand views,",
  Object.fromEntries(Object.entries(forearm3d).map(([k, v]) => [k, Object.keys(v).length])), "paired forearms",
);
