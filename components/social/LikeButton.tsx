"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  mediaId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
}

export default function LikeButton({
  mediaId,
  initialLiked,
  initialCount,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isLoading) return;

    // Optimistic update
    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : count - 1;
    setLiked(nextLiked);
    setCount(nextCount);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/like`, { method: "POST" });
      if (!res.ok) {
        // Revert on error
        setLiked(!nextLiked);
        setCount(count);
      } else {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.likeCount);
      }
    } catch {
      setLiked(!nextLiked);
      setCount(count);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      id={`like-btn-${mediaId}`}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-150 font-medium text-sm",
        liked
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
        className
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        size={18}
        className={cn(
          "transition-all duration-150",
          liked && "fill-red-500 text-red-500",
          animating && "scale-125"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
