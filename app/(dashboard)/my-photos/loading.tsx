import { SkeletonText } from "@/components/ui/Skeleton";

export default function MyPhotosLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <SkeletonText className="w-48 h-8 mb-2" />
        <SkeletonText className="w-96 h-4" />
      </div>

      <div className="card p-6 border-yellow-200 bg-yellow-50/50 flex flex-col md:flex-row items-center gap-6 animate-pulse">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full border-4 border-white shadow-sm flex-shrink-0" />
        <div className="flex-1 text-center md:text-left space-y-3">
          <SkeletonText className="w-64 h-6" />
          <SkeletonText className="w-full max-w-md h-4" />
          <SkeletonText className="w-full max-w-sm h-4" />
        </div>
      </div>
    </div>
  );
}
