"use client";

import type { SaluteDetectionState } from "@/types";

const CAMERA_DOT: Record<SaluteDetectionState["cameraStatus"], string> = {
  idle: "⚪",
  requesting: "🟡",
  ready: "🟢",
  denied: "🔴",
  error: "🔴",
};

const CAMERA_LABEL: Record<SaluteDetectionState["cameraStatus"], string> = {
  idle: "Idle",
  requesting: "Requesting...",
  ready: "Ready",
  denied: "Denied",
  error: "Error",
};

/** Minimal status readout: camera connection + current gesture state, shown under the feed. */
export function StatusBar({ state }: { state: SaluteDetectionState }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center font-mono text-sm text-white/80">
      <p>
        Camera: {CAMERA_DOT[state.cameraStatus]} {CAMERA_LABEL[state.cameraStatus]}
        {state.cameraStatus === "ready" && state.modelStatus === "loading" && " (loading model...)"}
        {state.cameraStatus === "ready" && state.modelStatus === "error" && " (model failed to load)"}
      </p>
      <p className="text-base font-medium text-white">Gesture: {state.statusText}</p>
      {state.lifecycle === "holding" && (
        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-emerald-400 transition-[width] duration-75"
            style={{ width: `${Math.round(state.holdProgress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
