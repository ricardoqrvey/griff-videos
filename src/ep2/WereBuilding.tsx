import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, loadBrandFonts, SANS } from "../ep1/brand";
import { EndFrame } from "../ep1/EndFrame";
import { BLUR, PUSH, camEase, enterK, exitK } from "../ep1/transitions";
import { ArmPose, Rig, RigPose, STAGE_H, STAGE_W } from "../rig/Rig";
import { ArmKey, armAt, rollAt } from "../rig/timeline";
import palette from "../data/griff.palette.ep2.json";
import { Dashboard } from "./Dashboard";
import { FPS, T, VOICE, f, mouthAt, w } from "./timing";

// Griff Knows Something You Don't — Ep. 2 "We're Building Something".
// Two painted video shots (the approach, the backlog) and, whenever Griff
// talks, the rig: front view, waist up, sat in front of the empty chair of the
// office still (2000×1117), seen through a camera.
loadBrandFonts();

const IW = 2000, IH = 1117;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Cam = { cx: number; cy: number; s: number };
const mix = (a: Cam, b: Cam, k: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, s: a.s + (b.s - a.s) * k });
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: camEase });

/** The still's coordinates, framed by the camera; children are placed in image pixels. */
const Stage: React.FC<{ cam: Cam; blur: number; children: React.ReactNode }> = ({ cam, blur, children }) => {
  const { width: W, height: H } = useVideoConfig();
  const S = Math.max(W / IW, H / IH) * cam.s;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: IW, height: IH, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${S}) translate(${-cam.cx}px, ${-cam.cy}px)` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
const Office: React.FC = () => <Img src={staticFile("ep2/office_close.png")} style={{ position: "absolute", left: 0, top: 0, width: IW, height: IH }} />;

/** A painted video shot, filling the frame, with the zoom-through in and out. */
const Clip: React.FC<{ src: string; t: number; from: number; to: number; skip?: number; sound?: boolean }> = ({ src, t, from, to, skip = 0, sound }) => {
  const e = from > 0 ? enterK(t, from) : 0, x = exitK(t, to);
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: e + x > 0.02 ? `blur(${(e + x) * BLUR}px)` : undefined }}>
      <Sequence from={f(from)} layout="none">
        <OffthreadVideo src={staticFile(`ep2/${src}.mp4`)} muted={!sound} trimBefore={Math.round(skip * 24)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + (e + x) * PUSH})` }} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the rig
// Placed by its neck, in image pixels; RIG_S stage units → image pixels.
const RIG_S = 1.12; // his shoulders about the chair back's width
const NECK = [503, 547.5]; // the front view's neck on the stage
const REST: ArmPose = { shoulder: 0, elbow: 0 };
const PALM = "turn-03";
// The index finger up, palm to the camera: pointing at the sloth.
const POINT = "index-up_000";
const pose = (shoulder: number, elbow: number, hand?: string, mirrorHand?: boolean): ArmPose => ({ shoulder, elbow, hand, mirrorHand });
const low = (shoulder: number, elbow: number) => pose(shoulder, elbow, PALM);
const key = (sec: number, p: ArmPose): ArmKey => ({ at: f(sec), pose: p });

// Chest-up framings: gestures come up to chest height to be seen.
// Screen-left arm: "you're early"; presents the dashboard; the shrug.
const LEFT: ArmKey[] = [
  key(T.talk, REST),
  key(w("you're") - 0.1, low(12, 108)),
  key(w("customerfacing") - 0.1, pose(2, 3)),
  key(T.backlog, REST),
  key(w("dashboards") - 0.1, low(14, 112)),
  key(w("build"), low(10, 104)),
  key(w("saas") - 0.3, pose(3, 4)),
  key(w("yeah"), low(8, 96)), // the shrug: "we've been busy"
  key(w("busy") + 0.4, pose(2, 3)),
];
// Screen-right arm: points to the tickets; the build-and-embed beat; the invitation.
const RIGHT: ArmKey[] = [
  key(T.talk, REST),
  key(w("customerfacing") - 0.15, pose(24, 100, POINT)), // points at the sloth, palm to us
  key(T.backlog, REST),
  key(w("faster") - 0.1, low(12, 110)),
  key(w("embed") - 0.05, low(14, 114)),
  key(w("right") - 0.1, low(8, 96)),
  key(w("cloud") + 0.4, pose(2, 3)),
  key(w("yeah"), low(7, 94)),
  key(w("busy") + 0.4, pose(2, 2)),
  key(w("come") - 0.1, pose(13, 122, "peace")), // come see: peace
];
const SIDE_ON = -105, PALM_ON = -15;
const roll = (from?: string, to?: string): [number, number] | null => {
  if (from === POINT || to === POINT || from === "peace" || to === "peace") return null;
  if (!from && to) return [SIDE_ON, PALM_ON];
  if (from && !to) return [PALM_ON, SIDE_ON];
  return null;
};
const arm = (keys: ArmKey[], frame: number, t: number, phase: number): ArmPose => {
  const p = armAt(frame, FPS, keys);
  const hand3d = rollAt(frame, keys, roll);
  const idle = { ...p, shoulder: p.shoulder + Math.sin(t * 0.7 + phase) * 1.2, elbow: p.elbow + Math.sin(t * 1.1 + phase) * 1.5 };
  return hand3d ? { ...idle, hand3d } : idle;
};

