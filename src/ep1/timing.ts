// Timeline for "Griff Has Entered the Chat" (seconds of the final cut).
// The voice take is split in four clips, each played at its own place in the
// cut, so the chat can breathe and the close-up can hold a pause.
import cues from "../data/ep1.mouth.json";
import words from "../data/ep1.words.json";
import { MouthShape } from "../Mouth";

export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);

/** Voice clips: [from, to] in the take, played starting at `at` in the cut. */
export const VOICE = [
  { from: 0, to: 2.2, at: 10.3 }, // "Someone say quick dashboard?" (typed in the chat)
  { from: 2.2, to: 4.95, at: 14.15 }, // "I heard that from three sprints away." (3/4, seated)
  { from: 4.95, to: 7.75, at: 17.5 }, // "Hey, I'm Griff. I might know a shortcut." (close-up)
  { from: 7.75, to: 9.95, at: 21.0 }, // "Come see what we're building with GOAT."
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

export const T = {
  // 1. From behind, typing.
  chatFrom: 2.6,
  // 2. The chat, one message at a time.
  jess: 3.1,
  mike: 4.9,
  typeFrom: 6.3,
  send: 7.5,
  notify: 9.0,
  griff: 10.2, // Griff's bubble; he types the line as he says it
  chatEnd: 13.4,
  // 3. Profile at the desk: he turns his head to the camera (3/4) and talks.
  headIn: 14.0,
  // 4. Push in to his face, head to the front, brows at work.
  zoomIn: [16.9, 17.5] as const,
  // 5. Back out to 3/4 on "Come see…", then back to the keys.
  zoomOut: [21.15, 21.9] as const,
  headOut: 23.1,
  // 6. Blur over the typing, logo and closing line on top.
  endFrom: 23.6,
  end: 27.6,
};
export const EP1_FRAMES = f(T.end);
