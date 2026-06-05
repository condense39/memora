"use client";

import { useState, useEffect } from "react";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { MediaData } from "@/types";

function FavouriteCard({ media }: { media: MediaData }) {
  const event = media.eventId as unknown as { _id: string; name: string } | null;
  return (
    <Link
      href={`/media/${media._id}`}
      id={`fav-card-${media._id}`}
      className="block group relative rounded-xl overflow-hidden bg-gray-100 aspect-square"
    >
      <Image
        src={media.thumbnailUrl || media.fileUrl}
        alt="Favourite photo"
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        unoptimized={media.fileUrl.includes("amazonaws.com")}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        {event && (
          <span className="text-white text-xs font-medium bg-black/50 rounded-full px-2 py-0.5 truncate max-w-full">
            {event.name}
          </span>
        )}
      </div>
      {/* Bookmark badge */}
      <div className="absolute top-2 right-2">
        <span className="w-7 h-7 flex items-center justify-center bg-yellow-400 rounded-full shadow-sm">
          <Heart size={13} className="fill-white text-white" />
        </span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return <div className="skeleton aspect-square rounded-xl" />;
}

export default function FavouritesPage() {
  const [media, setMedia] = useState<MediaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavourites() {
      try {
        const res = await fetch("/api/media?favourites=true&limit=50");
        if (res.ok) {
          const data = await res.json();
          setMedia(data.media ?? []);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    }
    fetchFavourites();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favourites</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? "Loading…" : `${media.length} saved photo${media.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-3">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mb-5">
            <Heart size={36} className="text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No favourites yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mb-6">
            Save photos you love by clicking the bookmark icon on any photo.
          </p>
          <Link href="/events" className="btn-primary flex items-center gap-2" id="browse-events-cta">
            Browse Events <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <FavouriteCard key={item._id} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}
