"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { MessageCircle, Download, Play, Lock, Trash2, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import LikeButton from "@/components/social/LikeButton";
import type { MediaData } from "@/types";

interface MediaCardProps {
  media: MediaData;
  eventId?: string;
  canDelete?: boolean;
}

export default function MediaCard({ media, eventId, canDelete = false }: MediaCardProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const likeCount = media.likes?.length ?? 0;
  const isLiked = currentUserId ? media.likes?.includes(currentUserId) : false;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const res = await fetch(`/api/media/${media._id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }
      toast.success("Media deleted successfully");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting media");
    }
  };

  return (
    <Link
      href={`/media/${media._id}`}
      className="block group relative rounded-xl overflow-hidden bg-gray-100"
      id={`media-card-${media._id}`}
    >
      {/* Image / Video Thumbnail */}
      <div className="relative aspect-square">
        <Image
          src={media.thumbnailUrl || media.fileUrl}
          alt="Media item"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={media.fileUrl.includes("amazonaws.com")}
        />

        {/* Video indicator */}
        {media.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-3">
              <Play size={20} className="text-white fill-white" />
            </div>
          </div>
        )}

        {/* Private indicator */}
        {media.mediaVisibility === "private" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm pointer-events-none">
            <Lock size={10} />
            Private
          </div>
        )}

        {/* Like count badge */}
        {likeCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
            <Heart size={10} className="fill-red-400 text-red-400" />
            {likeCount}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <div className="flex items-center gap-3 text-white w-full">
            <LikeButton
              mediaId={media._id}
              initialLiked={isLiked}
              initialCount={likeCount}
              className="bg-transparent hover:bg-white/20 text-white px-2 py-1"
            />
            <div className="flex items-center gap-1 text-sm font-medium">
              <MessageCircle size={16} />
              <span>{media.commentCount || 0}</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-white hover:text-red-400 transition-colors bg-transparent border-none outline-none z-10"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <Download size={16} className="hover:text-yellow-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
