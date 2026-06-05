import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Globe, Lock, Camera } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EventData } from "@/types";

const categoryColors: Record<string, string> = {
  photoshoot: "bg-pink-100 text-pink-700",
  workshop: "bg-blue-100 text-blue-700",
  trip: "bg-green-100 text-green-700",
  competition: "bg-orange-100 text-orange-700",
  cultural: "bg-purple-100 text-purple-700",
  party: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-600",
};

interface EventCardProps {
  event: EventData;
}

export default function EventCard({ event }: EventCardProps) {
  const creator =
    typeof event.createdBy === "object" ? event.createdBy : null;

  return (
    <Link
      href={`/events/${event._id}`}
      className="block group"
      id={`event-card-${event._id}`}
    >
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative aspect-video bg-gradient-to-br from-yellow-50 to-yellow-100 overflow-hidden">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={36} className="text-yellow-300" />
            </div>
          )}
          {/* Visibility Badge */}
          <div className="absolute top-3 right-3">
            {event.visibility === "public" ? (
              <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                <Globe size={10} /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                <Lock size={10} /> Private
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-0.5 rounded-full w-fit mb-2 capitalize",
              categoryColors[event.category] ?? categoryColors.other
            )}
          >
            {event.category}
          </span>

          {/* Event Name */}
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 group-hover:text-yellow-700 transition-colors line-clamp-2">
            {event.name}
          </h3>

          {/* Date */}
          <p className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
            <CalendarDays size={12} />
            {formatDate(event.date)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
            {/* Creator */}
            <div className="flex items-center gap-2">
              {creator?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creator.image}
                  alt={creator.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold text-[10px]">
                  {creator?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {creator?.name ?? "Unknown"}
              </span>
            </div>

            {/* Photo count */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Camera size={12} />
              <span>{event.photoCount ?? 0}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
