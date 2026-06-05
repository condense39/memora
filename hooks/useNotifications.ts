"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusherClient";
import type { NotificationPayload } from "@/lib/pusher";

export interface NotificationItem {
  _id: string;
  type: string;
  actorId?: {
    _id: string;
    name: string;
    image?: string;
  };
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: string;
  // From Pusher real-time (not persisted shape)
  actorName?: string;
  actorImage?: string;
  mediaId?: string;
  mediaThumbnail?: string;
  message?: string;
}

export function useNotifications() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Initial fetch
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setNotifications(data.notifications ?? []);
          setUnreadCount(data.unreadCount ?? 0);
          setHasMore(data.hasMore ?? false);
        }
      } catch {
        // silently fail — Pusher will still work
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNotifications();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Pusher subscription
  useEffect(() => {
    if (!session?.user?.id || !process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    let channel: ReturnType<typeof import("pusher-js").default.prototype.subscribe>;

    try {
      const pusher = getPusherClient();
      channel = pusher.subscribe(`private-user-${session.user.id}`);
      channel.bind("notification", (data: NotificationPayload) => {
        setUnreadCount((prev) => prev + 1);
        // Prepend as a lightweight notification item
        const item: NotificationItem = {
          _id: `realtime-${Date.now()}`,
          type: data.type,
          actorName: data.actorName,
          actorImage: data.actorImage,
          mediaId: data.mediaId,
          mediaThumbnail: data.mediaThumbnail,
          message: data.message,
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [item, ...prev]);
      });
    } catch {
      // Pusher not configured — silently skip
    }

    return () => {
      try {
        const pusher = getPusherClient();
        pusher.unsubscribe(`private-user-${session.user.id}`);
      } catch {}
    };
  }, [session?.user?.id]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id: string) => {
    if (id.startsWith("realtime-")) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return;
    }
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/notifications?page=${nextPage}`);
      const data = await res.json();
      setNotifications((prev) => [...prev, ...(data.notifications ?? [])]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch {}
  };

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAllRead,
    markOneRead,
    loadMore,
  };
}
