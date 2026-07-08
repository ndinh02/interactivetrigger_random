"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  COOLDOWN_MS,
  HAND_LANDMARKER_MODEL_URL,
  HOLD_TIME_MS,
  MEDIAPIPE_WASM_URL,
  POSE_LANDMARKER_MODEL_URL,
  TARGET_FPS,
} from "@/lib/config";
import { createGestureDetectors, GESTURE_LABELS } from "@/lib/detector";
import type {
  FrameLandmarks,
  GestureCheckResult,
  GestureLifecycleState,
  GestureName,
  HandResult,
  SaluteDetectionState,
} from "@/types";

const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

function statusTextFor(lifecycle: GestureLifecycleState, gesture: GestureName | null): string {
  const label = gesture ? GESTURE_LABELS[gesture] : "Gesture";
  switch (lifecycle) {
    case "idle":
      return "Waiting...";
    case "holding":
      return `${label} detected, hold still...`;
    case "triggered":
      return `${label} confirmed!`;
    case "cooldown":
      return "Lower your hand to reset";
  }
}

interface UseSaluteDetectionOptions {
  /** Called exactly once each time a gesture is confirmed (after the full hold time). */
  onTrigger: (gesture: GestureName) => void;
  /** Called once the pose has fully reset to idle: hand lowered and cooldown elapsed. */
  onReset?: () => void;
  /** Set to false to pause the camera/model pipeline entirely. */
  enabled?: boolean;
}

export interface UseSaluteDetectionResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: SaluteDetectionState;
  /** Latest raw landmarks, for drawing debug overlays. Null until the first frame resolves. */
  frame: FrameLandmarks | null;
}

/**
 * Runs webcam capture + MediaPipe hand/pose detection + the salute gesture state machine.
 *
 * Lifecycle: idle -> holding (pose valid, timing HOLD_TIME_MS) -> triggered (fires onTrigger
 * once) -> cooldown (waits for the pose to stay invalid for COOLDOWN_MS) -> back to idle.
 */
