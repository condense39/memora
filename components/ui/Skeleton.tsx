import { cn } from "@/lib/utils";

export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 rounded bg-gray-100 animate-pulse", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video bg-gray-100 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="pt-2 flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMediaCard() {
  return (
    <div className="aspect-square rounded-xl bg-gray-100 animate-pulse overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200/50 to-transparent" />
    </div>
  );
}
