"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (newQuery: string, immediate = false) => {
    setQuery(newQuery);

    if (debouncedTimeoutRef.current) {
      clearTimeout(debouncedTimeoutRef.current);
    }

    const navigate = () => {
      const params = new URLSearchParams(searchParams.toString());
      if (newQuery.trim()) {
        params.set("q", newQuery.trim());
      } else {
        params.delete("q");
      }

      if (pathname === "/search") {
        router.replace(`/search?${params.toString()}`);
      } else if (newQuery.trim()) {
        router.push(`/search?${params.toString()}`);
      }
    };

    if (immediate) {
      navigate();
    } else {
      debouncedTimeoutRef.current = setTimeout(navigate, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(query, true);
    }
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
    if (pathname === "/search") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      router.replace(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Desktop Search / Expanded Mobile Search */}
      <div
        className={cn(
          "flex items-center transition-all duration-300",
          isMobileExpanded
            ? "absolute right-0 w-[calc(100vw-80px)] sm:w-64 z-50 bg-white"
            : "hidden sm:flex sm:w-64"
        )}
      >
        <Search className="absolute left-3 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search events, photos, tags..."
          className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => {
          setIsMobileExpanded(!isMobileExpanded);
          if (!isMobileExpanded) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className={cn(
          "sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors",
          isMobileExpanded && "bg-gray-100 text-gray-900"
        )}
      >
        {isMobileExpanded ? <X size={20} /> : <Search size={20} />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/5 sm:hidden"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}
    </div>
  );
}
