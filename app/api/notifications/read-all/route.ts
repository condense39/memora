import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    await connectDB();

    await Notification.updateMany(
      {
        recipientId: new mongoose.Types.ObjectId(session.user.id),
        read: false,
      },
      { $set: { read: true } }
    );

    return successResponse({ success: true });
  } catch (err) {
    console.error("POST /api/notifications/read-all error:", err);
    return errorResponse("Failed to mark all as read", 500);
  }
}
