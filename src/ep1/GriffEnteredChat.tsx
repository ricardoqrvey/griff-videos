import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadBrandFonts } from "./brand";
import { Chat } from "./Chat";
import { BackShot, ProfileShot } from "./Desk";
import { EndFrame } from "./EndFrame";
import { FPS, T, VOICE, f, w } from "./timing";

// Griff Knows Something You Don't — Ep. 1 "Griff Has Entered the Chat".
// 9:16: Griff from behind, typing; the dev chat, one message at a time; Griff
// in profile at his laptop, who turns his head to talk, the push in to his
// face and back out; the end card over the blurred shot as he types again.
loadBrandFonts();

export const GriffEnteredChat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#101011" }}>
      {t < T.chatFrom ? <BackShot /> : t < T.chatEnd ? <Chat /> : <ProfileShot />}
      {t >= T.endFrom && (
        <>
          <ProfileBlur t={t} />
          <EndFrame />
        </>
      )}

      {VOICE.map((v, i) => (
        <Sequence key={i} from={f(v.at)} durationInFrames={f(v.to - v.from)} layout="none">
          <Audio src={staticFile("audio/ep1/voice.mp3")} trimBefore={f(v.from)} trimAfter={f(v.to)} />
        </Sequence>
      ))}
      {/* Keys: Griff from behind, the dev's message, Griff's line in the chat, Griff back at the laptop. */}
      {[
        [0, T.chatFrom, 0, 0.45],
        [T.typeFrom, T.send, 0.6, 0.5],
        [w("someone") - 0.05, w("dashboard") + 0.45, 1.6, 0.35],
        [T.chatEnd, T.headIn, 2.4, 0.4],
        [T.headOut + 0.2, T.end, 0.2, 0.4],
      ].map(([from, to, at, volume], i) => (
        <Sequence key={`k${i}`} from={f(from)} durationInFrames={f(to - from)} layout="none">
          <Audio src={staticFile("audio/ep1/keyboard.mp3")} trimBefore={f(at)} volume={(fr) => volume * interpolate(fr, [0, 4, f(to - from) - 6, f(to - from)], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} loop />
        </Sequence>
      ))}
      <Sequence from={f(T.notify)} durationInFrames={f(1)} layout="none">
        <Audio src={staticFile("audio/ep1/notification.mp3")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** The last shot, blurred and dimmed under the end card. */
const ProfileBlur: React.FC<{ t: number }> = ({ t }) => {
  const k = interpolate(t, [T.endFrom, T.endFrom + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.76, 0, 0.24, 1) });
  return (
    <AbsoluteFill style={{ backdropFilter: `blur(${k * 18}px)`, background: `rgba(10,10,12,${k * 0.62})` }} />
  );
};
