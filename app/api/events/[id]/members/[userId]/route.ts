import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { getEventRole, canManageMembers } from "@/lib/permissions";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

const updateMemberSchema = z.object({
  role: z.enum(["club_admin", "club_member"]),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, userId } = await params;
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
    const validated = updateMemberSchema.parse(body);

    const memberIndex = event.members.findIndex(
      (m: any) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return errorResponse("Member not found in event", 404);
    }

    // Prevent demoting the last club_admin
    if (validated.role === "club_member" && event.members[memberIndex].role === "club_admin") {
      const adminCount = event.members.filter((m: any) => m.role === "club_admin").length;
      if (adminCount <= 1) {
        return errorResponse("Cannot demote the only club admin", 400);
      }
    }

    event.members[memberIndex].role = validated.role;
    await event.save();

    await event.populate("members.userId", "name email image role");

    return successResponse(event.members);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("PATCH /api/events/[id]/members/[userId] error:", error);
    return errorResponse("Failed to update member", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, userId } = await params;
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

    const memberIndex = event.members.findIndex(
      (m: any) => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      return errorResponse("Member not found in event", 404);
    }

    // Prevent removing the last club_admin
    if (event.members[memberIndex].role === "club_admin") {
      const adminCount = event.members.filter((m: any) => m.role === "club_admin").length;
      if (adminCount <= 1) {
        return errorResponse("Cannot remove the only club admin", 400);
      }
    }

    event.members.splice(memberIndex, 1);
    await event.save();

    await event.populate("members.userId", "name email image role");

    return successResponse(event.members);
  } catch (error) {
    console.error("DELETE /api/events/[id]/members/[userId] error:", error);
    return errorResponse("Failed to remove member", 500);
  }
}
