import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return successResponse({ users: [] });
    }

    await connectDB();

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: session.user.id },
    })
      .select("name image email role")
      .limit(8)
      .lean();

    return successResponse({ users });
  } catch (err) {
    console.error("GET /api/users/search error:", err);
    return errorResponse("Search failed", 500);
  }
}
