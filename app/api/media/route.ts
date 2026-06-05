import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Media from "@/models/Media";
import { getS3Url } from "@/lib/s3";
import { createMediaSchema } from "@/types/schemas";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { getEventRole, canUploadToEvent, canViewMedia } from "@/lib/permissions";
import { getImageTags } from "@/lib/vision";
import { searchFacesByImage } from "@/lib/rekognition";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import User from "@/models/User";
import FaceMatch from "@/models/FaceMatch";
import Notification from "@/models/Notification";
import { triggerNotification } from "@/lib/pusher";
import { successResponse, errorResponse } from "@/lib/api-response";

async function processMediaAsync(mediaId: string, fileUrl: string, s3Key: string, eventId: string) {
  try {
    // Step 1: Auto-tag with Google Vision
    try {
      const tags = await getImageTags(fileUrl);
      if (tags.length > 0) {
        await Media.findByIdAndUpdate(mediaId, { aiTags: tags });
      }
    } catch (tagErr) {
      console.error("[processMediaAsync] Vision error:", tagErr);
    }

    // Step 2: Facial recognition
    try {
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: s3Key,
        })
      );
      
      const chunks: Uint8Array[] = [];
      for await (const chunk of s3Response.Body as any) {
        chunks.push(chunk);
      }
      const imageBuffer = Buffer.concat(chunks);

      const matches = await searchFacesByImage(imageBuffer);

      const event = await Event.findById(eventId).lean();
      
      for (const match of matches) {
        const matchedUser = await User.findById(match.userId);
        if (!matchedUser || !event) continue;

        const role = getEventRole(event, matchedUser._id.toString());
        if (role !== "club_admin" && role !== "club_member") {
          continue; // User is not an admin or member of this event
        }

        const existing = await FaceMatch.findOne({
          mediaId,
          userId: matchedUser._id,
        });
        if (existing) continue;

        await FaceMatch.create({
          mediaId,
          userId: matchedUser._id,
          rekognitionFaceId: match.faceId,
          confidence: match.similarity,
          boundingBox: match.boundingBox,
        });

        await Notification.create({
          recipientId: matchedUser._id,
          actorId: matchedUser._id,
          type: "face_match",
          entityId: mediaId,
          entityType: "media",
        });

        await triggerNotification(matchedUser._id.toString(), {
          type: "face_match",
          message: "You were found in a new photo!",
          mediaId,
        });
      }
    } catch (rekogErr) {
      console.error("[processMediaAsync] Rekognition error:", rekogErr);
    }
  } catch (err) {
    console.error("[processMediaAsync] error:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId");
    const favourites = searchParams.get("favourites") === "true";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const sort = searchParams.get("sort") ?? "-createdAt";
    const tag = searchParams.get("tag");

    await connectDB();

    // ── Favourites mode: return all media favourited by current user ──────────
    if (favourites) {
      if (!session?.user) {
        return errorResponse("Unauthorized", 401);
      }

      const userId = new mongoose.Types.ObjectId(session.user.id);

      const sortOption = sort.startsWith("-")
        ? { [sort.slice(1)]: -1 as const }
        : { [sort]: 1 as const };

      const skip = (page - 1) * limit;

      const [media, total] = await Promise.all([
        Media.find({ favouritedBy: userId })
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .populate("uploadedBy", "name image")
          .populate("eventId", "name")
          .lean(),
        Media.countDocuments({ favouritedBy: userId }),
      ]);

      return successResponse({
              media,
              total,
              page,
              totalPages: Math.ceil(total / limit),
            });
    }

    // ── Normal mode: requires eventId ─────────────────────────────────────────
    if (!eventId) {
      return errorResponse("eventId is required", 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return errorResponse("Event not found", 404);
    }

    const eventRole = getEventRole(event, session?.user?.id);
    const isGlobalAdmin = session?.user?.role === "admin";

    if (event.visibility === "private" && eventRole === "viewer" && !isGlobalAdmin) {
      return errorResponse("Access denied", 403);
    }

    const sortOption = sort.startsWith("-")
      ? { [sort.slice(1)]: -1 as const }
      : { [sort]: 1 as const };

    const skip = (page - 1) * limit;

    // Filter media by visibility
    const visibilityFilter: Record<string, string> =
      eventRole === "club_admin" || eventRole === "club_member" || isGlobalAdmin
        ? {} // can see both public and private
        : { mediaVisibility: "public" }; // only public

    const query: any = { eventId, ...visibilityFilter };
    if (tag) {
      query.aiTags = { $in: [tag.toLowerCase()] };
    }

    const [media, total] = await Promise.all([
      Media.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name image")
        .lean(),
      Media.countDocuments(query),
    ]);

    return successResponse({
          media,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return errorResponse("Failed to fetch media", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validated = createMediaSchema.parse(body);

    await connectDB();

    const event = await Event.findById(validated.eventId);
    if (!event) {
      return errorResponse("Event not found", 404);
    }

    const eventRole = getEventRole(event, session.user.id);
    const isGlobalAdmin = session.user.role === "admin";

    if (!canUploadToEvent(eventRole) && !isGlobalAdmin) {
      return errorResponse("You do not have permission to upload to this event", 403);
    }

    const fileUrl = getS3Url(validated.s3Key);

    const media = await Media.create({
      ...validated,
      fileUrl,
      thumbnailUrl: fileUrl, // Same as fileUrl for now, resizing in Prompt 3
      uploadedBy: session.user.id,
    });

    await media.populate("uploadedBy", "name image");

    // Process AI tags and faces in the background
    processMediaAsync(media._id.toString(), media.fileUrl, media.s3Key, media.eventId.toString());

    return successResponse(media.toObject(), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }
    console.error("POST /api/media error:", error);
    return errorResponse("Failed to save media", 500);
  }
}
