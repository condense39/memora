"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const notificationText = (type: string, actorName: string) => {
  switch (type) {
    case "like": return `${actorName} liked your photo`;
    case "comment": return `${actorName} commented on your photo`;
    case "tag": return `${actorName} tagged you in a comment`;
    case "face_match": return `${actorName} found you in a photo`;
    case "share": return `${actorName} shared your photo`;
    default: return `${actorName} interacted with your content`;
  }
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (n: (typeof notifications)[0]) => {
    await markOneRead(n._id);
    setIsOpen(false);
    const target = n.entityId ?? n.mediaId;
    if (target) router.push(`/media/${target}`);
  };

  const recentFive = notifications.slice(0, 5);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-full px-1 shadow-sm animate-fade-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllRead(); }}
                className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                id="mark-all-read-btn"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recentFive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell size={28} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              recentFive.map((n) => {
                const actorName =
                  (n.actorId as { name?: string } | undefined)?.name ??
                  n.actorName ??
                  "Someone";
                const actorImage =
                  (n.actorId as { image?: string } | undefined)?.image ??
                  n.actorImage;
                const thumb = n.mediaThumbnail;

                return (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0",
                      !n.read && "bg-yellow-50"
                    )}
                  >
                    {/* Actor avatar */}
                    {actorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={actorImage}
                        alt={actorName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-bold flex-shrink-0">
                        {getInitials(actorName)}
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                        {notificationText(n.type, actorName)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>

                    {/* Media thumbnail */}
                    {thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt="Media"
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center justify-center gap-1 transition-colors"
              id="view-all-notifications"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
