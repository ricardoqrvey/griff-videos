# griff-videos

Animated Griff shorts built in [Remotion](https://www.remotion.dev) from a cut-out rig, so new dialogue costs
text-to-speech only, not video-generation credits.

Characters are drawn in Illustrator (one artboard per view, pieces as named layers) and exported as SVG.
[ASSETS.md](ASSETS.md) is the guide for preparing them.

## Setup

```bash
npm install
```

Lipsync uses [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync). Unzip the macOS release into
`tools/` (git-ignored).

## Workflow

1. Export the character from Illustrator to `assets/characters/griff/` (Export for Screens, SVG, Object IDs: Layer Names).
2. Rebuild the rig data:
   ```bash
   node scripts/rig_from_svg.mjs assets/characters/griff src/data/griff.rig.json
   ```
3. For new audio: transcribe for word timings (whisper.cpp), then run Rhubarb with the transcript for mouth cues
   into `src/data/`.
4. Preview and render:
   ```bash
   npm run studio
   npx remotion render GriffTalkRig out/griff_talk_rig.mp4
   ```

## Compositions

- `GriffTalkRig`: Griff speaking Griff_1's audio with the Illustrator rig (lipsync, brows, gestures, turns).
- `RigTest`: gestures, hand swaps and a full 360° turn.
- `FaceSheet`: every mouth shape and brow on every view, for tuning.
- `GriffTalk`, `GriffTalkSquare`, `MouthSheet`: the first proof of concept, from a single flat still.

## Layout

- `src/rig/Rig.tsx`: views, joints, elbow patch, hand swaps, turns.
- `src/rig/Face.tsx`: per-view mouth and brow placement.
- `src/rig/timeline.ts`: keyframes for arms and turns.
- `src/performance.ts`: word, mouth-cue and beat timing from the audio.
