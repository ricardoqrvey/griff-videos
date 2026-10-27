// Turns the SVGs exported from Illustrator (one artboard per view, pieces as
// named groups) into rig data: each piece's markup plus the joint pivots.
//
//   node scripts/rig_from_svg.mjs assets/characters/griff src/data/griff.rig.json
//
// Pivots are measured from the art itself, so re-exporting from Illustrator
// is all it takes to update the rig.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";
import { svgPathProperties } from "svg-path-properties";

const [dir, outFile] = process.argv.slice(2);
const VIEW_RE = /^griff_(\d{3})\.svg$/;
const HAND_RE = /^hand_(.+)\.svg$/;

// --- geometry ---------------------------------------------------------------

function pointsOf(el) {
  const tag = el.rawTagName;
  if (tag === "path") {
    const props = new svgPathProperties(el.getAttribute("d"));
    const len = props.getTotalLength();
    const n = Math.max(8, Math.min(200, Math.round(len / 4)));
    return Array.from({ length: n + 1 }, (_, i) => {
      const p = props.getPointAtLength((len * i) / n);
      return [p.x, p.y];
    });
  }
  if (tag === "polygon" || tag === "polyline") {
    const nums = el.getAttribute("points").trim().split(/[\s,]+/).map(Number);
    return nums.flatMap((_, i) => (i % 2 ? [] : [[nums[i], nums[i + 1]]]));
  }
  if (tag === "rect") {
    const [x, y, w, h] = ["x", "y", "width", "height"].map((k) => Number(el.getAttribute(k) ?? 0));
    return [[x, y], [x + w, y + h]];
  }
  if (tag === "circle" || tag === "ellipse") {
    const cx = Number(el.getAttribute("cx")), cy = Number(el.getAttribute("cy"));
    const rx = Number(el.getAttribute("r") ?? el.getAttribute("rx")), ry = Number(el.getAttribute("r") ?? el.getAttribute("ry"));
    return [[cx - rx, cy - ry], [cx + rx, cy + ry]];
  }
  return [];
}

const SHAPES = "path, polygon, polyline, rect, circle, ellipse";
const pts = (node) => node.querySelectorAll(SHAPES).flatMap(pointsOf);

function bbox(points) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

const meanX = (points) => points.reduce((s, p) => s + p[0], 0) / points.length;
const round = (v) => Math.round(v * 10) / 10;
const pt = (x, y) => [round(x), round(y)];

// --- markup -------------------------------------------------------------------

// Strip ids (they'd collide between views) and keep presentation attributes.
const markup = (node) => node.innerHTML.replace(/\s+id="[^"]*"/g, "").replace(/\s+data-name="[^"]*"/g, "").replace(/\n\s*/g, "");

