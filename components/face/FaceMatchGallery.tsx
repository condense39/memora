"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Camera } from "lucide-react";

export default function FaceMatchGallery({ hasSelfie }: { hasSelfie: boolean }) {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSelfie) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/face/match?page=${page}&limit=20`);
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();

        setMatches((prev) => (page === 1 ? data.matches : [...prev, ...data.matches]));
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Fetch matches error:", err);
        setError("Could not load photos.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [page, hasSelfie]);

  if (!hasSelfie) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Photos with you</h2>
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <p className="text-gray-500 font-medium">Enroll your face above to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Photos with you</h2>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
          {matches.length} matches
        </span>
      </div>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : loading && page === 1 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-yellow-400 w-8 h-8" />
        </div>
      ) : matches.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <Camera className="w-12 h-12 text-yellow-300 mx-auto mb-3" />
          <p className="text-gray-800 font-medium">No matches found yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Try scanning all photos or upload new ones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {matches.map((match) => (
            <div
              key={match._id}
              onClick={() => router.push(`/media/${match.mediaId._id}`)}
              className="relative rounded-xl overflow-hidden cursor-pointer aspect-square group bg-gray-100"
            >
              <Image
                src={match.mediaId.thumbnailUrl || match.mediaId.fileUrl}
                alt="Matched photo"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={match.mediaId.fileUrl.includes("amazonaws.com")}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <span className="bg-yellow-400 text-gray-900 text-xs font-bold rounded-full px-2 py-0.5 inline-block mb-1">
                  {Math.round(match.confidence)}% match
                </span>
                <p className="text-white text-xs mt-0.5 truncate font-medium">
                  {match.mediaId.eventId?.name || "Event"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
