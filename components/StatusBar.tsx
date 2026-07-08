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

/** Compact status badge: camera connection + current gesture state, overlaid on the feed. */
export function StatusBar({ state }: { state: SaluteDetectionState }) {
  return (
    <div className="flex flex-col items-end gap-0.5 rounded-lg bg-black/60 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-white/80 backdrop-blur-sm">
      <p>
        {CAMERA_DOT[state.cameraStatus]} {CAMERA_LABEL[state.cameraStatus]}
        {state.cameraStatus === "ready" && state.modelStatus === "loading" && " (loading...)"}
        {state.cameraStatus === "ready" && state.modelStatus === "error" && " (error)"}
      </p>
      <p className="font-medium text-white">{state.statusText}</p>
      {state.lifecycle === "holding" && (
        <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-emerald-400 transition-[width] duration-75"
            style={{ width: `${Math.round(state.holdProgress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
