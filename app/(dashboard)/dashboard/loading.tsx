import { SkeletonText } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <SkeletonText className="w-64 h-8 mb-2" />
        <SkeletonText className="w-96 h-4" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-100 mb-4" />
            <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SkeletonText className="w-48 h-6" />
          <SkeletonText className="w-24 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
              <div className="aspect-video bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
                <div className="h-4 w-1/2 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
