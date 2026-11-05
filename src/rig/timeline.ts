// Keyframe helpers: poses ease from one key to the next (soft springs, Griff is relaxed), turns step through
// the in-between views a few frames each.
import { spring } from "remotion";
import { ArmPose, Hand3dPose, turnPath, View } from "./Rig";

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
