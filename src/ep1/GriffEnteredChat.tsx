import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadBrandFonts } from "./brand";
import { Chat } from "./Chat";
import { BackShot, DeskShot } from "./Desk";
import { EndFrame } from "./EndFrame";
import { FPS, T, VOICE, f } from "./timing";

// Griff Knows Something You Don't — Ep. 1 "Griff Has Entered the Chat".
// 9:16: the dev chat, Griff from behind at his desk, the profile shot where he
// swivels to the camera and talks, the swivel back, the GOAT IQ end frame.
loadBrandFonts();

export const GriffEnteredChat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#101011" }}>
      {t < T.chatEnd ? <Chat /> : t < T.backEnd ? <BackShot /> : t < T.endFrom ? <DeskShot /> : <EndFrame />}

      {VOICE.map((v, i) => (
        <Sequence key={i} from={f(v.at)} durationInFrames={f(v.to - v.from)} layout="none">
          <Audio src={staticFile("audio/ep1/voice.mp3")} trimBefore={f(v.from)} trimAfter={f(v.to)} />
        </Sequence>
      ))}
      {/* Keys: the dev typing, Griff at the keyboard from behind and again at the end. */}
      <Sequence from={f(T.typeFrom)} durationInFrames={f(T.send - T.typeFrom)} layout="none">
        <Audio src={staticFile("audio/ep1/keyboard.mp3")} volume={0.55} />
      </Sequence>
      <Sequence from={f(T.chatEnd)} durationInFrames={f(T.turnIn - T.chatEnd)} layout="none">
        <Audio src={staticFile("audio/ep1/keyboard.mp3")} trimBefore={f(1.2)} volume={0.45} />
      </Sequence>
      <Sequence from={f(T.backAtDesk)} durationInFrames={f(T.endFrom - T.backAtDesk)} layout="none">
        <Audio src={staticFile("audio/ep1/keyboard.mp3")} trimBefore={f(2.4)} volume={0.45} />
      </Sequence>
      <Sequence from={f(T.notify)} durationInFrames={f(1)} layout="none">
        <Audio src={staticFile("audio/ep1/notification.mp3")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