// Coloured fills only: outlines are exported as black shapes with no fill attribute.
// With `largestOnly`, just the main sleeve shape, so the patch never touches the cuff.
function fillMarkup(node, largestOnly = false) {
  const fills = node
    .querySelectorAll(SHAPES)
    .filter((el) => {
      const f = el.getAttribute("fill");
      if (!f || f === "none") return false;
      const n = parseInt(f.replace("#", "").padEnd(6, f.slice(-1)).slice(0, 6), 16);
      const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
      return lum > 40;
    });
  const area = (el) => {
    const b = bbox(pointsOf(el));
    return (b.maxX - b.minX) * (b.maxY - b.minY);
  };
  const keep = largestOnly ? [fills.reduce((a, b) => (area(b) > area(a) ? b : a))] : fills;
  return keep.map((el) => el.toString().replace(/\s+id="[^"]*"/g, "")).join("");
}

function readSvg(file) {
  const root = parse(readFileSync(join(dir, file), "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, ""));
  const svg = root.querySelector("svg");
  const [, , w, h] = svg.getAttribute("viewBox").split(/\s+/).map(Number);
  return { root, w, h };
}

// --- views --------------------------------------------------------------------

function arm(group) {
  const upper = group.querySelector(`[id$="_upper"]`);
  const lower = group.querySelector(`[id$="_lower"]`);
  const U = pts(upper), L = pts(lower);
  const ub = bbox(U), lb = bbox(L);
  const uBottom = U.find((p) => p[1] === ub.maxY);
  const lTop = L.find((p) => p[1] === lb.minY);
  const uTop = U.find((p) => p[1] === ub.minY);
  const elbow = [(uBottom[0] + lTop[0]) / 2, (uBottom[1] + lTop[1]) / 2];
  const cuff = L.filter((p) => p[1] > lb.maxY - 12);
  const wrist = [meanX(cuff), lb.maxY - 18];
  const atElbow = U.filter((p) => Math.abs(p[1] - elbow[1]) < 10);
  const half = atElbow.length ? (Math.max(...atElbow.map((p) => p[0])) - Math.min(...atElbow.map((p) => p[0]))) / 2 : 60;
  return {
    upper: markup(upper),
    lower: markup(lower),
    upperFill: fillMarkup(upper, true),
    lowerFill: fillMarkup(lower, true),
    elbow: pt(...elbow),
    wrist: pt(...wrist),
    patch: round(half * 2.3),
    // The sleeve turns around its own tip (like a raglan seam), so no notch opens at the shoulder.
    shoulder: pt(uTop[0], uTop[1] + 12),
  };
}

const views = {};
const hands = {};

for (const file of readdirSync(dir).sort()) {
  const v = file.match(VIEW_RE);
  const hm = file.match(HAND_RE);
  if (v) {
    const { root, w, h } = readSvg(file);
    const group = root.querySelector(`#griff_${v[1]}`);
    const order = [];
    const pieces = {};
    const arms = {};
    let handHeight = 0;
    // Document order is back-to-front, which is the draw order we want.
    for (const child of group.childNodes.filter((n) => n.rawTagName === "g")) {
      const name = child.getAttribute("id");
      order.push(name);
      if (name.startsWith("arm-")) arms[name.slice(4)] = arm(child);
      else pieces[name] = markup(child);
      if (name.startsWith("hand-")) handHeight = Math.max(handHeight, bbox(pts(child)).maxY - bbox(pts(child)).minY);
    }
    const head = bbox(pts(group.querySelector("#head")));
    const torso = bbox(pts(group.querySelector("#torso")));
    const legs = bbox(pts(group.querySelector("#legs")));
    views[v[1]] = {
      w: round(w),
      h: round(h),
      order,
      pieces,
      arms,
      neck: pt((head.minX + head.maxX) / 2, head.maxY - (head.maxY - head.minY) * 0.22),
      anchorX: round((torso.minX + torso.maxX) / 2),
      ground: round(legs.maxY),
      handHeight: round(handHeight),
    };
  } else if (hm) {
    const { root, w, h } = readSvg(file);
    const P = pts(root);
    const b = bbox(P);
    // Turntable hands hang down (wrist on top); gesture hands point up (wrist at the bottom).
    const dir = hm[1].startsWith("turn-") ? "down" : "up";
    const edge = dir === "down" ? P.filter((p) => p[1] < b.minY + 12) : P.filter((p) => p[1] > b.maxY - 12);
    hands[hm[1]] = {
      w: round(w),
      h: round(h),
      markup: markup(root.querySelector("svg")),
      wrist: pt(meanX(edge), dir === "down" ? b.minY + 14 : b.maxY - 14),
      dir,
      height: round(b.maxY - b.minY),
    };
  }
}

// --- borrowed arms -------------------------------------------------------------
// The profile arm (rounded shoulder) reads better in every view than the pointed
// sleeves drawn for the front and back. It's fitted shoulder-to-wrist onto each
// view's own arm, mirrored on the left so the elbow bends in toward the body,
// and tucked behind the torso so the vest hides about half the shoulder cap.
const BORROW = { from: "090", side: "near", into: ["000", "045", "180"], shoulderIn: 40 };

function fit(src, dst, mirror) {
  // Reflect about the source shoulder, then rotate + scale + translate onto dst.
  const m = mirror ? [-1, 0, 0, 1, 2 * src.shoulder[0], 0] : [1, 0, 0, 1, 0, 0];
  const ap = (p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const s0 = ap(src.shoulder), s1 = ap(src.wrist);
  const k = Math.hypot(dst.wrist[0] - dst.shoulder[0], dst.wrist[1] - dst.shoulder[1]) / Math.hypot(s1[0] - s0[0], s1[1] - s0[1]);
  const a = Math.atan2(dst.wrist[1] - dst.shoulder[1], dst.wrist[0] - dst.shoulder[0]) - Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  const [c, s] = [k * Math.cos(a), k * Math.sin(a)];
  // q = R·(m·p − s0) + dst.shoulder, as one matrix
  const r = [c * m[0] - s * m[1], s * m[0] + c * m[1], c * m[2] - s * m[3], s * m[2] + c * m[3]];
  const tx = c * (m[4] - s0[0]) - s * (m[5] - s0[1]) + dst.shoulder[0];
  const ty = s * (m[4] - s0[0]) + c * (m[5] - s0[1]) + dst.shoulder[1];
  const mat = [...r, tx, ty];
  const apply = (p) => pt(mat[0] * p[0] + mat[2] * p[1] + mat[4], mat[1] * p[0] + mat[3] * p[1] + mat[5]);
  return { matrix: `matrix(${mat.map((v) => Math.round(v * 1000) / 1000).join(" ")})`, apply, k };
}

const donor = views[BORROW.from].arms[BORROW.side];
for (const v of BORROW.into) {
  const view = views[v];
  for (const side of Object.keys(view.arms)) {
    const own = view.arms[side];
    const inward = Math.sign(view.anchorX - own.shoulder[0]) * BORROW.shoulderIn;
    const dst = { shoulder: [own.shoulder[0] + inward, own.shoulder[1]], wrist: own.wrist };
    const { matrix, apply, k } = fit(donor, dst, side === "l");
    const wrap = (markup) => `<g transform="${matrix}">${markup}</g>`;
    view.arms[side] = {
      upper: wrap(donor.upper),
      lower: wrap(donor.lower),
      upperFill: wrap(donor.upperFill),
      lowerFill: wrap(donor.lowerFill),
      elbow: apply(donor.elbow),
      wrist: apply(donor.wrist),
      patch: round(donor.patch * k),
      shoulder: apply(donor.shoulder),
    };
  }
  // Arms (and the hands drawn with them) go right under the torso.
  const torsoAt = view.order.indexOf("torso");
  const arms = view.order.filter((n, i) => n.startsWith("arm-") && i > torsoAt);
  const rest = view.order.filter((n) => !arms.includes(n));
  rest.splice(rest.indexOf("torso"), 0, ...arms);
  view.order = rest;
}

writeFileSync(outFile, JSON.stringify({ views, hands }));
for (const [k, v] of Object.entries(views)) {
  console.log(k, v.order.join(" "), JSON.stringify(Object.fromEntries(Object.entries(v.arms).map(([s, a]) => [s, { sh: a.shoulder, el: a.elbow, wr: a.wrist }]))));
}
console.log("hands", Object.entries(hands).map(([k, v]) => `${k}:${v.dir}:${v.wrist}`).join(" "));
