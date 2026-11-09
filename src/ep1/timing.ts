// Timeline for "Griff Has Entered the Chat" (seconds of the final cut).
// The voice take is split in three: the chat line, the two lines after the
// swivel, and the closing line after a pause; each plays at its own offset.
import cues from "../data/ep1.mouth.json";
import words from "../data/ep1.words.json";
import { MouthShape } from "../Mouth";

export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);

/** Voice clips: [from, to] in the take, played starting at `at` in the cut. */
export const VOICE = [
  { from: 0, to: 2.2, at: 1.95 }, // "Someone say quick dashboard?"
  { from: 2.2, to: 7.75, at: 5.75 }, // "I heard that…" + "Hey, I'm Griff. I might know a shortcut."
  { from: 7.75, to: 9.95, at: 11.57 }, // (pause) "Come see what we're building with GOAT."
];
/** Time in the take for a time in the cut (undefined in the gaps). */
export const takeTime = (t: number) => {
  for (const v of VOICE) if (t >= v.at && t < v.at + (v.to - v.from)) return v.from + (t - v.at);
  return undefined;
};
/** Time in the cut for a time in the take. */
export const cutTime = (take: number) => {
  const v = VOICE.find((v) => take >= v.from && take < v.to) ?? VOICE[VOICE.length - 1];
  return v.at + (take - v.from);
};

type Word = { text: string; start: number; end: number };
export const WORDS = words as Word[];
const CUES = cues.mouthCues as { start: number; end: number; value: MouthShape }[];
export const mouthAt = (t: number): MouthShape => {
  const k = takeTime(t);
  return k === undefined ? "X" : CUES.find((c) => k >= c.start && k < c.end)?.value ?? "X";
};
/** When a word (nth occurrence, punctuation ignored) starts, in the cut. */
export const w = (word: string, nth = 0) =>
  cutTime(WORDS.filter((x) => x.text.toLowerCase().replace(/[^a-z0-9']/g, "") === word)[nth].start);

// Shots.
export const T = {
  chatEnd: 4.25,
  typeFrom: 0.3,
  send: 1.1,
  notify: 1.55,
  backEnd: 4.8, // the back view, facing the monitor
  turnIn: 5.45, // profile → front
  landed: 5.8,
  closeIn: [5.9, 6.6] as const,
  closeOut: [13.45, 13.8] as const,
  turnOut: 13.82, // front → profile
  backAtDesk: 14.2,
  endFrom: 14.95,
  end: 17.2,
};
export const EP1_FRAMES = f(T.end);
