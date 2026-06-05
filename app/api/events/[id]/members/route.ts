import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";
import { getEventRole, canManageMembers } from "@/lib/permissions";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["club_admin", "club_member"]),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const validated = addMemberSchema.parse(body);

    const userToAdd = await User.findOne({ email: validated.email.toLowerCase() });
    if (!userToAdd) {
      return errorResponse("User not found", 404);
    }

    const userIdStr = userToAdd._id.toString();
    const alreadyMember = event.members.some(
      (m: any) => m.userId.toString() === userIdStr
    );

    if (alreadyMember) {
      return errorResponse("Already a member", 409);
    }

    event.members.push({ userId: userToAdd._id, role: validated.role });
    await event.save();

    await event.populate("members.userId", "name email image role");

    return successResponse(event.members);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("POST /api/events/[id]/members error:", error);
    return errorResponse("Failed to add member", 500);
  }
}