// Brows (l/r height, la/ra arch, li/ri inner end), head (tilt°, nod px), shoulders (lift px, lean°).
type Face = { l: number; r: number; la?: number; li?: number; ra?: number; ri?: number; tilt?: number; nod?: number; lift?: number; lean?: number };
const FACE: [number, Face][] = [
  [0, { l: 0, r: 0 }],
  [T.talk + 0.1, { l: -2, r: 14, ra: 6, tilt: -3 }], // one brow up: caught, amused
  [w("early"), { l: 2, r: 12, ra: 5, tilt: -2, nod: -2 }],
  [w("customerfacing"), { l: 6, r: 6, la: 3, ra: 3, tilt: 2 }],
  [w("quarter"), { l: -3, r: 10, li: -2, ra: 4, tilt: -3 }],
  [T.dashboard + 0.05, { l: -4, r: -4, li: -5, ri: -5, nod: 2, lift: -1 }], // he knows that one all too well
  [w("we're") - 0.1, { l: 6, r: 6, la: 3, ra: 3, nod: -2, lift: 2 }],
  [w("faster"), { l: 10, r: 10, la: 5, ra: 5, tilt: 2, lift: 3 }],
  [w("saas"), { l: 2, r: 9, ra: 4, tilt: -3 }],
  [w("cloud"), { l: 4, r: 12, ra: 5, tilt: -2 }],
  [w("yeah"), { l: 5, r: 5, la: 3, ra: 3, li: 3, ri: 3, tilt: 3, nod: -2, lift: 6 }], // satisfied, a little shrug
  [w("busy") + 0.3, { l: -1, r: 12, ra: 5, tilt: -2 }], // the smirk holds through the pause
  [w("come") - 0.1, { l: 9, r: 9, la: 5, ra: 5, nod: -3, lift: 2 }],
  [w("goat"), { l: 6, r: 14, ra: 6, tilt: -2, nod: -2 }],
];
const KEYS = ["l", "r", "la", "li", "ra", "ri", "tilt", "nod", "lift", "lean"] as const;
const faceAt = (t: number): Required<Face> => {
  let i = 0;
  while (i + 1 < FACE.length && FACE[i + 1][0] <= t) i++;
  const [at, cur] = FACE[i];
  const prev = FACE[Math.max(0, i - 1)][1];
  const k = interpolate(t, [at, at + 0.3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return Object.fromEntries(KEYS.map((n) => [n, (prev[n] ?? 0) + ((cur[n] ?? 0) - (prev[n] ?? 0)) * k])) as Required<Face>;
};

/** Griff from the rig, his neck at (x, y) in image pixels, shifted by `dx` (the lean). */
const Griff: React.FC<{ x: number; y: number; t: number; frame: number; dx?: number }> = ({ x, y, t, frame, dx = 0 }) => {
  const face = faceAt(t);
  const p: RigPose = {
    view: "000",
    arms: { l: arm(LEFT, frame, t, 0), r: arm(RIGHT, frame, t, 2) },
    head: { tilt: face.tilt + Math.sin(t * 0.8) * 0.6, nod: face.nod + Math.sin(t * 2.1) * 0.8 },
    face: {
      mouth: mouthAt(t),
      brows: { l: face.l, r: face.r },
      browShape: { l: { arch: face.la, inner: face.li }, r: { arch: face.ra, inner: face.ri } },
    },
    body: { lift: face.lift + Math.sin(t * 1.6) * 1, lean: face.lean },
  };
  return (
    <div style={{ position: "absolute", left: x + dx - NECK[0] * RIG_S, top: y - NECK[1] * RIG_S, width: STAGE_W * RIG_S, height: STAGE_H * RIG_S }}>
      {/* Recoloured to match the painted video shots. */}
      <Rig pose={p} id="ep2" palette={palette as Record<string, string>} />
    </div>
  );
};

// 2. "Oh, you're early." Caught; he points to the tickets on his desk.
const TalkShot: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const e = enterK(t, T.talk), x = exitK(t, T.backlog);
  const cam = mix({ cx: 1130, cy: 560, s: 1.15 }, { cx: 1125, cy: 545, s: 1.22 }, ramp(t, T.talk, T.backlog));
  return (
    <Stage cam={{ ...cam, s: cam.s * (1 + (e + x) * PUSH) }} blur={(e + x) * BLUR}>
      <Office />
      <Griff x={1130} y={750} t={t} frame={frame} />
    </Stage>
  );
};

// 4. The dashboard builds beside him; the camera peeks at it over his shoulder;
// it drops away and the camera comes back to him, centred,
// then in to his face for "Yeah, we've been busy" and the invitation.
const DashShot: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const WIDE: Cam = { cx: 1000, cy: 558, s: 1.0 };
  const PEEK: Cam = { cx: 700, cy: 430, s: 1.45 };
  const CENTER: Cam = { cx: 1130, cy: 560, s: 1.18 };
  const FACE_CAM: Cam = { cx: 1010, cy: 520, s: 1.32 }; // a little left of him: room for the line
  const gone = T.dashGone;
  const peek = ramp(t, w("dashboards") - 0.2, w("faster"));
  const center = ramp(t, gone, gone + 0.75);
  const face = ramp(t, w("come") - 0.4, w("come") + 0.5);
  const drop = interpolate(t, [gone, gone + 0.4], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const e = enterK(t, T.dashboard);
  const cam = mix(mix(mix(WIDE, PEEK, peek), CENTER, center), FACE_CAM, face);
  return (
    <Stage cam={{ ...cam, s: cam.s * (1 + e * PUSH) }} blur={e * BLUR}>
      <Office />
      {drop < 1 && (
        <div style={{ position: "absolute", left: 40, top: 160, width: 1237, height: 792, transformOrigin: "0 0", transform: `translateY(${drop * 1000}px) scale(${0.62 * (1 - drop * 0.12)})` }}>
          <Dashboard from={T.dashboard + 0.2} />
        </div>
      )}
      <Griff x={1130} y={750} t={t} frame={frame} />
    </Stage>
  );
};

/** The closing line, over the last shot. */
const Line: React.FC<{ t: number }> = ({ t }) => {
  const k = (a: number) => interpolate(t, [T.textFrom + a, T.textFrom + a + 0.55], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const gone = interpolate(t, [T.textTo - 0.4, T.textTo], [1, 0], clamp);
  const row = (a: number) => ({ display: "block", transform: `translateY(${(1 - k(a)) * 110}%)` });
  return (
    <AbsoluteFill style={{ opacity: gone, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(10,10,12,${0.82 * k(0)}) 0%, rgba(10,10,12,${0.6 * k(0)}) 40%, rgba(10,10,12,0) 60%)` }} />
      <div style={{ position: "absolute", left: 110, top: "50%", transform: "translateY(-50%)", font: `800 64px/1.02 ${SANS}`, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.cream }}>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={row(0)}>Embedded</span>
        </span>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={row(0.12)}>dashboards.</span>
        </span>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6, marginTop: 18 }}>
          <span style={{ ...row(0.45), color: C.green }}>Without the</span>
        </span>
        <span style={{ display: "block", overflow: "hidden", paddingBottom: 6 }}>
          <span style={{ ...row(0.57), color: C.green }}>analytics project.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const WereBuilding: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const blurK = interpolate(t, [T.endFrom, T.endFrom + 0.6], [0, 1], { ...clamp, easing: Easing.bezier(0.76, 0, 0.24, 1) });
  const musicFrom = VOICE[3].at + (VOICE[3].to - VOICE[3].from) + 0.1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {t < T.talk ? (
        <Clip src="scene1" t={t} from={0} to={T.talk} />
      ) : t < T.backlog ? (
        <TalkShot t={t} frame={frame} />
      ) : t < T.dashboard ? (
        <Clip src="scene3" t={t} from={T.backlog} to={T.dashboard} sound />
      ) : (
        <DashShot t={t} frame={frame} />
      )}
      {t >= T.textFrom && t < T.textTo && <Line t={t} />}
      {t >= T.endFrom && (
        <>
          <AbsoluteFill style={{ backdropFilter: `blur(${blurK * 18}px)`, background: `rgba(10,10,12,${blurK * 0.66})` }} />
          <EndFrame from={T.endFrom} scale={0.86} />
        </>
      )}

      {VOICE.map((v, i) => (
        <Sequence key={i} from={f(v.at)} durationInFrames={f(v.to - v.from)} layout="none">
          <Audio src={staticFile("audio/ep2/voice.mp3")} trimBefore={f(v.from)} trimAfter={f(v.to)} />
        </Sequence>
      ))}
      {/* Keys while he works, until he looks up. */}
      <Sequence from={0} durationInFrames={f(4.2)} layout="none">
        <Audio src={staticFile("audio/ep1/keyboard.mp3")} volume={(fr) => 0.45 * interpolate(fr, [0, 4, f(4.2) - 10, f(4.2)], [0, 1, 1, 0], clamp)} />
      </Sequence>
      {/* Music after "busy": under the last line, up for the end card. */}
      <Sequence from={f(musicFrom)} layout="none">
        <Audio
          src={staticFile("audio/ep1/music.mp3")}
          volume={(fr) => {
            const tt = musicFrom + fr / FPS;
            const under = interpolate(tt, [VOICE[4].at - 0.15, VOICE[4].at + 0.1], [0.22, 0.13], clamp);
            const up = interpolate(tt, [T.endFrom - 0.3, T.endFrom + 0.4], [0, 0.17], clamp);
            return (under + up) * interpolate(tt, [T.end - 0.9, T.end], [1, 0], clamp);
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
