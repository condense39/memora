"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import EventGrid from "@/components/events/EventGrid";
import MediaGrid from "@/components/media/MediaGrid";
import SearchBar from "@/components/search/SearchBar";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const type = searchParams.get("type") || "all";

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ events: any[]; media: any[]; total: number } | null>(null);

  useEffect(() => {
    async function fetchSearch() {
      if (!q && !tag) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?${searchParams.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSearch();
  }, [searchParams]);

  if (!q && !tag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-yellow-50 p-6 rounded-full mb-6 text-yellow-500">
          <Search size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Search Memora</h1>
        <p className="text-gray-500 mt-2 max-w-sm">
          Find events, photos, and tags across the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:hidden mb-4">
        <SearchBar />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
        {results && !loading && (
          <p className="text-sm text-gray-600">
            {results.total} results for &apos;{q || tag}&apos;
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <TabLink currentType={type} type="all" label="All" />
        <TabLink currentType={type} type="events" label="Events" />
        <TabLink currentType={type} type="media" label="Photos" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center text-gray-500 flex justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      )}

      {/* No Results */}
      {!loading && results?.total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="text-yellow-200 size-16 mx-auto" />
          <h2 className="text-gray-700 font-medium mt-4">
            No results for &apos;{q || tag}&apos;
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Try searching for event names, photo tags, or different terms
          </p>
        </div>
      )}

      {/* Results Content */}
      {!loading && results && results.total > 0 && (
        <div className="space-y-12">
          {/* Events Section */}
          {(type === "all" || type === "events") && results.events.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Events</h2>
                {type === "all" && results.events.length > 4 && (
                  <Link href={`/search?q=${q}&type=events`} className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                    View all events
                  </Link>
                )}
              </div>
              <EventGrid events={type === "all" ? results.events.slice(0, 4) : results.events} />
            </div>
          )}

          {/* Photos Section */}
          {(type === "all" || type === "media") && results.media.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                {type === "all" && results.media.length > 8 && (
                  <Link href={`/search?q=${q}&type=media`} className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                    View all photos
                  </Link>
                )}
              </div>
              <MediaGrid media={type === "all" ? results.media.slice(0, 8) : results.media} currentUserId={undefined} isGlobalAdmin={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabLink({ currentType, type, label }: { currentType: string; type: string; label: string }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  
  const isActive = currentType === type;
  
  return (
    <Link
      href={`/search?q=${q}&type=${type}`}
      className={cn(
        "pb-2 text-sm transition-colors relative",
        isActive ? "text-yellow-700 font-semibold" : "text-gray-500 hover:text-gray-700"
      )}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400" />
      )}
    </Link>
  );
}
