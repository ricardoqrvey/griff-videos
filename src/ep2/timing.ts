// Timeline for Ep. 2 "We're Building Something" (seconds of the final cut).
// The take is split in five clips, each placed in the cut.
import cues from "../data/ep2.mouth.json";
import words from "../data/ep2.words.json";
import { MouthShape } from "../Mouth";

export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);

/** Voice clips: [from, to] in the take, played from `at` in the cut. */
export const VOICE = [
  { from: 0, to: 1.65, at: 5.1 }, // "Oh, you're early."
  { from: 1.75, to: 5.55, at: 7.0 }, // "That customer-facing dashboard your team keeps pushing to next quarter?"
  { from: 5.6, to: 11.05, at: 15.9 }, // "We're making dashboards a whole lot faster… Right on Google Cloud."
  { from: 11.1, to: 12.95, at: 21.65 }, // "Yeah, we've been busy."
  { from: 13.15, to: 14.84, at: 24.3 }, // "Come see what we're building with GOAT."
];
export const takeTime = (t: number) => {
  for (const v of VOICE) if (t >= v.at && t < v.at + (v.to - v.from)) return v.from + (t - v.at);
  return undefined;
};
export const cutTime = (take: number) => {
  const v = VOICE.find((v) => take >= v.from && take < v.to) ?? VOICE[VOICE.length - 1];
  return v.at + (take - v.from);
};

type Word = { text: string; start: number; end: number };
const WORDS = words as Word[];
const CUES = cues.mouthCues as { start: number; end: number; value: MouthShape }[];
export const mouthAt = (t: number): MouthShape => {
  const k = takeTime(t);
  return k === undefined ? "X" : CUES.find((c) => k >= c.start && k < c.end)?.value ?? "X";
};
/** When a word (nth occurrence, punctuation ignored) starts, in the cut. */
export const w = (word: string, nth = 0) =>
  cutTime(WORDS.filter((x) => x.text.toLowerCase().replace(/[^a-z0-9']/g, "") === word)[nth].start);

export const T = {
  // 1. Video: the camera comes up on Griff at his laptop; he looks up.
  talk: 4.9, // 2. Rig Griff: "Oh, you're early." / "That customer-facing dashboard…" (points to the tickets)
  backlog: 8.95, // 3. Video, whole: the backlog, overdue, and slow ("…your team keeps pushing to next quarter?")
  dashboard: 14.9, // 4. Rig Griff, shakes his head; "We're making dashboards…": the glimpse, the lean, back to him;
  // "Yeah, we've been busy." … "Come see what we're building with GOAT."
  dashGone: 19.55, // the dashboard drops away; back to Griff, centred
  textFrom: 24.05, // on-screen line
  textTo: 26.35,
  endFrom: 26.5, // 5. Blur, end card.
  end: 30.5,
};
export const EP2_FRAMES = f(T.end);
