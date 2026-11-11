import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadBrandFonts } from "./brand";
import { Chat } from "./Chat";
import { BackShot, ProfileShot } from "./Desk";
import { EndFrame } from "./EndFrame";
import { FPS, GRIFF_SEND, T, VOICE, f, w } from "./timing";

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
      <Shots />
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
      {/* Keys only when Griff types: from behind, his line in the chat, back at the laptop. */}
      {[
        [0, T.chatFrom, 0, 0.45],
        [w("someone") - 0.05, GRIFF_SEND - 0.1, 1.6, 0.7],
        [T.chatEnd, T.headIn, 2.4, 0.4],
        [T.headOut + 0.2, T.end, 0.2, 0.4],
      ].map(([from, to, at, volume], i) => (
        <Sequence key={`k${i}`} from={f(from)} durationInFrames={f(to - from)} layout="none">
          <Audio src={staticFile("audio/ep1/keyboard.mp3")} trimBefore={f(at)} volume={(fr) => volume * interpolate(fr, [0, 4, f(to - from) - 6, f(to - from)], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} loop />
        </Sequence>
      ))}
      {/* Music from just after "shortcut": under the closing line, up for the end card. */}
      <Sequence from={f(MUSIC_FROM)} layout="none">
        <Audio
          src={staticFile("audio/ep1/music.mp3")}
          volume={(fr) => {
            const t = MUSIC_FROM + fr / FPS;
            const k = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
            const under = interpolate(t, [w("come") - 0.15, w("come") + 0.1], [0.22, 0.13], k); // in at full level, no fade
            const up = interpolate(t, [T.headOut - 0.2, T.endFrom + 0.3], [0, 0.17], k);
            const out = interpolate(t, [T.end - 0.9, T.end], [1, 0], k);
            return (under + up) * out;
          }}
        />
      </Sequence>
      {/* A ping with every message that lands in the chat. */}
      {[T.jess, T.send, T.notify, GRIFF_SEND].map((at, i) => (
        <Sequence key={`n${i}`} from={f(at)} durationInFrames={f(1)} layout="none">
          <Audio src={staticFile("audio/ep1/notification.mp3")} volume={at === T.notify ? 0.85 : 0.6} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Shots: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <AbsoluteFill>{t < T.chatFrom ? <BackShot /> : t < T.chatEnd ? <Chat /> : <ProfileShot />}</AbsoluteFill>;
};

/** The last shot, blurred and dimmed under the end card. */
/** The music comes in as "shortcut" ends (7.6 s into the take, where the voice goes silent). */
const MUSIC_FROM = VOICE[2].at + (7.6 - VOICE[2].from);

const ProfileBlur: React.FC<{ t: number }> = ({ t }) => {
  const k = interpolate(t, [T.endFrom, T.endFrom + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.76, 0, 0.24, 1) });
  return (
    <AbsoluteFill style={{ backdropFilter: `blur(${k * 18}px)`, background: `rgba(10,10,12,${k * 0.62})` }} />
  );
};
