import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { updateProfileSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { name: validated.name },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("PUT /api/profile error:", error);
    return errorResponse("Failed to update profile", 500);
  }
}
