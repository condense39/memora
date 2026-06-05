import MediaCard from "./MediaCard";
import { SkeletonMediaCard } from "@/components/ui/Skeleton";
import type { MediaData } from "@/types";

interface MediaGridProps {
  media: MediaData[];
  eventId?: string;
  loading?: boolean;
  canUpload?: boolean;
  onUploadClick?: () => void;
  eventRole?: "club_admin" | "club_member" | "viewer" | null;
  currentUserId?: string;
  isGlobalAdmin?: boolean;
  selectedTag?: string;
}



export default function MediaGrid({
  media,
  eventId,
  loading = false,
  canUpload = false,
  onUploadClick,
  eventRole,
  currentUserId,
  isGlobalAdmin = false,
  selectedTag,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 masonry-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonMediaCard key={i} />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <span className="text-4xl">📷</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          No photos yet
        </h3>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          {canUpload
            ? "Be the first to share memories from this event."
            : "Photos will appear here once uploaded."}
        </p>
        {canUpload && onUploadClick && (
          <button
            onClick={onUploadClick}
            className="btn-primary"
            id="media-grid-upload-cta"
          >
            Upload Photos
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 masonry-grid">
      {media.map((item) => {
        // Evaluate delete permission locally in Grid
        const uploaderId = (item.uploadedBy as any)?._id
          ? (item.uploadedBy as any)._id.toString()
          : item.uploadedBy?.toString();
        
        let canDelete = false;
        if (isGlobalAdmin || eventRole === "club_admin") {
          canDelete = true;
        } else if (eventRole === "club_member" && uploaderId === currentUserId) {
          canDelete = true;
        }

        return (
          <div key={item._id} className="animate-fade-in">
            <MediaCard media={item} eventId={eventId} canDelete={canDelete} />
          </div>
        );
      })}
    </div>
  );
}
