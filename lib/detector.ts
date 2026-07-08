import type { ConditionResult, FrameLandmarks, GestureCheckResult, GestureDetector, GestureName } from "@/types";
import { HAND, isFingerExtended, palmCameraFacingScore } from "@/lib/geometry";

/** Palm-facing-camera scores at or below this pass the "outward/sideways" check. */
const PALM_FACING_MAX = 0.82;

/**
 * Detects a military-style salute: one hand, fingers straight, palm turned outward.
 * Every condition must pass simultaneously for a frame to "match" — the calling hook
 * is responsible for hold-time and cooldown.
 */
export class SaluteDetector implements GestureDetector {
  readonly name = "salute" as const;

  check(frame: FrameLandmarks): GestureCheckResult {
    const conditions: ConditionResult[] = [];

    // Condition 1: exactly one hand in frame (two raised hands is never a salute).
    const oneHand = frame.hands.length === 1;
    conditions.push({
      label: "Single hand",
      passed: oneHand,
      value: `${frame.hands.length} hand(s)`,
    });

    if (!oneHand) {
      // Still report the remaining conditions as failed/unknown so the debug panel
      // shows a full, stable list of rows instead of jumping around.
      conditions.push(
        { label: "Palm outward/sideways", passed: false, value: "n/a" },
        { label: "Fingers extended", passed: false, value: "n/a" },
      );
      return { gesture: this.name, matched: false, conditions };
    }

    const hand = frame.hands[0];
    const landmarks = hand.landmarks;

    // Condition 2: palm turned outward/sideways rather than flat toward the lens.
    const facingScore = palmCameraFacingScore(landmarks);
    const palmOk = facingScore <= PALM_FACING_MAX;
    conditions.push({
      label: "Palm outward/sideways",
      passed: palmOk,
      value: facingScore.toFixed(2),
    });

    // Condition 3: index/middle/ring/pinky extended. Thumb is intentionally ignored.
    const fingersExtended =
      isFingerExtended(landmarks, HAND.INDEX_MCP, HAND.INDEX_TIP) &&
      isFingerExtended(landmarks, HAND.MIDDLE_MCP, HAND.MIDDLE_TIP) &&
      isFingerExtended(landmarks, HAND.RING_MCP, HAND.RING_TIP) &&
      isFingerExtended(landmarks, HAND.PINKY_MCP, HAND.PINKY_TIP);
    conditions.push({
      label: "Fingers extended",
      passed: fingersExtended,
      value: fingersExtended ? "straight" : "curled",
    });

    const matched = palmOk && fingersExtended;
    return { gesture: this.name, matched, conditions };
  }
}

/**
 * Detects a thumbs-up: one hand, thumb extended and pointing up, other four fingers
 * curled into the palm. Every condition must pass simultaneously for a frame to "match".
 */
export class ThumbsUpDetector implements GestureDetector {
  readonly name = "thumbsUp" as const;

  check(frame: FrameLandmarks): GestureCheckResult {
    const conditions: ConditionResult[] = [];

    // Condition 1: exactly one hand in frame.
    const oneHand = frame.hands.length === 1;
    conditions.push({
      label: "Single hand",
      passed: oneHand,
      value: `${frame.hands.length} hand(s)`,
    });

    if (!oneHand) {
      conditions.push(
        { label: "Thumb extended", passed: false, value: "n/a" },
        { label: "Other fingers curled", passed: false, value: "n/a" },
        { label: "Thumb pointing up", passed: false, value: "n/a" },
      );
      return { gesture: this.name, matched: false, conditions };
    }

    const hand = frame.hands[0];
    const landmarks = hand.landmarks;
    const wrist = landmarks[HAND.WRIST];
    const thumbTip = landmarks[HAND.THUMB_TIP];

    // Condition 2: thumb extended away from the palm.
    const thumbExtended = isFingerExtended(landmarks, HAND.THUMB_MCP, HAND.THUMB_TIP);
    conditions.push({
      label: "Thumb extended",
      passed: thumbExtended,
      value: thumbExtended ? "straight" : "curled",
    });

    // Condition 3: index/middle/ring/pinky curled into a fist.
    const othersCurled =
      !isFingerExtended(landmarks, HAND.INDEX_MCP, HAND.INDEX_TIP) &&
      !isFingerExtended(landmarks, HAND.MIDDLE_MCP, HAND.MIDDLE_TIP) &&
      !isFingerExtended(landmarks, HAND.RING_MCP, HAND.RING_TIP) &&
      !isFingerExtended(landmarks, HAND.PINKY_MCP, HAND.PINKY_TIP);
    conditions.push({
      label: "Other fingers curled",
      passed: othersCurled,
      value: othersCurled ? "fist" : "open",
    });

    // Condition 4: thumb points mostly upward (image y decreases upward) rather than
    // sideways or downward.
    const dx = thumbTip.x - wrist.x;
    const dy = thumbTip.y - wrist.y;
    const pointingUp = dy < 0 && Math.abs(dy) > Math.abs(dx);
    conditions.push({
      label: "Thumb pointing up",
      passed: pointingUp,
      value: pointingUp ? "up" : "other",
    });

    const matched = thumbExtended && othersCurled && pointingUp;
    return { gesture: this.name, matched, conditions };
  }
}

/** Human-readable label for each recognizable gesture, used in status text. */
export const GESTURE_LABELS: Record<GestureName, string> = {
  salute: "Salute",
  thumbsUp: "Thumbs up",
  peace: "Peace sign",
  wave: "Wave",
};

/**
 * Registry of all available gesture detectors. New gestures (Peace, Wave, ...) implement
 * GestureDetector and get added here — the detection hook doesn't need to change.
 */
export function createGestureDetectors(): GestureDetector[] {
  return [new SaluteDetector(), new ThumbsUpDetector()];
}
