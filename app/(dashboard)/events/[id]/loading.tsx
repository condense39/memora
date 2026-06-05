import { SkeletonText, SkeletonMediaCard } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EventDetailLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-gray-500"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-64 bg-gray-100 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="flex gap-2 mb-2">
            <SkeletonText className="w-20 h-6 rounded-full" />
            <SkeletonText className="w-16 h-6 rounded-full" />
          </div>
          <SkeletonText className="w-64 h-10" />
          <SkeletonText className="w-40 h-4" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 animate-pulse h-40" />

          <div>
            <div className="mb-4">
              <SkeletonText className="w-32 h-6 mb-1" />
              <SkeletonText className="w-20 h-4" />
            </div>

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 masonry-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonMediaCard key={i} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 animate-pulse h-64" />
          <div className="card p-5 animate-pulse h-32" />
        </div>
      </div>
    </div>
  );
}
