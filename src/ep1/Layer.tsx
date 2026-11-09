import svgs from "../data/ep1.svgs.json";

type Svg = { w: number; h: number; viewBox: string; inner: string };
export const SVG = svgs as Record<string, Svg>;

/** One of the episode's SVGs placed at (x, y) in scene units. */
export const Layer: React.FC<{ name: string; x?: number; y?: number; scale?: number; flip?: boolean; opacity?: number; transform?: string }> = ({
  name,
  x = 0,
  y = 0,
  scale = 1,
  flip,
  opacity,
  transform = "",
}) => {
  const s = SVG[name];
  const t = `translate(${x} ${y}) ${transform} scale(${flip ? -scale : scale} ${scale})${flip ? ` translate(${-s.w} 0)` : ""}`;
  // The exports set fill="none" on the root svg; keep it, shapes inherit it.
  return <g transform={t} opacity={opacity} fill="none" dangerouslySetInnerHTML={{ __html: s.inner }} />;
};
