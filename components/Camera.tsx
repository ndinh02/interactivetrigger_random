"use client";

import { useEffect, useRef, useState } from "react";
import type { FrameLandmarks } from "@/types";
import { HAND, POSE } from "@/lib/geometry";
import { Overlay } from "@/components/Overlay";

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

interface CameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  frame: FrameLandmarks | null;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "error";
  showLandmarks: boolean;
  /** Whether a reward is currently active. */
  rewardVisible?: boolean;
  /** Reward content (image/video) shown inside the camera zone while `rewardVisible` is true. */
  rewardContent?: React.ReactNode;
}

/** Webcam feed, mirrored like a selfie camera, with an optional landmark overlay. */
export function Camera({
  videoRef,
  frame,
  cameraStatus,
  showLandmarks,
  rewardVisible = false,
  rewardContent,
}: CameraProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showLandmarks || !frame) return;

    const toX = (nx: number) => nx * canvas.width;
    const toY = (ny: number) => ny * canvas.height;

    // Pose: draw a small subset (eyes + shoulders) for debug reference.
    if (frame.pose) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.9)"; // sky-400
      for (const idx of [POSE.NOSE, POSE.LEFT_EYE, POSE.RIGHT_EYE, POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER]) {
        const p = frame.pose[idx];
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hands: skeleton + joints.
    for (const hand of frame.hands) {
      ctx.strokeStyle = "rgba(74, 222, 128, 0.75)"; // green-400
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = hand.landmarks[a];
        const p2 = hand.landmarks[b];
        ctx.moveTo(toX(p1.x), toY(p1.y));
        ctx.lineTo(toX(p2.x), toY(p2.y));
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(220, 252, 231, 0.9)"; // green-50
      for (const p of hand.landmarks) {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight the wrist so it's easy to see what "near forehead" is measuring against.
      const wrist = hand.landmarks[HAND.WRIST];
      ctx.fillStyle = "rgba(248, 113, 113, 0.95)"; // red-400
      ctx.beginPath();
      ctx.arc(toX(wrist.x), toY(wrist.y), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frame, showLandmarks, videoRef]);

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <div className="relative w-full" style={{ aspectRatio }}>
        {/* Mirroring both the video and the overlay canvas together keeps landmark
            coordinates (computed from the raw, unmirrored frame) in perfect registration. */}
        <div className="absolute inset-0 [transform:scaleX(-1)]">
          <video
            ref={videoRef}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>

        {cameraStatus !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white/70">
            {cameraStatus === "idle" && "Starting camera..."}
            {cameraStatus === "requesting" && "Requesting camera permission..."}
            {cameraStatus === "denied" && "Camera permission denied. Enable it and reload."}
            {cameraStatus === "error" && "Camera error. Check your device and reload."}
          </div>
        )}

        {/* Rendered outside the mirrored wrapper above so it isn't flipped. */}
        <Overlay visible={rewardVisible}>{rewardContent}</Overlay>
      </div>
    </div>
  );
}
