import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import Notification from "@/models/Notification";
import { triggerNotification } from "@/lib/pusher";
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

    const media = await Media.findById(id).populate("uploadedBy", "name image");
    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = media.likes.some(
      (like: mongoose.Types.ObjectId) => like.toString() === userId
    );

    if (alreadyLiked) {
      // Unlike
      media.likes = media.likes.filter(
        (like: mongoose.Types.ObjectId) => like.toString() !== userId
      );
    } else {
      // Like
      media.likes.push(userObjId);

      // Only notify if not liking own media
      const uploaderId = (media.uploadedBy as unknown as { _id: mongoose.Types.ObjectId; name: string; image?: string })._id.toString();
      if (uploaderId !== userId) {
        // Create DB notification
        await Notification.create({
          recipientId: uploaderId,
          actorId: userId,
          type: "like",
          entityId: id,
          entityType: "media",
          read: false,
        });

        // Real-time push
        await triggerNotification(uploaderId, {
          type: "like",
          actorName: session.user.name ?? "Someone",
          actorImage: session.user.image ?? undefined,
          mediaId: id,
          mediaThumbnail: media.thumbnailUrl || media.fileUrl,
          message: `${session.user.name ?? "Someone"} liked your photo`,
        });
      }
    }

    await media.save();

    return successResponse({
          liked: !alreadyLiked,
          likeCount: media.likes.length,
        });
  } catch (err) {
    console.error("POST /api/media/[id]/like error:", err);
    return errorResponse("Failed to toggle like", 500);
  }
}
