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
  { from: 0, to: 2.2, at: 6.9 }, // "Someone say quick dashboard?" (typed in the chat)
  { from: 2.2, to: 5.0, at: 11.15 }, // "I heard that from three sprints away." (3/4, seated)
  { from: 5.0, to: 7.8, at: 14.66 }, // "Hey… I'm Griff. I might know a shortcut." (close-up; calmer re-take of "Hey… I'm Griff")
  { from: 7.8, to: 9.98, at: 18.0 }, // "Come see what we're building with GOAT."
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
  chatFrom: 2.0,
  // 2. The chat: Jess's ask, Mike's "quick dashboard", Griff enters.
  jess: 2.35,
  typeFrom: 3.6, // Mike is typing…
  send: 4.4,
  notify: 5.7,
  chatEnd: 10.4,
  // 3. Profile at the desk: he turns his head to the camera (3/4) and talks.
  headIn: 11.0,
  // 4. Push in to his face, head to the front, brows at work.
  zoomIn: [13.9, 14.5] as const,
  // 5. Back out to 3/4 on "Come see…", then back to the keys.
  zoomOut: [18.15, 18.9] as const,
  headOut: 20.1,
  // 6. Blur over the typing, logo and closing line on top.
  endFrom: 20.6,
  end: 24.6,
};
export const EP1_FRAMES = f(T.end);
/** Griff hits send on "Someone say quick dashboard?" just after saying it. */
export const GRIFF_SEND = w("dashboard") + 0.55;
