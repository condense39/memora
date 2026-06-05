"use client";

import { useState, useRef, useEffect } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TagUsersProps {
  mediaId: string;
}

interface UserSearchResult {
  _id: string;
  name: string;
  image?: string;
  email: string;
}

export default function TagUsers({ mediaId }: TagUsersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isTagging, setIsTagging] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Search API
  useEffect(() => {
    if (!isOpen || search.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(data.users ?? []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search, isOpen]);

  const handleTag = async (userId: string) => {
    setIsTagging(userId);
    try {
      await fetch(`/api/media/${mediaId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Tagged you in this photo.",
          taggedUserIds: [userId],
        }),
      });
      setIsOpen(false);
      setSearch("");
    } catch {}
    finally {
      setIsTagging(null);
    }
  };

  return (
    <div className="relative">
      <button
        id={`tag-users-btn-${mediaId}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm font-medium"
        aria-label="Tag a user"
      >
        <UserPlus size={18} />
        <span className="hidden sm:inline">Tag</span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-scale-in"
        >
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full text-sm mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {search.length < 2 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                Type at least 2 characters to search
              </p>
            ) : results.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                No users found
              </p>
            ) : (
              results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleTag(u._id)}
                  disabled={isTagging === u._id}
                  className="flex items-center gap-2.5 w-full p-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-bold flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  {isTagging === u._id && (
                    <Loader2 size={14} className="animate-spin text-yellow-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
