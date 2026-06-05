import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
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
    const userId = session.user.id;

    await connectDB();

    const media = await Media.findById(id);
    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyFavourited = media.favouritedBy.some(
      (uid: mongoose.Types.ObjectId) => uid.toString() === userId
    );

    if (alreadyFavourited) {
      media.favouritedBy = media.favouritedBy.filter(
        (uid: mongoose.Types.ObjectId) => uid.toString() !== userId
      );
    } else {
      media.favouritedBy.push(userObjId);
    }

    await media.save();

    return successResponse({
          favourited: !alreadyFavourited,
          count: media.favouritedBy.length,
        });
  } catch (err) {
    console.error("POST /api/media/[id]/favourite error:", err);
    return errorResponse("Failed to toggle favourite", 500);
  }
}
