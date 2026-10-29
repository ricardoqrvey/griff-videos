// Geometry helpers for measuring art exported from Illustrator.
import { svgPathProperties } from "svg-path-properties";

// --- geometry ---------------------------------------------------------------

export function pointsOf(el) {
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

export const SHAPES = "path, polygon, polyline, rect, circle, ellipse";
export const pts = (node) => node.querySelectorAll(SHAPES).flatMap(pointsOf);

export function bbox(points) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

export const meanX = (points) => points.reduce((s, p) => s + p[0], 0) / points.length;

// Centre of the far end of a limb, measured along its axis: the points within
// `depth` of the end, split across the axis, and the middle of their extent.
// (Taking the lowest points instead picks one corner of a slanted cuff.)
export function endCentre(points, from, toward, depth = 12, inset = 16) {
  const len0 = Math.hypot(toward[0] - from[0], toward[1] - from[1]);
  const u = [(toward[0] - from[0]) / len0, (toward[1] - from[1]) / len0];
  const n = [-u[1], u[0]];
  const along = (p) => (p[0] - from[0]) * u[0] + (p[1] - from[1]) * u[1];
  const across = (p) => (p[0] - from[0]) * n[0] + (p[1] - from[1]) * n[1];
  const far = Math.max(...points.map(along));
  const edge = points.filter((p) => along(p) > far - depth).map(across);
  const mid = (Math.max(...edge) + Math.min(...edge)) / 2;
  const d = far - inset;
  return [from[0] + u[0] * d + n[0] * mid, from[1] + u[1] * d + n[1] * mid];
}
export const round = (v) => Math.round(v * 10) / 10;
export const pt = (x, y) => [round(x), round(y)];

// --- markup -------------------------------------------------------------------

// Strip ids (they'd collide between views) and keep presentation attributes.
export const markup = (node) => node.innerHTML.replace(/\s+id="[^"]*"/g, "").replace(/\s+data-name="[^"]*"/g, "").replace(/\n\s*/g, "");
