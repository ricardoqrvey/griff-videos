// Packs the episode's scene SVGs (public/ep1/*.svg) into src/data/ep1.svgs.json:
// { name: { w, h, inner } } so scenes can inline them as layers.
import fs from "fs";
import path from "path";
const dir = process.argv[2] ?? "public/ep1", out = process.argv[3] ?? "src/data/ep1.svgs.json";
// Illustrator exports style by class (.cls-N in a <style> block): inline those
// rules on each element, so the markup can sit in a page next to other exports.
const inlineClasses = (s) => {
  const css = s.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!css) return s;
  const rules = {};
  for (const [, sel, body] of css[1].matchAll(/([^{}]+)\{([^}]*)\}/g))
    for (const c of sel.split(",").map((x) => x.trim().replace(/^\./, "")))
      rules[c] = (rules[c] ?? "") + body.trim().replace(/\s+/g, " ");
  return s
    .replace(/<defs>\s*<style[^>]*>[\s\S]*?<\/style>\s*<\/defs>|<style[^>]*>[\s\S]*?<\/style>/, "")
    .replace(/<metadata>[\s\S]*?<\/metadata>/, "")
    .replace(/class="([^"]+)"/g, (_, cs) => `style="${cs.split(/\s+/).map((c) => rules[c] ?? "").join(" ")}"`);
};
const res = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  let s = inlineClasses(fs.readFileSync(path.join(dir, f), "utf8"));
  // No width/height on the root (Illustrator): take them from the viewBox.
  if (!/<svg[^>]*\swidth=/.test(s)) {
    const [, , , vw, vh] = s.match(/viewBox="([\d.-]+) ([\d.-]+) ([\d.]+) ([\d.]+)"/);
    s = s.replace(/<svg\b/, `<svg width="${vw}" height="${vh}"`);
  }
  const m = s.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"[^>]*>([\s\S]*)<\/svg>/);
  const vb = s.match(/viewBox="([\d.\s-]+)"/);
  if (!m) continue;
  const [, w, h, inner] = m;
  res[path.basename(f, ".svg")] = { w: +w, h: +h, viewBox: vb ? vb[1] : `0 0 ${w} ${h}`, inner: inner.trim().replace(/xlink:href=/g, "href=") };
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(Object.entries(res).map(([k, v]) => `${k} ${v.w}x${v.h} ${v.inner.length}`).join("\n"));
