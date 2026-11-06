import { getLength, getPointAtLength } from "@remotion/paths";
import fs from "fs";
const r = JSON.parse(fs.readFileSync("src/data/griff.rig.json", "utf8"));
const out = {};
for (const [vn, v] of Object.entries(r.views)) {
  const sides = Object.keys(v.arms || {});
  if (sides.length < 2 || !v.pieces.torso) continue;
  const pts = [];
  for (const p of v.pieces.torso.matchAll(/<path d="([^"]+)"/g)) { const d = p[1]; let L; try { L = getLength(d); } catch { continue; } for (let i = 0; i < 3000; i++) { let q; try { q = getPointAtLength(d, (L * i) / 3000); } catch { continue; } if (q) pts.push([q.x, q.y]); } }
  const cx = (v.arms[sides[0]].shoulder[0] + v.arms[sides[1]].shoulder[0]) / 2;
  out[vn] = {};
  for (const s of sides) {
    const right = v.arms[s].shoulder[0] > cx;
    const line = [];
    for (let y = 620; y <= 1100; y += 20) {
      const b = pts.filter((p) => Math.abs(p[1] - y) < 2 && (right ? p[0] > cx : p[0] < cx));
      if (b.length) line.push([right ? Math.max(...b.map((p) => p[0])) : Math.min(...b.map((p) => p[0])), y].map((n) => +n.toFixed(1)));
    }
    out[vn][s] = line;
  }
}
fs.writeFileSync("src/data/griff.vest.json", JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([s, l]) => [s, l.length + " pts, y800 x=" + (l.find((p) => p[1] === 800) || [])[0]]))])));
