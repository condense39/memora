"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavouriteButtonProps {
  mediaId: string;
  initialFavourited: boolean;
  initialCount: number;
  className?: string;
}

export default function FavouriteButton({
  mediaId,
  initialFavourited,
  initialCount,
  className,
}: FavouriteButtonProps) {
  const [favourited, setFavourited] = useState(initialFavourited);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;

    const nextFavourited = !favourited;
    const nextCount = nextFavourited ? count + 1 : count - 1;
    setFavourited(nextFavourited);
    setCount(nextCount);

    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/favourite`, {
        method: "POST",
      });
      if (!res.ok) {
        setFavourited(!nextFavourited);
        setCount(count);
      } else {
        const data = await res.json();
        setFavourited(data.favourited);
        setCount(data.count);
      }
    } catch {
      setFavourited(!nextFavourited);
      setCount(count);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      id={`favourite-btn-${mediaId}`}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-150 font-medium text-sm",
        favourited
          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
        className
      )}
      aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
    >
      <Bookmark
        size={18}
        className={cn(
          "transition-all duration-150",
          favourited && "fill-yellow-500 text-yellow-500"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
