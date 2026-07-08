interface RewardAudioCardProps {
  label: string;
}

/**
 * Visual placeholder for an audio-only reward, sized to match the other corner cards
 * (RewardImage). Playback itself is handled by the shared AudioPlayer widget.
 */
export function RewardAudioCard({ label }: RewardAudioCardProps) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-white/80 bg-black/80 shadow-2xl">
      <span className="animate-pulse text-4xl">🎵</span>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </div>
  );
}
