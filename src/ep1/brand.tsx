import { continueRender, delayRender, staticFile } from "remotion";

// GOAT IQ brand tokens (from the platform video series' stage.css) and fonts.
export const C = {
  bg: "#101011",
  bgDeep: "#0b0b0c",
  surface: "#16161a",
  line: "#2a2a30",
  green: "#09c480",
  greenInk: "#0e1a10",
  purple: "#c6a2e5",
  cyan: "#49d1e2",
  yellow: "#f4c63e",
  cream: "#faf2db",
  muted: "#b4b4ba",
  ink: "#121214",
  frame: "#ece9df",
};
export const SANS = '"Archivo", sans-serif';
export const MONO = '"Space Mono", monospace';

const FONTS: [string, string, string][] = [
  ["Archivo", "fonts/Archivo.woff2", "100 900"],
  ["Space Mono", "fonts/SpaceMono-400.woff2", "400"],
  ["Space Mono", "fonts/SpaceMono-700.woff2", "700"],
];

let loaded = false;
/** Loads the brand fonts once, holding the render until they are ready. */
export const loadBrandFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("brand fonts");
  Promise.all(
    FONTS.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle), () => continueRender(handle));
};
