import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Media from "@/models/Media";
import { deleteS3Object, getS3Url } from "@/lib/s3";
import { updateEventSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { getEventRole, canManageMembers } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    const eventRole = getEventRole(event, session?.user?.id);
    const isGlobalAdmin = session?.user?.role === "admin";

    if (event.visibility === "private" && eventRole === "viewer" && !isGlobalAdmin) {
      return errorResponse("Access denied", 403);
    }

    await event.populate("createdBy", "name image role");

    const eventObj = event.toObject();

    if (eventRole === "club_admin" || eventRole === "club_member" || isGlobalAdmin) {
      await event.populate("members.userId", "name email image role");
      eventObj.members = event.toObject().members;
    } else {
      eventObj.members = [];
    }

    return successResponse(eventObj);
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return errorResponse("Failed to fetch event", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    await connectDB();

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse("Event not found", 404);
    }

    const eventRole = getEventRole(event, session.user.id);
    const isGlobalAdmin = session.user.role === "admin";

    if (!canManageMembers(eventRole, isGlobalAdmin)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validated = updateEventSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };

    if (validated.coverImageS3Key) {
      updateData.coverImageUrl = getS3Url(validated.coverImageS3Key);
    }

    const updated = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name image")
      .populate("members.userId", "name email image role");

    return successResponse(updated?.toObject());
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("PUT /api/events/[id] error:", error);
    return errorResponse("Failed to update event", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    await connectDB();

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse("Event not found", 404);
    }

    const eventRole = getEventRole(event, session.user.id);
    const isGlobalAdmin = session.user.role === "admin";

    if (!canManageMembers(eventRole, isGlobalAdmin)) {
      return errorResponse("Forbidden", 403);
    }

    // Delete all associated media and their S3 objects
    const mediaItems = await Media.find({ eventId: id });
    await Promise.allSettled(
      mediaItems.map((m) => deleteS3Object(m.s3Key))
    );
    await Media.deleteMany({ eventId: id });

    // Delete cover image from S3
    if (event.coverImageS3Key) {
      await deleteS3Object(event.coverImageS3Key).catch(() => {});
    }

    await Event.findByIdAndDelete(id);

    return successResponse({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return errorResponse("Failed to delete event", 500);
  }
}
