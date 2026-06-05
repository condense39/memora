import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { changePasswordSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validated = changePasswordSchema.parse(body);

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user || !user.password) {
      return errorResponse("Password change not available for this account", 400);
    }

    const isValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isValid) {
      return errorResponse("Current password is incorrect", 400);
    }

    const hashed = await bcrypt.hash(validated.newPassword, 12);
    user.password = hashed;
    await user.save();

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("PUT /api/profile/password error:", error);
    return errorResponse("Failed to update password", 500);
  }
}
