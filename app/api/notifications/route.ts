import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "@/lib/api-response";

// ─── GET: Fetch all notifications for current user ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorId", "name image")
        .lean(),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, read: false }),
    ]);

    return successResponse({
          notifications,
          unreadCount,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + notifications.length < total,
        });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return errorResponse("Failed to fetch notifications", 500);
  }
}

// ─── POST /api/notifications/read-all (handled separately below) ──────────────
// (see app/api/notifications/read-all/route.ts)
