"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { saveProgress } from "@/actions/library";

interface VideoPlayerProps {
  publicId: string;
  contentId?: string;
  initialProgress?: number;
  duration?: number;
}

export default function VideoPlayer({
  publicId,
  contentId,
  initialProgress,
  duration,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(initialProgress || 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const saveCurrentProgress = useCallback(async () => {
    if (!contentId || !videoRef.current) return;
    progressRef.current = Math.floor(videoRef.current.currentTime);
    await saveProgress(contentId, progressRef.current, duration);
  }, [contentId, duration]);

  useEffect(() => {
    if (!contentId || !ready) return;

    timerRef.current = setInterval(() => {
      saveCurrentProgress();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      saveCurrentProgress();
    };
  }, [contentId, saveCurrentProgress, ready]);

  const handleEnded = useCallback(async () => {
    if (!contentId) return;
    await saveProgress(contentId, duration || 1, duration || 1);
  }, [contentId, duration]);

  const handleLoadedMetadata = useCallback(() => {
    if (initialProgress && initialProgress > 30 && videoRef.current) {
      videoRef.current.currentTime = initialProgress;
    }
    setReady(true);
  }, [initialProgress]);

  const videoSrc = publicId.startsWith("http")
    ? publicId
    : publicId.startsWith("/")
      ? publicId
      : `/uploads/videos/${publicId}`;

  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative group">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
        preload="metadata"
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
