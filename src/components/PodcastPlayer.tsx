"use client";

import { useEffect, useRef, useCallback } from "react";
import { saveProgress } from "@/actions/library";

interface PodcastPlayerProps {
  url: string;
  contentId?: string;
  duration?: number;
}

export default function PodcastPlayer({ url, contentId, duration }: PodcastPlayerProps) {
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveCurrentProgress = useCallback(async () => {
    if (!contentId) return;
    await saveProgress(contentId, progressRef.current, duration);
  }, [contentId, duration]);

  useEffect(() => {
    if (!contentId) return;

    timerRef.current = setInterval(() => {
      saveCurrentProgress();
    }, 30000);

    const handleBeforeUnload = () => saveCurrentProgress();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      saveCurrentProgress();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [contentId, saveCurrentProgress]);

  const getEmbedUrl = (inputUrl: string) => {
    if (inputUrl.includes("/embed/")) return inputUrl;
    return inputUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg bg-gray-900 min-h-[152px]">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block"
      />
    </div>
  );
}
