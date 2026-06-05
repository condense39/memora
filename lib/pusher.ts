import PusherServer from "pusher";

// ─── Server-side Pusher instance ──────────────────────────────────────────────
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// ─── Notification payload type ────────────────────────────────────────────────
export interface NotificationPayload {
  type: "like" | "comment" | "tag" | "share" | "face_match" | "scan_complete";
  actorName?: string;
  actorImage?: string;
  mediaId?: string;
  mediaThumbnail?: string;
  message?: string;
  matched?: number;
}

// ─── Helper: trigger a notification to a specific user ────────────────────────
export async function triggerNotification(
  recipientId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    await pusherServer.trigger(
      `private-user-${recipientId}`,
      "notification",
      payload
    );
  } catch (err) {
    // Don't fail the request if Pusher is misconfigured
    console.warn("[Pusher] Failed to trigger notification:", err);
  }
}
