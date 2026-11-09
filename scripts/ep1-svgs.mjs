// Packs the episode's scene SVGs (public/ep1/*.svg) into src/data/ep1.svgs.json:
// { name: { w, h, inner } } so scenes can inline them as layers.
import fs from "fs";
import path from "path";
const dir = process.argv[2] ?? "public/ep1", out = process.argv[3] ?? "src/data/ep1.svgs.json";
const res = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const s = fs.readFileSync(path.join(dir, f), "utf8");
  const m = s.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"[^>]*>([\s\S]*)<\/svg>/);
  const vb = s.match(/viewBox="([\d.\s-]+)"/);
  if (!m) continue;
  const [, w, h, inner] = m;
  res[path.basename(f, ".svg")] = { w: +w, h: +h, viewBox: vb ? vb[1] : `0 0 ${w} ${h}`, inner: inner.trim().replace(/xlink:href=/g, "href=") };
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(Object.entries(res).map(([k, v]) => `${k} ${v.w}x${v.h} ${v.inner.length}`).join("\n"));
