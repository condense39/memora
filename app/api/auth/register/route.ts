import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = registerSchema.parse(body);

    await connectDB();

    // Check for existing user
    const existing = await User.findOne({
      email: validated.email.toLowerCase(),
    });

    if (existing) {
      return errorResponse("An account with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Create user
    const user = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    return successResponse({
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            },
          }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }

    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
