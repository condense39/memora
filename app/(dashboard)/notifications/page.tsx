"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

function groupByDate(items: NotificationItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const item of items) {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) {
      groups[0].items.push(item);
    } else if (d.getTime() === yesterday.getTime()) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

const notificationMessage = (n: NotificationItem): string => {
  const name =
    (n.actorId as { name?: string } | undefined)?.name ?? n.actorName ?? "Someone";
  switch (n.type) {
    case "like": return `${name} liked your photo`;
    case "comment": return `${name} commented on your photo`;
    case "tag": return `${name} tagged you in a comment`;
    case "face_match": return `${name} found you in a photo`;
    case "share": return `${name} shared your photo`;
    default: return `${name} interacted with your content`;
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAllRead,
    markOneRead,
    loadMore,
  } = useNotifications();

  const groups = groupByDate(notifications);

  const handleClick = async (n: NotificationItem) => {
    await markOneRead(n._id);
    const target = n.entityId ?? n.mediaId;
    if (target) router.push(`/media/${target}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            id="mark-all-read-page-btn"
            onClick={markAllRead}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-yellow-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mb-5">
            <Bell size={36} className="text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No notifications yet</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            When someone likes, comments, or tags you — you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Date group header */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {group.label}
              </p>

              <div className="space-y-2">
                {group.items.map((n) => {
                  const actorImage =
                    (n.actorId as { image?: string } | undefined)?.image ??
                    n.actorImage;
                  const actorName =
                    (n.actorId as { name?: string } | undefined)?.name ??
                    n.actorName ??
                    "Someone";
                  const thumb = n.mediaThumbnail;

                  return (
                    <button
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 text-left hover:shadow-sm",
                        !n.read
                          ? "bg-yellow-50 border-l-4 border-yellow-400 border-t-yellow-100 border-r-yellow-100 border-b-yellow-100"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      {/* Actor avatar */}
                      {actorImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={actorImage}
                          alt={actorName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                          {getInitials(actorName)}
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">
                          {notificationMessage(n)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>

                      {/* Thumbnail */}
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt="Media"
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                id="load-more-notifications"
                onClick={loadMore}
                className="btn-secondary px-6 py-2 text-sm"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
