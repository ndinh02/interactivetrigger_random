"use client";

import { useState } from "react";
import { SaluteDetector } from "@/components/SaluteDetector";
import { YoutubePlayer } from "@/components/YoutubePlayer";
import { RewardImage } from "@/components/RewardImage";
import { RewardVideoClip } from "@/components/RewardVideoClip";
import {
  SALUTE_IMAGE_URL,
  SALUTE_YOUTUBE_URL,
  THUMBS_UP_CLIP_END_SECONDS,
  THUMBS_UP_CLIP_START_SECONDS,
  THUMBS_UP_YOUTUBE_URL,
} from "@/lib/config";
import { extractVideoId } from "@/lib/youtube";
import type { GestureName } from "@/types";

const THUMBS_UP_VIDEO_ID = extractVideoId(THUMBS_UP_YOUTUBE_URL);

export default function Home() {
  const [started, setStarted] = useState(false);
  const [activeReward, setActiveReward] = useState<GestureName | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-4 py-12">
      <div className="text-center">
        <p className="mt-1 text-sm text-white/50">
          Salute for a reward image + music, or give a thumbs up for a bonus clip.
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
            ) : activeReward === "thumbsUp" && THUMBS_UP_VIDEO_ID ? (
              <RewardVideoClip
                videoId={THUMBS_UP_VIDEO_ID}
                startSeconds={THUMBS_UP_CLIP_START_SECONDS}
                endSeconds={THUMBS_UP_CLIP_END_SECONDS}
              />
            ) : null
          }
        />
      )}

      <YoutubePlayer active={activeReward === "salute"} youtubeUrl={SALUTE_YOUTUBE_URL} />
    </main>
  );
}
