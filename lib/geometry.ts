import type { Landmark } from "@/types";
import { FINGER_EXTENSION_RATIO } from "@/lib/config";

/** MediaPipe HandLandmarker point indices (21-point hand model). */
export const HAND = {
  WRIST: 0,
  THUMB_MCP: 2,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_TIP: 20,
} as const;

/** MediaPipe PoseLandmarker point indices (33-point BlazePose model), the subset we use. */
export const POSE = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
} as const;

export function distance2D(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/**
 * A finger is "extended" when its fingertip is proportionally much farther from the
 * wrist than its knuckle (MCP) is. Using a wrist-relative ratio (rather than an absolute
 * pixel distance) keeps this working regardless of hand size or distance to the camera.
 */
export function isFingerExtended(
  landmarks: Landmark[],
  mcpIdx: number,
  tipIdx: number,
): boolean {
  const wrist = landmarks[HAND.WRIST];
  const mcpDist = Math.max(distance2D(wrist, landmarks[mcpIdx]), 1e-4);
  const tipDist = distance2D(wrist, landmarks[tipIdx]);
  return tipDist / mcpDist > FINGER_EXTENSION_RATIO;
}

/** Ratio form of isFingerExtended, useful for debug readouts. */
export function fingerExtensionRatio(landmarks: Landmark[], mcpIdx: number, tipIdx: number): number {
  const wrist = landmarks[HAND.WRIST];
  const mcpDist = Math.max(distance2D(wrist, landmarks[mcpIdx]), 1e-4);
  const tipDist = distance2D(wrist, landmarks[tipIdx]);
  return tipDist / mcpDist;
}

/**
 * Estimates the palm's facing direction as a unit normal vector, derived from the
 * cross product of two vectors spanning the palm (wrist->index MCP, wrist->pinky MCP).
 * The sign/magnitude of the z component indicates how directly the palm faces the camera:
 * near 1 = palm flat toward/away from the lens, near 0 = palm turned edge-on (sideways).
 */
export function palmNormal(landmarks: Landmark[]): { x: number; y: number; z: number } {
  const wrist = landmarks[HAND.WRIST];
  const index = landmarks[HAND.INDEX_MCP];
  const pinky = landmarks[HAND.PINKY_MCP];

  const v1 = { x: index.x - wrist.x, y: index.y - wrist.y, z: index.z - wrist.z };
  const v2 = { x: pinky.x - wrist.x, y: pinky.y - wrist.y, z: pinky.z - wrist.z };

  const cross = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
  const len = Math.hypot(cross.x, cross.y, cross.z) || 1e-4;
  return { x: cross.x / len, y: cross.y / len, z: cross.z / len };
}

/**
 * How "flat toward the camera" the palm is, from 0 (edge-on / sideways) to 1 (facing
 * directly at or away from the lens). Salutes should score low-to-mid on this.
 */
export function palmCameraFacingScore(landmarks: Landmark[]): number {
  return Math.abs(palmNormal(landmarks).z);
}
