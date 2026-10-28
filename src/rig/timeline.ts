// Keyframe helpers: poses ease from one key to the next (soft springs, Griff is relaxed), turns step through
// the in-between views a few frames each.
import { spring } from "remotion";
import { ArmPose, turnPath, View } from "./Rig";

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
