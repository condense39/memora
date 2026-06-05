import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    await connectDB();

    const notification = await Notification.findById(id);
    if (!notification) {
      return errorResponse("Notification not found", 404);
    }

    if (notification.recipientId.toString() !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    notification.read = true;
    await notification.save();

    return successResponse({ success: true });
  } catch (err) {
    console.error("POST /api/notifications/[id]/read error:", err);
    return errorResponse("Failed to mark as read", 500);
  }
}
