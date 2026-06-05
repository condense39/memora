"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function EventTagFilters({ eventId }: { eventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tags, setTags] = useState<string[]>([]);
  
  const selectedTag = searchParams.get("tag");

  useEffect(() => {
    fetch(`/api/events/${eventId}/tags`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setTags(data.tags);
      })
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, [eventId]);

  if (tags.length === 0) return null;

  const handleTagClick = (tag: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
      <button
        onClick={() => handleTagClick(null)}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
          !selectedTag
            ? "bg-yellow-400 text-gray-900"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors capitalize ${
            selectedTag === tag
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
