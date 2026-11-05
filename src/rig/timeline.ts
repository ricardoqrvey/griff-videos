// Keyframe helpers: poses ease from one key to the next (soft springs, Griff is relaxed), turns step through
// the in-between views a few frames each.
import { spring } from "remotion";
import { ACROSS_AT, ArmPose, Hand3dPose, turnPath, View } from "./Rig";

export type ArmKey = { at: number; pose: ArmPose };
export type TurnKey = { at: number; to: View; dir?: "cw" | "ccw" };

const REST: ArmPose = { shoulder: 0, elbow: 0, wrist: 0 };
const HOLD = 3; // frames on each in-between view
const SWAP_HAND_AFTER = 3; // frames into a move before the hand shape changes

export function armAt(frame: number, fps: number, keys: ArmKey[]): ArmPose {
  let prev = REST;
  let out: ArmPose = REST;
  let hand: string | undefined;
  let mirrorHand: boolean | undefined;
  for (const k of keys) {
    if (frame < k.at) break;
    const t = spring({ frame: frame - k.at, fps, config: { damping: 22, stiffness: 70, mass: 1 } });
    const mix = (a = 0, b = 0) => a + (b - a) * t;
    out = {
      shoulder: mix(prev.shoulder, k.pose.shoulder),
      elbow: mix(prev.elbow, k.pose.elbow),
      wrist: mix(prev.wrist, k.pose.wrist),
    };
    if (frame >= k.at + SWAP_HAND_AFTER) {
      hand = k.pose.hand;
      mirrorHand = k.pose.mirrorHand;
    }
    prev = { ...REST, ...k.pose };
  }
  return { ...out, hand, mirrorHand };
}

export function viewAt(frame: number, start: View, turns: TurnKey[]): View {
  let view = start;
  for (const t of turns) {
    if (frame < t.at) break;
    const path = turnPath(view, t.to, t.dir);
    const k = Math.min(path.length - 1, 1 + Math.floor((frame - t.at) / HOLD));
    view = path[k];
  }
  return view;
}

/** Wrist roll between hand shapes: for the first `frames` of a move, the
 *  Turntable hand and forearm stand in for the flat ones, rolling from one
 *  turn to another (15° views, eased). `roll` gives the turns for a change of
 *  hand (from, to), or null to cut straight to the new hand. */
export function rollAt(
  frame: number,
  keys: ArmKey[],
  roll: (from: string | undefined, to: string | undefined) => [number, number] | null,
  frames = 9,
): Hand3dPose | undefined {
  let prev: string | undefined;
  let out: Hand3dPose | undefined;
  for (const k of keys) {
    if (frame < k.at) break;
    const turns = k.pose.hand !== prev ? roll(prev, k.pose.hand) : null;
    out = undefined;
    if (turns && frame < k.at + frames) {
      const x = (frame - k.at) / (frames - 1);
      const e = x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
      out = { turn: Math.round((turns[0] + (turns[1] - turns[0]) * e) / 15) * 15 };
    }
    prev = k.pose.hand;
  }
  return out;
}

/** Keys for a held Turntable hand: `to` is the view from `at` on (undefined
 *  gives the rig's own forearm and hand back). Between two views of the same
 *  set, tilt and fit the turn sweeps over `frames` (15° views, eased); a turn
 *  past ±180 picks the direction and wraps. */
export type Hand3dKey = { at: number; to?: Hand3dPose; frames?: number };

const same = (a: Hand3dPose, b: Hand3dPose) => (a.set ?? "hang") === (b.set ?? "hang") && (a.tilt ?? 0) === (b.tilt ?? 0) && a.fit === b.fit;
const wrapTurn = (t: number) => ((((t + 180) % 360) + 360) % 360) - 180;

export function hand3dAt(frame: number, keys: Hand3dKey[]): Hand3dPose | undefined {
  let prev: Hand3dPose | undefined;
  let out: Hand3dPose | undefined;
  for (const k of keys) {
    if (frame < k.at) break;
    out = k.to;
    if (k.to && prev && same(prev, k.to)) {
      const n = k.frames ?? 9;
      const x = Math.min(1, (frame - k.at) / Math.max(1, n - 1));
      const e = x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
      const turn = prev.turn + (k.to.turn - prev.turn) * e;
      out = { ...k.to, turn: wrapTurn(Math.round(turn / 15) * 15) };
    } else if (k.to) {
      out = { ...k.to, turn: wrapTurn(k.to.turn) };
    }
    prev = k.to ? { ...k.to, turn: wrapTurn(k.to.turn) } : undefined;
  }
  return out;
}

/** How far in front of the torso a forearm is (ArmPose.across): the share of
 *  the last `frames` frames its elbow was swung in past ACROSS_AT. The default
 *  (1) switches cleanly; more frames fade it, which shows a see-through sleeve. */
export function acrossAt(frame: number, elbowAt: (frame: number) => number, frames = 1): number {
  let n = 0;
  for (let k = 0; k < frames; k++) if (elbowAt(Math.max(0, frame - k)) < -ACROSS_AT) n++;
  return n / frames;
}
