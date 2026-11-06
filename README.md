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

- `GriffPresent`: the reference video (rhythm, gestures, 3D wrist roll).
- `GriffMix`: the same audio with inward gestures mixed in.
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
the forearm and hand are drawn over the vest while the upper arm stays behind it. Pass
`across: acrossAt(frame, elbowAt)` from the timeline; it switches in one frame (fading shows a
see-through sleeve). At slight bends the forearm's inside edge is pared back to the vest's line at the
joint (`src/data/griff.vest.json`, measured by `scripts/vest-edges.mjs`) so it doesn't step out.

The elbow bends about one fixed joint, `ELBOW_PIVOT` below the forearm's own rounded end: the upper
arm shear-stretches so its rounded end sits on the joint and the forearm is trimmed to a round end of
the same radius there. Raised forearms close the upper arm in by up to `ARM_CLOSE`. Folds: outward,
short creases up to `LONG_FOLD_AT`, then one long fold from the inside corner, nearly parallel to the
forearm; inward, only the long fold, growing from `INWARD_FOLD_FROM` (over the vest it starts where
the forearm meets the vest's edge). Bent inward the hand shows its back (Turntable 150, reached as
-210 through the chest views), rolling in as the forearm starts in and back as it comes down.

Labs and sheets: `ArmInwardLab` / `ArmInwardSheet` (the inward flex by angle, arms crossed),
`ArmAcrossLab` / `ArmAcrossSheet` (earlier across-the-body tries). `GriffMix` is `GriffPresent`'s
audio with inward gestures mixed in (hand to chest, forearm across, hand held in, arms crossed).

## Layout

- `src/rig/Rig.tsx`: views, joints, elbow patch, hand swaps, turns.
- `src/rig/Face.tsx`: per-view mouth and brow placement.
- `src/rig/timeline.ts`: keyframes for arms and turns.
- `src/performance.ts`: word, mouth-cue and beat timing from the audio.
