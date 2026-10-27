import { Composition } from "remotion";
import { GriffTalk } from "./GriffTalk";
import { MouthSheet } from "./MouthSheet";
import { RigTest } from "./RigTest";
import { FaceSheet } from "./FaceSheet";
import { GRIFF_TALK_RIG_FRAMES, GriffTalkRig } from "./GriffTalkRig";

const FPS = 30;
const DURATION = Math.ceil(36.48 * FPS);

export const Root: React.FC = () => (
  <>
    <Composition id="GriffTalk" component={GriffTalk} fps={FPS} durationInFrames={DURATION} width={1080} height={1920} />
    <Composition id="GriffTalkSquare" component={GriffTalk} fps={FPS} durationInFrames={DURATION} width={1080} height={1080} />
    <Composition id="MouthSheet" component={MouthSheet} fps={FPS} durationInFrames={1} width={1080} height={1080} />
    <Composition id="RigTest" component={RigTest} fps={FPS} durationInFrames={13 * FPS} width={1080} height={1920} />
    <Composition id="FaceSheet" component={FaceSheet} fps={FPS} durationInFrames={1} width={1760} height={1100} />
    <Composition id="GriffTalkRig" component={GriffTalkRig} fps={FPS} durationInFrames={GRIFF_TALK_RIG_FRAMES} width={1080} height={1920} />
  </>
);
