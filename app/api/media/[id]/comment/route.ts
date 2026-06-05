import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import Comment from "@/models/Comment";
import Notification from "@/models/Notification";
import { triggerNotification } from "@/lib/pusher";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "@/lib/api-response";

// ─── GET: List comments for a media item ─────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    await connectDB();

    const comments = await Comment.find({ mediaId: id })
      .sort({ createdAt: 1 })
      .populate("userId", "name image")
      .populate("taggedUsers", "name image")
      .lean();

    return successResponse({ comments });
  } catch (err) {
    console.error("GET /api/media/[id]/comment error:", err);
    return errorResponse("Failed to fetch comments", 500);
  }
}

// ─── POST: Create a comment ───────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: mediaId } = await params;
    const userId = session.user.id;

    const body = await req.json();
    const content = (body.content ?? "").trim();
    const taggedUserIds: string[] = (body.taggedUserIds ?? []).slice(0, 5);

    if (!content) {
      return errorResponse("Comment cannot be empty", 400);
    }
    if (content.length > 500) {
      return errorResponse("Comment too long (max 500 chars)", 400);
    }

    await connectDB();

    const media = await Media.findById(mediaId).populate("uploadedBy", "name image");
    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const uploadedBy = media.uploadedBy as unknown as { _id: mongoose.Types.ObjectId; name: string; image?: string };

    // Create comment
    const comment = await Comment.create({
      mediaId,
      userId,
      content,
      taggedUsers: taggedUserIds.map((uid) => new mongoose.Types.ObjectId(uid)),
    });

    await Media.findByIdAndUpdate(mediaId, { $inc: { commentCount: 1 } });

    const populated = await comment.populate([
      { path: "userId", select: "name image" },
      { path: "taggedUsers", select: "name image" },
    ]);

    // Notify media uploader (if not the commenter)
    const uploaderId = uploadedBy._id.toString();
    if (uploaderId !== userId) {
      await Notification.create({
        recipientId: uploaderId,
        actorId: userId,
        type: "comment",
        entityId: mediaId,
        entityType: "media",
        read: false,
      });

      await triggerNotification(uploaderId, {
        type: "comment",
        actorName: session.user.name ?? "Someone",
        actorImage: session.user.image ?? undefined,
        mediaId,
        mediaThumbnail: media.thumbnailUrl || media.fileUrl,
        message: `${session.user.name ?? "Someone"} commented on your photo`,
      });
    }

    // Notify tagged users
    for (const taggedId of taggedUserIds) {
      if (taggedId !== userId) {
        await Notification.create({
          recipientId: taggedId,
          actorId: userId,
          type: "tag",
          entityId: mediaId,
          entityType: "media",
          read: false,
        });

        await triggerNotification(taggedId, {
          type: "tag",
          actorName: session.user.name ?? "Someone",
          actorImage: session.user.image ?? undefined,
          mediaId,
          mediaThumbnail: media.thumbnailUrl || media.fileUrl,
          message: `${session.user.name ?? "Someone"} tagged you in a comment`,
        });
      }
    }

    return successResponse({ comment: populated }, 201);
  } catch (err) {
    console.error("POST /api/media/[id]/comment error:", err);
    return errorResponse("Failed to post comment", 500);
  }
}

// ─── DELETE: Delete a comment ─────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: mediaId } = await params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return errorResponse("commentId is required", 400);
    }

    await connectDB();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    const isAuthor = comment.userId.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return errorResponse("Forbidden", 403);
    }

    await Comment.findByIdAndDelete(commentId);
    await Media.findByIdAndUpdate(mediaId, { $inc: { commentCount: -1 } });

    return successResponse({ success: true });
  } catch (err) {
    console.error("DELETE /api/media/[id]/comment error:", err);
    return errorResponse("Failed to delete comment", 500);
  }
}
