/** Shared YouTube IFrame Player API loader + types, used by any embedded YT player. */

export interface YTPlayerInstance {
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

export interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayerInstance }) => void;
    onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
  };
}

export interface YTNamespace {
  Player: new (target: HTMLElement, options: YTPlayerOptions) => YTPlayerInstance;
  PlayerState: { PLAYING: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<YTNamespace> | null = null;

/** Lazily injects the YouTube IFrame API script, reusing one load across the app. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT) return Promise.resolve(window.YT);
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

/** Extracts an 11-char YouTube video ID from a youtu.be, watch, or embed URL. */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1) || null;
    const vParam = parsed.searchParams.get("v");
    if (vParam) return vParam;
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    return embedMatch ? embedMatch[1] : null;
  } catch {
    return null;
  }
}