export function useSaluteDetection({
  onTrigger,
  onReset,
  enabled = true,
}: UseSaluteDetectionOptions): UseSaluteDetectionResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Gesture state machine refs (avoid stale closures inside the rAF loop).
  const lifecycleRef = useRef<GestureLifecycleState>("idle");
  const activeGestureRef = useRef<GestureName | null>(null);
  const holdStartedAtRef = useRef<number>(0);
  const invalidSinceRef = useRef<number | null>(null);
  const triggerCountRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastFrameAtRef = useRef(0);
  const fpsHistoryRef = useRef<number[]>([]);
  const onTriggerRef = useRef(onTrigger);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
    onResetRef.current = onReset;
  }, [onTrigger, onReset]);

  const gestureDetectorsRef = useRef(createGestureDetectors());

  const [state, setState] = useState<SaluteDetectionState>({
    cameraStatus: "idle",
    modelStatus: "loading",
    lifecycle: "idle",
    statusText: statusTextFor("idle", null),
    fps: 0,
    holdProgress: 0,
    lastCheck: null,
    triggerCount: 0,
  });
  const [frame, setFrame] = useState<FrameLandmarks | null>(null);

  // Runs every detector's check and picks which one drives the state machine this frame:
  // whichever gesture is already in progress (so a hold can't get bumped mid-way by another
  // gesture), or — while idle — the first detector that matches.
  const runDetectors = useCallback((frameData: FrameLandmarks): GestureCheckResult => {
    const detectors = gestureDetectorsRef.current;

    if (activeGestureRef.current) {
      const active = detectors.find((d) => d.name === activeGestureRef.current);
      if (active) return active.check(frameData);
    }

    const results = detectors.map((d) => d.check(frameData));
    const matched = results.find((r) => r.matched);
    if (matched) activeGestureRef.current = matched.gesture;
    return matched ?? results[0];
  }, []);

  const advanceStateMachine = useCallback((check: GestureCheckResult, now: number) => {
    const lifecycle = lifecycleRef.current;
    let holdProgress = 0;

    if (lifecycle === "idle") {
      if (check.matched) {
        lifecycleRef.current = "holding";
        holdStartedAtRef.current = now;
      }
    } else if (lifecycle === "holding") {
      if (check.matched) {
        const elapsed = now - holdStartedAtRef.current;
        holdProgress = Math.min(elapsed / HOLD_TIME_MS, 1);
        if (elapsed >= HOLD_TIME_MS) {
          lifecycleRef.current = "triggered";
          triggerCountRef.current += 1;
          onTriggerRef.current(check.gesture);
        }
      } else {
        lifecycleRef.current = "idle";
        activeGestureRef.current = null;
      }
    } else if (lifecycle === "triggered") {
      if (!check.matched) {
        lifecycleRef.current = "cooldown";
        invalidSinceRef.current = now;
      }
    } else if (lifecycle === "cooldown") {
      if (check.matched) {
        // Gesture became valid again before the cooldown window elapsed; keep waiting.
        invalidSinceRef.current = null;
      } else {
        if (invalidSinceRef.current === null) invalidSinceRef.current = now;
        if (now - invalidSinceRef.current >= COOLDOWN_MS) {
          lifecycleRef.current = "idle";
          activeGestureRef.current = null;
          onResetRef.current?.();
        }
      }
    }

    return holdProgress;
  }, []);

  // --- Setup: camera + models ---
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function setup() {
      setState((s) => ({ ...s, cameraStatus: "requesting" }));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
              video.play().then(resolve).catch(resolve);
            };
          });
        }
        setState((s) => ({ ...s, cameraStatus: "ready" }));
      } catch (err) {
        console.error("Camera permission/setup failed:", err);
        if (!cancelled) setState((s) => ({ ...s, cameraStatus: "denied" }));
        return;
      }

      try {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const [handLandmarker, poseLandmarker] = await Promise.all([
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          }),
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_LANDMARKER_MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
        ]);
        if (cancelled) {
          handLandmarker.close();
          poseLandmarker.close();
          return;
        }
        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;
        setState((s) => ({ ...s, modelStatus: "ready" }));
      } catch (err) {
        console.error("MediaPipe model load failed:", err);
        if (!cancelled) setState((s) => ({ ...s, modelStatus: "error" }));
      }
    }

    setup();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      handLandmarkerRef.current?.close();
      poseLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      poseLandmarkerRef.current = null;
    };
  }, [enabled]);

  // --- Detection loop ---
  useEffect(() => {
    if (!enabled) return;

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);

      if (now - lastFrameAtRef.current < FRAME_INTERVAL_MS) return;
      const delta = now - lastFrameAtRef.current;
      lastFrameAtRef.current = now;

      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;
      const poseLandmarker = poseLandmarkerRef.current;
      if (!video || !handLandmarker || !poseLandmarker || video.readyState < 2) return;
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = video.currentTime;

      // Rolling FPS estimate over the last ~20 samples.
      const instantFps = 1000 / Math.max(delta, 1);
      const history = fpsHistoryRef.current;
      history.push(instantFps);
      if (history.length > 20) history.shift();
      const fps = history.reduce((a, b) => a + b, 0) / history.length;

      const timestamp = performance.now();
      const handResults = handLandmarker.detectForVideo(video, timestamp);
      const poseResults = poseLandmarker.detectForVideo(video, timestamp);

      const hands: HandResult[] = (handResults.landmarks ?? []).map((landmarks, i) => ({
        landmarks: landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        handedness:
          (handResults.handednesses?.[i]?.[0]?.categoryName as "Left" | "Right") ?? "Right",
        score: handResults.handednesses?.[i]?.[0]?.score ?? 0,
      }));
      const pose = poseResults.landmarks?.[0]
        ? poseResults.landmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
        : null;

      const frameData: FrameLandmarks = { hands, pose, timestampMs: timestamp };
      const check = runDetectors(frameData);
      const holdProgress = advanceStateMachine(check, timestamp);

      setFrame(frameData);
      setState((s) => ({
        ...s,
        lifecycle: lifecycleRef.current,
        statusText: statusTextFor(lifecycleRef.current, activeGestureRef.current),
        fps: Math.round(fps),
        holdProgress,
        lastCheck: check,
        triggerCount: triggerCountRef.current,
      }));
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, advanceStateMachine, runDetectors]);

  return { videoRef, state, frame };
}
