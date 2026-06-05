import EventCard from "./EventCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { EventData } from "@/types";

interface EventGridProps {
  events: EventData[];
  loading?: boolean;
}



export default function EventGrid({ events, loading = false }: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          No events yet
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Create your first event to start organizing your memories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event, idx) => (
        <div
          key={event._id}
          className={`animate-fade-in stagger-${Math.min(idx + 1, 4)}`}
        >
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}
