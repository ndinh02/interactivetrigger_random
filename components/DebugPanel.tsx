"use client";

import type { SaluteDetectionState } from "@/types";

/** Detailed diagnostics: FPS, hold progress, and a pass/fail row per detection condition. */
export function DebugPanel({ state }: { state: SaluteDetectionState }) {
  const { lastCheck, fps, triggerCount, lifecycle } = state;

  return (
    <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs text-white/80">
      <div className="mb-2 flex justify-between text-white/50">
        <span>FPS: {fps}</span>
        <span>Lifecycle: {lifecycle}</span>
        <span>Triggers: {triggerCount}</span>
      </div>
      <ul className="space-y-1">
        {lastCheck?.conditions.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span>{c.passed ? "✅" : "❌"}</span>
              <span>{c.label}</span>
            </span>
            <span className="text-white/50">{c.value}</span>
          </li>
        ))}
        {!lastCheck && <li className="text-white/40">No detection yet...</li>}
      </ul>
    </div>
  );
}
