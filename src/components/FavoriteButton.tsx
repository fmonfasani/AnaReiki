"use client";

import { useState } from "react";
import { toggleFavorite } from "@/actions/library";

interface FavoriteButtonProps {
  contentId: string;
  isFav: boolean;
}

export default function FavoriteButton({ contentId, isFav: initial }: FavoriteButtonProps) {
  const [isFav, setIsFav] = useState(initial);

  const handleClick = async () => {
    await toggleFavorite(contentId, isFav);
    setIsFav(!isFav);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
        isFav
          ? "bg-pink-50 text-pink-600 border border-pink-200"
          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-pink-50 hover:text-pink-500"
      }`}
    >
      <span className="material-symbols-outlined text-sm">
        {isFav ? "favorite" : "favorite_border"}
      </span>
      {isFav ? "Favorito" : "Guardar"}
    </button>
  );
}
