// Mouth and brows drawn on top of each view's head, in that view's own
// coordinates (they turn and tilt with the head). Placement was measured on
// the Illustrator export; back views get nothing.
import { Mouth, MouthShape } from "../Mouth";

type Pt = [number, number];
/** Brow shape on top of its height: `arch` bows the middle up (+) or flattens
 *  it (−); `inner` lifts the end near the nose (+ worried or ironic, − stern). */
export type BrowShape = { arch?: number; inner?: number };
export type FacePose = {
  mouth: MouthShape;
  brows: { l: number; r: number }; // px up (negative = frown), screen sides
  browShape?: { l?: BrowShape; r?: BrowShape };
};

type Brow = { outer: Pt; ctrl: Pt; inner: Pt; pivot: Pt };
type FaceGeo = {
  brows: { l?: Brow; r?: Brow };
  mouth?: { origin: Pt; scale: Pt; skew: number; noseX?: number; noseY: number; open: number } | { profile: { front: Pt; corner: Pt } };
};

const INK = "#111";
const STROKE = 5;

const FACES: Record<string, FaceGeo> = {
  "000": {
    brows: {
      l: { outer: [362, 264], ctrl: [395, 250], inner: [428, 258], pivot: [395, 256] },
      r: { outer: [554, 264], ctrl: [521, 250], inner: [488, 258], pivot: [521, 256] },
    },
    mouth: { origin: [458, 494], scale: [0.72, 0.72], skew: -6, noseY: -43, open: 1.6 },
  },
  "045": {
    brows: {
      l: { outer: [430, 262], ctrl: [470, 250], inner: [512, 256], pivot: [471, 255] },
      r: { outer: [608, 256], ctrl: [592, 252], inner: [575, 258], pivot: [592, 255] },
    },
    mouth: { origin: [590, 494], scale: [0.74, 0.8], skew: -10, noseX: 15, noseY: -42, open: 1.6 },
  },
  "090": {
    brows: { r: { outer: [548, 258], ctrl: [570, 248], inner: [592, 254], pivot: [570, 252] } },
    mouth: { profile: { front: [703, 463], corner: [657, 478] } },
  },
};

// How far the jaw opens in profile, per mouth shape.
const PROFILE_OPEN: Record<MouthShape, number> = { X: 0, A: 0, B: 11, C: 24, D: 36, E: 24, F: 15, G: 11, H: 24 };

const ProfileMouth: React.FC<{ shape: MouthShape; front: Pt; corner: Pt }> = ({ shape, front, corner }) => {
  const open = PROFILE_OPEN[shape];
  if (!open) {
    return <path d={`M${front[0] - 2},${front[1] + 1} Q${(front[0] + corner[0]) / 2},${front[1] + 8} ${corner}`} />;
  }
  const lower: Pt = [front[0] - 3, front[1] + open];
  return (
    <path
      d={`M${front[0] + 1},${front[1] - 1} L${corner} L${lower} Q${front[0] + 2},${lower[1] - open / 2} ${front[0] + 1},${front[1] - 1} Z`}
      fill="#4a1a1f"
    />
  );
};

export const Face: React.FC<{ view: string; mirror: boolean; pose: FacePose; id: string }> = ({ view, mirror, pose, id }) => {
  const geo = FACES[view];
  if (!geo) return null;
  // In a mirrored view the source's right brow shows on the screen's left.
  const lift = { l: mirror ? pose.brows.r : pose.brows.l, r: mirror ? pose.brows.l : pose.brows.r };
  const shapes = pose.browShape ?? {};
  const shape = { l: (mirror ? shapes.r : shapes.l) ?? {}, r: (mirror ? shapes.l : shapes.r) ?? {} };
  const m = geo.mouth;

  return (
    <g fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      {(["l", "r"] as const).map((side) => {
        const b = geo.brows[side];
        if (!b) return null;
        const up = lift[side];
        const { arch = 0, inner = 0 } = shape[side];
        const d = `M${b.outer} Q${b.ctrl[0]},${b.ctrl[1] - arch * 3} ${b.inner[0]},${b.inner[1] - inner * 1.6}`;
        // Raised brows tilt outward a touch; frowns tilt in.
        const tilt = (side === "l" ? -1 : 1) * up * 0.3;
        return <path key={side} d={d} transform={`translate(0 ${-up}) rotate(${tilt} ${b.pivot[0]} ${b.pivot[1]})`} />;
      })}
      {m && "profile" in m ? (
        <ProfileMouth shape={pose.mouth} {...m.profile} />
      ) : m ? (
        <Mouth shape={pose.mouth} {...m} id={`${id}-mouth`} />
      ) : null}
    </g>
  );
};
