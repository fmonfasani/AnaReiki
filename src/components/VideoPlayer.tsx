"use client";

import { CldVideoPlayer } from "next-cloudinary";
import "next-cloudinary/dist/cld-video-player.css";

interface VideoPlayerProps {
  publicId: string;
  colors?: {
    accent?: string;
    base?: string;
    text?: string;
  };
}

export default function VideoPlayer({ publicId, colors }: VideoPlayerProps) {
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
      <CldVideoPlayer
        width="1920"
        height="1080"
        src={publicId}
        colors={
          colors || {
            accent: "#9333ea", // purple-600
            base: "#000000",
            text: "#ffffff",
          }
        }
        fontFace="Inter"
      />
    </div>
  );
}
