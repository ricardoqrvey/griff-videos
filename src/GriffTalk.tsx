import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Griff, GriffPose, GRIFF_H, GRIFF_W } from "./Griff";
import { BEATS, CHUNKS, envelope, isQuestion, OPENNESS, shapeAt, SHOTS } from "./performance";

export const GriffTalk: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const vertical = height > width;

  // --- Performance, all derived from the audio timing ---
  const open = [-2, -1, 0, 1, 2].reduce((s, d) => s + OPENNESS[shapeAt(t + d / fps)], 0) / 5;
  let browLeft = 0;
  let browRight = 0;
  let handAngle = Math.sin(t * 1.3) * 1.5;
  BEATS.forEach((b, i) => {
    const e = envelope(t, b.start - 0.05, 0.5);
    if (isQuestion(b)) {
      browLeft += 9 * e;
      browRight += 9 * e;
    } else if (i % 2 === 0) browRight += 10 * e;
    else browLeft -= 3 * e;
    if (i % 2 === 1) {
      const s = spring({ frame: frame - Math.round(b.start * fps), fps, config: { damping: 9, stiffness: 120 } });
      const release = interpolate(t, [b.start + 0.6, b.start + 1], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      handAngle += -10 * s * release;
    }
  });
  const glintCycle = (t + 2) % 6;
  const pose: GriffPose = {
    mouth: shapeAt(t),
    browLeft,
    browRight,
    handAngle,
    glint: glintCycle < 0.5 ? glintCycle / 0.5 : -1,
  };

  // --- Camera: cut between wide and close on each sentence, slow push within ---
  const shot = SHOTS.filter((s) => s <= t).length - 1;
  const shotStart = SHOTS[Math.max(0, shot)];
  const close = shot % 2 === 1;
  const push = 1 + (t - shotStart) * 0.012;
  const scale = vertical ? 1.1 : 0.94;
  const griffW = GRIFF_W * scale;
  const griffH = GRIFF_H * scale;
  const left = (width - griffW) / 2;
  const top = height - griffH + (vertical ? 140 : 0);
  const face = { x: left + 520 * scale, y: top + 470 * scale };
  const zoom = (close ? 1.45 : 1) * push;

  const bodyTransform = [
    `translateY(${-open * 6 + Math.sin(t * 2.1) * 2}px)`,
    `rotate(${Math.sin(t * 0.8) * 0.7}deg)`,
    `scaleY(${1 + Math.sin(t * 2.6) * 0.004})`,
  ].join(" ");

  const chunk = CHUNKS.find((c, i) => t >= c[0].start - 0.05 && t < (CHUNKS[i + 1]?.[0].start ?? Infinity) - 0.05);

  return (
    <AbsoluteFill style={{ background: "#101011", overflow: "hidden" }}>
      <Audio src={staticFile("audio/griff1.m4a")} />
      <AbsoluteFill style={{ transformOrigin: `${face.x}px ${face.y}px`, transform: `scale(${zoom})` }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${face.x}px ${face.y}px, #1d3a26 0%, #101011 55%)`,
          }}
        />
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: griffW,
            height: griffH,
            transformOrigin: "50% 100%",
            transform: bodyTransform,
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <Griff pose={pose} />
          </div>
        </div>
      </AbsoluteFill>

      {vertical && (
        <div
          style={{
            position: "absolute",
            top: 150,
            width: "100%",
            textAlign: "center",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 6,
            color: "#35E06A",
          }}
        >
          GRIFF'S TAKE
        </div>
      )}

      {chunk && (
        <div
          style={{
            position: "absolute",
            top: vertical ? (close ? 1600 : 560) : 820,
            width: "100%",
            padding: "0 60px",
            textAlign: "center",
            fontFamily: "Helvetica Neue, Arial Black, sans-serif",
            fontWeight: 900,
            fontSize: vertical ? 92 : 72,
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
