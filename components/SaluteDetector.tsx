"use client";

import { useState } from "react";
import { useSaluteDetection } from "@/hooks/useSaluteDetection";
import { Camera } from "@/components/Camera";
import { StatusBar } from "@/components/StatusBar";
import { DebugPanel } from "@/components/DebugPanel";
import type { GestureName } from "@/types";

interface SaluteDetectorProps {
  /** Fired exactly once per completed gesture (hold time satisfied), with which one matched. */
  onTrigger: (gesture: GestureName) => void;
  /** Fired once the pose has fully reset: hand lowered and cooldown elapsed. */
  onReset: () => void;
  /** Whether a reward is currently active. */
  rewardVisible: boolean;
  /** Reward content (image/video) shown inside the camera zone while `rewardVisible` is true. */
  rewardContent: React.ReactNode;
}

/** Orchestrates the camera feed, gesture detection hook, status readout, and debug tools. */
export function SaluteDetector({ onTrigger, onReset, rewardVisible, rewardContent }: SaluteDetectorProps) {
  const [debugMode, setDebugMode] = useState(true);
  const { videoRef, state, frame } = useSaluteDetection({ onTrigger, onReset });

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <StatusBar state={state} />
      <Camera
        videoRef={videoRef}
        frame={frame}
        cameraStatus={state.cameraStatus}
        showLandmarks={debugMode}
        rewardVisible={rewardVisible}
        rewardContent={rewardContent}
      />

      <button
        onClick={() => setDebugMode((v) => !v)}
        className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {debugMode ? "Hide" : "Show"} debug mode
      </button>

      {debugMode && <DebugPanel state={state} />}
    </div>
  );
}
