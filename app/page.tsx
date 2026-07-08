"use client";

import { useState } from "react";
import { SaluteDetector } from "@/components/SaluteDetector";
import { AudioPlayer } from "@/components/AudioPlayer";
import { RewardImage } from "@/components/RewardImage";
import { RewardAudioCard } from "@/components/RewardAudioCard";
import { SALUTE_IMAGE_URL, SALUTE_MUSIC_URL, THUMBS_UP_MUSIC_URL } from "@/lib/config";
import type { GestureName } from "@/types";

const REWARD_MUSIC_URL: Record<GestureName, string | null> = {
  salute: SALUTE_MUSIC_URL,
  thumbsUp: THUMBS_UP_MUSIC_URL,
  peace: null,
  wave: null,
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [activeReward, setActiveReward] = useState<GestureName | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-4 py-12">
      <div className="text-center">
        <p className="mt-1 text-sm text-white/50">
          Salute for a reward image + music, or give a thumbs up for a bonus track.
        </p>
      </div>

      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Start camera
        </button>
      ) : (
        <SaluteDetector
          onTrigger={(gesture) => setActiveReward(gesture)}
          onReset={() => setActiveReward(null)}
          rewardVisible={activeReward !== null}
          rewardContent={
            activeReward === "salute" ? (
              <RewardImage src={SALUTE_IMAGE_URL} />
            ) : activeReward === "thumbsUp" ? (
              <RewardAudioCard label="Thumbs up!" />
            ) : null
          }
        />
      )}

      <AudioPlayer
        active={activeReward !== null}
        src={(activeReward && REWARD_MUSIC_URL[activeReward]) || ""}
      />
    </main>
  );
}
