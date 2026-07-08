"use client";

import { useRef, useState } from "react";
import { SaluteDetector } from "@/components/SaluteDetector";
import { AudioPlayer, type AudioPlayerHandle } from "@/components/AudioPlayer";
import { RewardImage } from "@/components/RewardImage";
import { RewardVideoLocal } from "@/components/RewardVideoLocal";
import {
  SALUTE_IMAGE_URL,
  SALUTE_MUSIC_START_SECONDS,
  SALUTE_MUSIC_URL,
  THUMBS_UP_MUSIC_END_SECONDS,
  THUMBS_UP_MUSIC_START_SECONDS,
  THUMBS_UP_MUSIC_URL,
  THUMBS_UP_VIDEO_URL,
} from "@/lib/config";
import type { GestureName } from "@/types";

const REWARD_MUSIC_URL: Record<GestureName, string | null> = {
  salute: SALUTE_MUSIC_URL,
  thumbsUp: THUMBS_UP_MUSIC_URL,
  peace: null,
  wave: null,
};

const REWARD_MUSIC_START_SECONDS: Record<GestureName, number> = {
  salute: SALUTE_MUSIC_START_SECONDS,
  thumbsUp: THUMBS_UP_MUSIC_START_SECONDS,
  peace: 0,
  wave: 0,
};

const REWARD_MUSIC_END_SECONDS: Record<GestureName, number | undefined> = {
  salute: undefined,
  thumbsUp: THUMBS_UP_MUSIC_END_SECONDS,
  peace: undefined,
  wave: undefined,
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [activeReward, setActiveReward] = useState<GestureName | null>(null);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-neutral-950 px-4 pb-8 pt-3">
      <div className="text-center">
        <p className="text-sm text-white/50">
          Salute for a reward image + music, or give a thumbs up for a bonus track.
        </p>
      </div>

      {!started ? (
        <button
          onClick={() => {
            setStarted(true);
            // Unlocks the audio element for autoplay-with-sound on Safari/iOS while
            // we're still inside this real tap — gesture-triggered plays later can't do this.
            audioPlayerRef.current?.prime();
          }}
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
              <RewardVideoLocal src={THUMBS_UP_VIDEO_URL} />
            ) : null
          }
        />
      )}

      <AudioPlayer
        ref={audioPlayerRef}
        active={activeReward !== null}
        src={(activeReward && REWARD_MUSIC_URL[activeReward]) || ""}
        startSeconds={activeReward ? REWARD_MUSIC_START_SECONDS[activeReward] : 0}
        endSeconds={activeReward ? REWARD_MUSIC_END_SECONDS[activeReward] : undefined}
      />
    </main>
  );
}
