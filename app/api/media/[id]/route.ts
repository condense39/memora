import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import { deleteS3Object } from "@/lib/s3";
import Event from "@/models/Event";
import { getEventRole, canDeleteMedia } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    await connectDB();

    const media = await Media.findById(id);
    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const event = await Event.findById(media.eventId);
    const eventRole = event ? getEventRole(event, session.user.id) : null;
    const isGlobalAdmin = session.user.role === "admin";

    if (!canDeleteMedia(media, session.user.id, eventRole, isGlobalAdmin)) {
      return errorResponse("Forbidden", 403);
    }

    // Delete from S3
    await deleteS3Object(media.s3Key);

    // Delete from database
    await Media.findByIdAndDelete(id);

    return successResponse({ success: true });
  } catch (error) {
    console.error("DELETE /api/media/[id] error:", error);
    return errorResponse("Failed to delete media", 500);
  }
}
