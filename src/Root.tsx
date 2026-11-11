import { Composition } from "remotion";
import { GriffTalk } from "./GriffTalk";
import { MouthSheet } from "./MouthSheet";
import { RigTest } from "./RigTest";
import { FaceSheet } from "./FaceSheet";
import { GRIFF_TALK_RIG_FRAMES, GriffTalkRig } from "./GriffTalkRig";
import { GRIFF_PRESENT_FRAMES, GriffPresent } from "./GriffPresent";
import { HAND_SHEET_SIZE, HandSheet } from "./HandSheet";
import { HAND3D_SHEET_SIZE, Hand3dSheet } from "./Hand3dSheet";
import { HAND3D_LAB_FRAMES, Hand3dLab } from "./Hand3dLab";
import { ARM_ACROSS_SHEET_SIZE, ArmAcrossSheet } from "./ArmAcrossSheet";
import { ARM_ACROSS_LAB_FRAMES, ArmAcrossLab } from "./ArmAcrossLab";
import { ARM_INWARD_LAB_FRAMES, ArmInwardLab } from "./ArmInwardLab";
import { GRIFF_MIX_FRAMES, GriffMix } from "./GriffMix";
import { GriffEnteredChat } from "./ep1/GriffEnteredChat";
import { TweenCheck } from "./ep1/TweenCheck";
import { EP1_FRAMES } from "./ep1/timing";
import { ARM_INWARD_SHEET_SIZE, ArmInwardSheet } from "./ArmInwardSheet";

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
    <Composition id="GriffPresent" component={GriffPresent} fps={FPS} durationInFrames={GRIFF_PRESENT_FRAMES} width={1080} height={1080} />
    {/* The same without the Turntable wrist roll: hands just swap. */}
    <Composition id="GriffPresentFlat" component={GriffPresent} defaultProps={{ wristRoll: false }} fps={FPS} durationInFrames={GRIFF_PRESENT_FRAMES} width={1080} height={1080} />
    <Composition id="HandSheet" component={HandSheet} fps={FPS} durationInFrames={1} {...HAND_SHEET_SIZE} />
    <Composition id="Hand3dLab" component={Hand3dLab} fps={FPS} durationInFrames={HAND3D_LAB_FRAMES} width={1080} height={1080} />
    <Composition id="Hand3dSheet" component={Hand3dSheet} fps={FPS} durationInFrames={1} {...HAND3D_SHEET_SIZE} />
    <Composition id="ArmAcrossLab" component={ArmAcrossLab} fps={FPS} durationInFrames={ARM_ACROSS_LAB_FRAMES} width={1080} height={1080} />
    <Composition id="ArmAcrossSheet" component={ArmAcrossSheet} fps={FPS} durationInFrames={1} {...ARM_ACROSS_SHEET_SIZE} />
    <Composition id="ArmInwardLab" component={ArmInwardLab} fps={FPS} durationInFrames={ARM_INWARD_LAB_FRAMES} width={1080} height={1080} />
    <Composition id="GriffEnteredChat" component={GriffEnteredChat} fps={FPS} durationInFrames={EP1_FRAMES} width={1080} height={1920} />
    <Composition id="TweenCheck" component={TweenCheck} fps={FPS} durationInFrames={1} width={2000} height={882} />
    <Composition id="GriffEnteredChat169" component={GriffEnteredChat} fps={FPS} durationInFrames={EP1_FRAMES} width={1920} height={1080} />
    <Composition id="GriffMix" component={GriffMix} fps={FPS} durationInFrames={GRIFF_MIX_FRAMES} width={1080} height={1080} />
    <Composition id="ArmInwardSheet" component={ArmInwardSheet} fps={FPS} durationInFrames={1} {...ARM_INWARD_SHEET_SIZE} />
  </>
);
