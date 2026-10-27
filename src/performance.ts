// Timing derived from the audio: words (whisper), mouth cues (Rhubarb), and
// the beats where Griff gestures and the edit cuts.
import { interpolate } from "remotion";
import { MouthShape } from "./Mouth";
import cues from "./data/griff1.mouth.json";
import words from "./data/griff1.words.json";

export type Word = { text: string; start: number; end: number };
export const WORDS = words as Word[];
export const CUES = cues.mouthCues as { start: number; end: number; value: MouthShape }[];

export const OPENNESS: Record<MouthShape, number> = { A: 0, B: 0.3, C: 0.6, D: 1, E: 0.6, F: 0.4, G: 0.3, H: 0.6, X: 0 };

export const shapeAt = (t: number): MouthShape => CUES.find((c) => t >= c.start && t < c.end)?.value ?? "X";

// A beat is the first word of each sentence or clause: that's where Griff
// raises a brow, gestures and where the edit cuts between wide and close.
export const endsClause = (w: Word) => /[.?!,]$/.test(w.text);
export const endsSentence = (w: Word) => /[.?!]$/.test(w.text);
export const BEATS = WORDS.filter((w, i) => i === 0 || endsClause(WORDS[i - 1]));
export const SHOTS = WORDS.filter((w, i) => i === 0 || endsSentence(WORDS[i - 1])).map((w) => w.start);
export const isQuestion = (beat: Word) => {
  const i = WORDS.indexOf(beat);
  return WORDS.slice(i).find(endsSentence)?.text.endsWith("?") ?? false;
};

// Captions: up to 3 words, never across a clause break.
export const CHUNKS: Word[][] = [];
for (const w of WORDS) {
  const last = CHUNKS[CHUNKS.length - 1];
  if (!last || last.length >= 3 || endsClause(last[last.length - 1])) CHUNKS.push([w]);
  else last.push(w);
}

export const envelope = (t: number, start: number, hold: number) =>
  interpolate(t, [start, start + 0.12, start + hold, start + hold + 0.3], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
