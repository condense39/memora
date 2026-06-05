"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import EventGrid from "@/components/events/EventGrid";
import type { EventData, EventCategory } from "@/types";

const categories: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "photoshoot", label: "Photoshoot" },
  { value: "workshop", label: "Workshop" },
  { value: "trip", label: "Trip" },
  { value: "competition", label: "Competition" },
  { value: "cultural", label: "Cultural" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "date", label: "Newest First" },
  { value: "-date", label: "Oldest First" },
  { value: "name", label: "Name (A→Z)" },
  { value: "-name", label: "Name (Z→A)" },
];

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");

  const canCreate = !!session?.user;

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        params.set("limit", "50");

        const res = await fetch(`/api/events?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [category, sort]);

  // Client-side filtering for search and visibility
  const safeEvents = Array.isArray(events) ? events : [];
  const filteredEvents = safeEvents.filter((event) => {
    const matchesSearch =
      !search ||
      event?.name?.toLowerCase().includes(search.toLowerCase()) ||
      event?.description?.toLowerCase().includes(search.toLowerCase());

    const matchesVisibility =
      visibility === "all" || event?.visibility === visibility;

    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
          </p>
        </div>
        {canCreate && (
          <Link
            href="/events/new"
            id="new-event-btn"
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            New Event
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="events-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="input-field pl-9"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          {/* Category */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              id="events-category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-gray-700"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            id="events-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-gray-700"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Visibility Toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {(["all", "public", "private"] as const).map((v) => (
              <button
                key={v}
                id={`visibility-filter-${v}`}
                onClick={() => setVisibility(v)}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  visibility === v
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Grid */}
      <EventGrid events={filteredEvents} loading={loading} />
    </div>
  );
}
