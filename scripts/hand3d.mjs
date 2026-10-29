// Splits the "3d HAND" artboard (Turntable views of one hand) into per-view
// data for the hand playground (playground/hand3d.html).
//
//   node scripts/hand3d.mjs assets/characters/griff/hand3d/hand3d_sheet.svg src/data/griff.rig.json playground/hand3d.data.js
//
// Two sets: "hang" (hand hanging from the wrist, turning around the forearm)
// and "flat" (the All Views Grid: hand lying sideways, so turning it points
// the fingers toward or away from the camera). Each view is named by its
// Turntable (turn, tilt) angles.
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";
import { bbox, endCentre, markup, pointsOf, pt, round, SHAPES } from "./svg-geometry.mjs";

const [sheetFile, rigFile, outFile] = process.argv.slice(2);
const root = parse(readFileSync(sheetFile, "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, ""));
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

// The forearm the hand hangs from: the front view's left forearm, at rest.
const arm = rig.views["000"].arms.l;
const data = {
  sets,
  forearm: { markup: arm.lower, elbow: arm.elbow, wrist: arm.wrist },
  // Same scale the rig gives library hands, relative to the forearm.
  handScale: rig.views["000"].handHeight / rig.hands["turn-01"].height,
};

writeFileSync(outFile, `window.HAND3D = ${JSON.stringify(data)};\n`);
console.log(Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, Object.keys(v).length])), "views");
