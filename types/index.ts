/** Shared type definitions for landmark data, gesture detection, and app state. */

/** A single normalized landmark point as returned by MediaPipe Tasks Vision. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** One detected hand: its 21 landmarks plus which side it is. */
export interface HandResult {
  landmarks: Landmark[];
  handedness: "Left" | "Right";
  score: number;
}

/** Everything the detector needs from a single video frame. */
export interface FrameLandmarks {
  hands: HandResult[];
  pose: Landmark[] | null;
  timestampMs: number;
}

/** Result of checking a single named condition (e.g. "Fingers straight"). */
export interface ConditionResult {
  label: string;
  passed: boolean;
  /** Human-readable current value, e.g. "12.3°" or "0.08". Shown in debug mode. */
  value: string;
}

/** Result of running a gesture check against one frame. */
export interface GestureCheckResult {
  gesture: GestureName;
  /** True only if every required condition passed this frame. */
  matched: boolean;
  conditions: ConditionResult[];
}

/** High-level state machine for a gesture that requires hold time + cooldown. */
export type GestureLifecycleState =
  | "idle" // waiting for the pose to start forming
  | "holding" // pose is valid, waiting out HOLD_TIME_MS
  | "triggered" // hold time satisfied, action fired
  | "cooldown"; // pose must fully clear before re-arming

/** Names of gestures the detector registry can recognize. Extend as new gestures are added. */
export type GestureName = "salute" | "peace" | "thumbsUp" | "wave";

/** Interface every gesture detector implements, so new gestures plug into the same pipeline. */
export interface GestureDetector {
  readonly name: GestureName;
  check(frame: FrameLandmarks): GestureCheckResult;
}

/** Public state exposed by useSaluteDetection to the UI. */
export interface SaluteDetectionState {
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "error";
  modelStatus: "loading" | "ready" | "error";
  lifecycle: GestureLifecycleState;
  statusText: string;
  fps: number;
  holdProgress: number; // 0..1 for the current hold, used for optional progress UI
  lastCheck: GestureCheckResult | null;
  triggerCount: number;
}
