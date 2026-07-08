# Salute Detector

A browser-only webcam app that detects a military salute gesture and, when confirmed,
shows a fullscreen reward image and plays a YouTube song. Everything — camera capture,
hand/pose tracking, and gesture logic — runs client-side. No backend, no data leaves
the browser.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **TailwindCSS 4** for styling
- **MediaPipe Tasks Vision** (`HandLandmarker` + `PoseLandmarker`) for hand and body
  tracking — chosen over TensorFlow.js's older hand-pose models for its combined
  hand+pose accuracy and GPU-accelerated WASM runtime
- **Framer Motion** for the reward overlay's fade/zoom animation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Start camera**, and grant
webcam permission. (Camera and YouTube autoplay both need this initial click to work
reliably — browsers gate both behind a real user gesture.)

## How detection works

The pipeline runs a `requestAnimationFrame` loop throttled to `TARGET_FPS` (see
[`lib/config.ts`](lib/config.ts)). On every processed frame it runs MediaPipe's
`HandLandmarker` (up to 2 hands) and `PoseLandmarker` (1 pose), then hands the raw
landmarks to `SaluteDetector.check()` in [`lib/detector.ts`](lib/detector.ts), which
evaluates five conditions simultaneously:

1. **Single hand** — exactly one hand in frame (two raised hands is never a salute).
2. **Palm outward/sideways** — the palm's normal vector (cross product of two vectors
   spanning the palm) isn't pointed flat at the camera lens.
3. **Fingers extended** — index/middle/ring/pinky tips are proportionally far from the
   wrist relative to their knuckles (thumb is ignored). This ratio is scale-invariant,
   so it works regardless of hand size or distance from the camera.
4. **Near forehead** — distance from the hand to a forehead point estimated from pose
   eye landmarks (scaled by interocular distance) is below `FOREHEAD_DISTANCE`.
5. **Hand roughly horizontal** — the wrist→middle-knuckle vector is within
   `ANGLE_THRESHOLD` degrees of horizontal.

A frame only "matches" if all five pass. The hook in
[`hooks/useSaluteDetection.ts`](hooks/useSaluteDetection.ts) runs a small state machine
on top of that per-frame result:

```
idle --(matched)--> holding --(held HOLD_TIME_MS)--> triggered
 ^                     |                                 |
 |               (invalid before hold)             (becomes invalid)
 |                     v                                 v
 +------------------- idle                          cooldown --(invalid for COOLDOWN_MS)--> idle
```

This guarantees the gesture must be held for `HOLD_TIME_MS` before it fires, fires
**exactly once** per salute, and only re-arms after the hand has been lowered
(gesture invalid) continuously for `COOLDOWN_MS`.

### Tuning

All thresholds live in [`lib/config.ts`](lib/config.ts):

| Constant | Meaning |
|---|---|
| `HOLD_TIME_MS` | How long the pose must be held before triggering (700–1000ms recommended) |
| `FOREHEAD_DISTANCE` | Max normalized distance between hand and forehead |
| `ANGLE_THRESHOLD` | Allowed tilt (degrees) from horizontal |
| `COOLDOWN_MS` | Required invalid-gesture time before re-arming |
| `FINGER_EXTENSION_RATIO` | Tip/knuckle distance ratio to count a finger as straight |
| `TARGET_FPS` | Detection loop throttle |

### Extending with new gestures

`GestureDetector` (in [`types/index.ts`](types/index.ts)) is a small interface —
`{ name, check(frame) }`. `SaluteDetector` is one implementation registered in
`createGestureDetectors()` ([`lib/detector.ts`](lib/detector.ts)). To add Peace,
ThumbsUp, or Wave, implement the same interface and add it to that registry; the
detection loop, hold-time/cooldown state machine, and debug panel don't need to change.

## Debug mode

Enabled by default via the toggle under the camera feed. While on:

- Hand skeleton + joints are drawn in green, wrist highlighted in red.
- Pose eye/shoulder points are drawn in blue, with a yellow circle marking the
  estimated forehead target used for the "near forehead" check.
- A panel below shows live FPS, lifecycle state, trigger count, and a pass/fail row
  (with current value) for every detection condition.

## Trigger assets

Swap these placeholders in [`lib/config.ts`](lib/config.ts):

```ts
export const SALUTE_IMAGE_URL = "https://i.pinimg.com/...";   // replace with your image
export const SALUTE_YOUTUBE_URL = "https://youtu.be/...";     // replace with your song
```

The YouTube URL can be any `youtu.be/`, `youtube.com/watch?v=`, or `/embed/` link —
[`YoutubePlayer`](components/YoutubePlayer.tsx) extracts the video ID and loops that
single video via the official YouTube IFrame API. If the browser blocks autoplay, a
"▶ Play music" button appears over the player.

## Project structure

```
app/
  page.tsx          # top-level state: start gate, reward overlay + player
  layout.tsx
  globals.css
components/
  Camera.tsx        # mirrored webcam feed + landmark overlay canvas
  SaluteDetector.tsx # wires the hook to Camera/StatusBar/DebugPanel
  StatusBar.tsx      # "Camera: 🟢 Ready" / "Gesture: ..." readout
  DebugPanel.tsx     # FPS + per-condition pass/fail table
  Overlay.tsx         # fullscreen reward image (Framer Motion fade + zoom)
  YoutubePlayer.tsx  # autoplay/loop YouTube embed with manual fallback
hooks/
  useSaluteDetection.ts # camera + model setup, detection loop, state machine
lib/
  detector.ts        # GestureDetector interface + SaluteDetector implementation
  geometry.ts         # vector math: distance, angle, finger extension, palm normal
  config.ts           # tunable constants + model/asset URLs
types/
  index.ts            # shared landmark/gesture/state types
```

## Known limitations

- Detection accuracy depends on lighting and camera angle, like any single-camera
  pose/hand pipeline — the palm-orientation and forehead-distance heuristics are
  intentionally simple (dot/cross products, no ML classifier) so they stay easy to
  tune and debug.
- Camera permission and YouTube autoplay both require a real user click first — this
  is why the app has a "Start camera" gate rather than requesting permission on load.
