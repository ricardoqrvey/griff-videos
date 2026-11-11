import { Easing, interpolate } from "remotion";

// Zoom-through cuts between shots: the outgoing shot speeds up into a push
// and blurs; the cut lands on the next shot already pushed in and blurred,
// which settles back. No dissolve: one shot is always fully opaque.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const OUT = 0.3; // s of push before the cut
export const IN = 0.45; // s of settle after it
export const PUSH = 0.6; // extra scale at the cut, on both sides
export const BLUR = 12; // px of blur at the cut

/** 0 → 1 over the OUT seconds before `at`, accelerating. */
export const exitK = (t: number, at: number) => interpolate(t, [at - OUT, at], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
/** 1 → 0 over the IN seconds after `at`, decelerating. */
export const enterK = (t: number, at: number) => interpolate(t, [at, at + IN], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

/** A softer in-out than the brand's expo curve, for camera moves. */
export const camEase = Easing.bezier(0.65, 0, 0.35, 1);
