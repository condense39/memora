import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FaceMatch from "@/models/FaceMatch";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const skip = (page - 1) * limit;

    await connectDB();

    const [matches, total] = await Promise.all([
      FaceMatch.find({ userId: session.user.id })
        .populate({
          path: "mediaId",
          populate: { path: "eventId", select: "name" },
        })
        .sort({ confidence: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FaceMatch.countDocuments({ userId: session.user.id }),
    ]);

    return successResponse({
          matches,
          total,
          page,
          hasMore: skip + limit < total,
        });
  } catch (error) {
    console.error("GET /api/face/match error:", error);
    return errorResponse("Failed to fetch face matches", 500);
  }
}
