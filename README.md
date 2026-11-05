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

## Hand playground

`playground/hand3d.html` turns the Turntable views on the "3d HAND" and "3D Antebrazo" artboards into an interactive hand and forearm
(drag to turn and tilt, animate the turn, forearm guiding or following the hand). After re-exporting the
artboard to `assets/characters/griff/hand3d/hand3d_sheet.svg`:

```bash
node scripts/hand3d.mjs assets/characters/griff/hand3d/hand3d_sheet.svg assets/characters/griff/hand3d/forearm3d_sheet.svg \
  src/data/griff.rig.json playground/hand3d.data.js src/data/griff.hand3d.json
python3 -m http.server 5178 --directory playground
```

The last file feeds the rig: an arm pose with `hand3d: { turn }` draws the Turntable hand and forearm
instead of the flat ones. `GriffPresent` (the reference video) rolls the wrist in 3D between the resting
hand and the open palm or a raised gesture (`GriffPresentFlat` just swaps hands); `Hand3dSheet` lays the rolls out next to the rig's hands. `Hand3dLab` tries
longer moves: rolls held in a gesture, palm to back, a raised hand that wobbles, and the lying forearm
(`fit: "free"`, drawn over the torso with `front`) swinging round toward the camera.

Arms in front/back views can swing the forearm in across the body (negative elbow): past `ACROSS_AT`
the forearm, elbow and hand are drawn over the vest while the upper arm stays behind it. Pass
`across: acrossAt(frame, elbowAt)` from the timeline so the switch fades over three frames.
`ArmAcrossLab` tries hand on chest, a forearm resting across the belly, palm-up crossing, chest to open
gesture, and one arm across while the other is raised; `ArmAcrossSheet` lays poses out side by side.

## Layout

- `src/rig/Rig.tsx`: views, joints, elbow patch, hand swaps, turns.
- `src/rig/Face.tsx`: per-view mouth and brow placement.
- `src/rig/timeline.ts`: keyframes for arms and turns.
- `src/performance.ts`: word, mouth-cue and beat timing from the audio.
