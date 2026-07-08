/**
 * Tunable detection constants. Adjust these to trade off strictness vs. responsiveness
 * without touching detector logic.
 */

/** How long (ms) a valid salute pose must be held before it triggers. */
export const HOLD_TIME_MS = 350;

/** Once triggered, minimum time (ms) the gesture must stay invalid before it can re-arm. */
export const COOLDOWN_MS = 1000;

/** Minimum ratio of (tip distance from wrist) / (mcp distance from wrist) to count a finger as extended. */
export const FINGER_EXTENSION_RATIO = 1.55;

/** Target detection loop rate. The rAF loop throttles to roughly this FPS. */
export const TARGET_FPS = 28;

/** Model asset URLs (Google-hosted, loaded at runtime — no bundling required). */
export const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
export const POSE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
export const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

/** Trigger action placeholders — swap these for the real assets. */
export const SALUTE_IMAGE_URL =
  "https://i.pinimg.com/736x/89/4d/10/894d103a87e448ae017e2bcd34e78075.jpg";

/** Reward music, served from /public/audio, looped in the background while each reward is active. */
export const SALUTE_MUSIC_URL = "/audio/mbappe_anthem.mp3";
/** Seconds to skip at the start of the salute music, and on every loop replay. */
export const SALUTE_MUSIC_START_SECONDS = 1;

export const THUMBS_UP_MUSIC_URL = "/audio/du_bist_gut_genug.mp3";
/** Clip bounds, in seconds, looped for the thumbs-up music. */
export const THUMBS_UP_MUSIC_START_SECONDS = 18;
export const THUMBS_UP_MUSIC_END_SECONDS = 24;

/** Local video clip shown (muted) as the thumbs-up visual reward; already pre-trimmed. */
export const THUMBS_UP_VIDEO_URL = "/audio/thump_up_video.mov";
