interface PodcastPlayerProps {
  url: string;
}

export default function PodcastPlayer({ url }: PodcastPlayerProps) {
  // Convert normal Spotify URL to Embed URL if needed
  // Example: https://open.spotify.com/episode/XXXX -> https://open.spotify.com/embed/episode/XXXX
  const getEmbedUrl = (url: string) => {
    if (url.includes("/embed/")) return url;
    return url.replace("open.spotify.com/", "open.spotify.com/embed/");
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
      ></iframe>
    </div>
  );
}
