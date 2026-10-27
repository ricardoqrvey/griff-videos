import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BEATS, CHUNKS, envelope, isQuestion, OPENNESS, shapeAt, SHOTS, WORDS } from "./performance";
import { Rig, STAGE_H, STAGE_W } from "./rig/Rig";
import { ArmKey, armAt, TurnKey, viewAt } from "./rig/timeline";

// Griff_1's audio performed by the Illustrator rig: lipsync and brows come
// from the audio; turns and gestures are cued on words.
const FPS = 30;

/** Frame where the nth occurrence of a word starts (case and punctuation ignored). */
const on = (word: string, nth = 0, offset = 0) => {
  const hits = WORDS.filter((w) => w.text.toLowerCase().replace(/[^a-z-]/g, "") === word);
  return Math.round((hits[nth].start + offset) * FPS);
};

const TURNS: TurnKey[] = [
  { at: on("adorable", 0, -0.1), to: "045" },
  { at: on("build"), to: "000" },
  { at: on("months"), to: "315" },
  { at: on("drop"), to: "270" },
  { at: on("plug"), to: "000" },
  { at: on("done", 0, -0.1), to: "045" },
  { at: on("live"), to: "000" },
  { at: on("excuses"), to: "090" },
  { at: on("ai-powered", 0, -0.2), to: "000", dir: "ccw" },
];

const LEFT: ArmKey[] = [
  { at: on("build"), pose: { shoulder: 28, elbow: 150, wrist: -10, hand: "index-up" } },
  { at: on("sure"), pose: { shoulder: 0, elbow: 0 } },
  { at: on("months"), pose: { shoulder: 22, elbow: 70, hand: "turn-07" } },
  { at: on("drop", 0, -0.3), pose: { shoulder: 0, elbow: 0 } },
  { at: on("done"), pose: { shoulder: 24, elbow: 152, wrist: -8, hand: "ok" } },
  { at: on("live"), pose: { shoulder: 0, elbow: 0 } },
];

const RIGHT: ArmKey[] = [
  { at: on("months"), pose: { shoulder: 22, elbow: 70, hand: "turn-07" } },
  { at: on("drop", 0, -0.3), pose: { shoulder: 0, elbow: 0 } },
  { at: on("live"), pose: { shoulder: 35, elbow: 125, hand: "peace" } },
  { at: on("minus"), pose: { shoulder: 0, elbow: 0 } },
  { at: on("ai-powered"), pose: { shoulder: 30, elbow: 140, hand: "rock" } },
];

const NEAR: ArmKey[] = [
  { at: on("drop"), pose: { shoulder: 70, elbow: 15, hand: "index-up" } },
  { at: on("plug", 0, -0.2), pose: { shoulder: 0, elbow: 0 } },
  { at: on("excuses"), pose: { shoulder: 55, elbow: 95, hand: "fist" } },
  { at: on("ai-powered", 0, -0.3), pose: { shoulder: 0, elbow: 0 } },
];

export const GRIFF_TALK_RIG_FRAMES = Math.ceil(36.48 * FPS);

export const GriffTalkRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Brows ride the sentence beats; the head bobs with how open the mouth is.
  const open = [-2, -1, 0, 1, 2].reduce((s, d) => s + OPENNESS[shapeAt(t + d / fps)], 0) / 5;
  let browL = 0;
  let browR = 0;
  BEATS.forEach((b, i) => {
    const e = envelope(t, b.start - 0.05, 0.5);
    if (isQuestion(b)) {
      browL += 9 * e;
      browR += 9 * e;
    } else if (i % 2 === 0) browR += 10 * e;
    else {
      browL -= 3 * e;
      browR -= 3 * e;
    }
  });

  const pose = {
    view: viewAt(frame, "000", TURNS),
    headView: viewAt(frame + 1, "000", TURNS),
    arms: { l: armAt(frame, fps, LEFT), r: armAt(frame, fps, RIGHT), near: armAt(frame, fps, NEAR) },
    head: { nod: -open * 5 + Math.sin(t * 2.1) * 1.5, tilt: Math.sin(t * 0.8) * 1.2 },
    face: { mouth: shapeAt(t), brows: { l: browL, r: browR } },
  };

  // Camera: cut between wide and close on each sentence, slow push within.
  const rigH = height * 0.82;
  const rigW = (rigH * STAGE_W) / STAGE_H;
  const rigLeft = (width - rigW) / 2;
  const rigTop = height - rigH + 40;
  const k = rigW / STAGE_W;
  const face = { x: rigLeft + 500 * k, y: rigTop + 420 * k };
  const shot = SHOTS.filter((s) => s <= t).length - 1;
  const close = shot % 2 === 1;
  const zoom = (close ? 1.55 : 1) * (1 + (t - SHOTS[Math.max(0, shot)]) * 0.012);
  // Close shots bring the face down so the horns stay in frame.
  const drop = close ? 900 - face.y : 0;

  const chunk = CHUNKS.find((c, i) => t >= c[0].start - 0.05 && t < (CHUNKS[i + 1]?.[0].start ?? Infinity) - 0.05);

  return (
    <AbsoluteFill style={{ background: "#101011", overflow: "hidden" }}>
      <Audio src={staticFile("audio/griff1.m4a")} />
      <AbsoluteFill style={{ transformOrigin: `${face.x}px ${face.y}px`, transform: `translate(0px, ${drop}px) scale(${zoom})` }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${face.x}px ${face.y}px, #1d3a26 0%, #101011 55%)` }} />
        <div
          style={{
            position: "absolute",
            left: rigLeft,
            top: rigTop,
            width: rigW,
            height: rigH,
            transformOrigin: "50% 100%",
            transform: `rotate(${Math.sin(t * 0.8) * 0.5}deg) scaleY(${1 + Math.sin(t * 2.6) * 0.004})`,
          }}
        >
          <Rig pose={pose} />
        </div>
      </AbsoluteFill>
      <div
        style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", font: "800 40px Helvetica Neue, Arial", letterSpacing: 6, color: "#35E06A" }}
      >
        GRIFF'S TAKE
      </div>
      {chunk && (
        <div
          style={{
            position: "absolute",
            top: close ? 1560 : 230,
            width: "100%",
            padding: "0 60px",
            textAlign: "center",
            fontFamily: "Helvetica Neue, Arial Black, sans-serif",
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 1.05,
            textTransform: "uppercase",
            WebkitTextStroke: "14px #000",
            paintOrder: "stroke fill",
          }}
        >
          {chunk.map((w) => (
            <span key={w.start} style={{ color: t >= w.start && t < w.end + 0.05 ? "#35E06A" : "#F3EFE4" }}>
              {w.text.replace(/[,.]$/, "")}{" "}
            </span>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
