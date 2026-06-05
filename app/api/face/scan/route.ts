import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Media from "@/models/Media";
import FaceMatch from "@/models/FaceMatch";
import Event from "@/models/Event";
import { searchFacesByImage } from "@/lib/rekognition";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { triggerNotification } from "@/lib/pusher";
import { successResponse, errorResponse } from "@/lib/api-response";

const scanningUsers = new Set<string>();

export async function scanAllPhotosForUser(userId: string, selfieBuffer: Buffer) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user?.rekognitionFaceId) return;

    let scanned = 0;
    let matched = 0;
    const batchSize = 20;

    // Find events where user is a member
    const userEvents = await Event.find({ "members.userId": userId }).select("_id");
    const userEventIds = userEvents.map(e => e._id);

    const mediaQuery: any = { type: "photo", eventId: { $in: userEventIds } };
    const total = await Media.countDocuments(mediaQuery);

    for (let skip = 0; skip < total; skip += batchSize) {
      const mediaItems = await Media.find(mediaQuery)
        .skip(skip)
        .limit(batchSize);

      for (const media of mediaItems) {
        try {
          const exists = await FaceMatch.findOne({ mediaId: media._id, userId });
          if (exists) {
            scanned++;
            continue;
          }

          const s3Res = await s3Client.send(
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: media.s3Key,
            })
          );

          const chunks: Uint8Array[] = [];
          for await (const chunk of s3Res.Body as any) chunks.push(chunk);
          const buf = Buffer.concat(chunks);

          const matches = await searchFacesByImage(buf);
          const myMatch = matches.find((m) => m.userId === userId);

          if (myMatch) {
            await FaceMatch.create({
              mediaId: media._id,
              userId,
              rekognitionFaceId: myMatch.faceId,
              confidence: myMatch.similarity,
              boundingBox: myMatch.boundingBox,
            });
            matched++;
          }
          scanned++;
        } catch (err) {
          console.error(`[scan] error on media ${media._id}:`, err);
          scanned++;
        }
      }
    }

    await triggerNotification(userId, {
      type: "scan_complete",
      message: `Scan complete! Found you in ${matched} photo${matched !== 1 ? "s" : ""}.`,
      matched,
    });
  } finally {
    scanningUsers.delete(userId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }
    const userId = session.user.id;

    await connectDB();
    const user = await User.findById(userId);

    if (!user?.rekognitionFaceId) {
      return errorResponse("You must enroll your face first.", 400);
    }

    if (scanningUsers.has(userId)) {
      return errorResponse("Scan already in progress", 409);
    }

    scanningUsers.add(userId);

    // We don't have the original selfie buffer here to pass to scanAllPhotosForUser.
    // Wait, scanAllPhotosForUser takes `selfieBuffer`, but it doesn't actually use it!
    // It calls `searchFacesByImage(buf)` where `buf` is the EVENT media buffer, 
    // and then looks for `userId` in the results. So `selfieBuffer` is entirely unused inside that function!
    // Let's pass an empty buffer.
    scanAllPhotosForUser(userId, Buffer.from("")).catch((err) => {
      console.error("Background scan failed:", err);
      scanningUsers.delete(userId);
    });

    return successResponse({ message: "Scan started. You will be notified when complete." }, 202);
  } catch (error) {
    console.error("POST /api/face/scan error:", error);
    return errorResponse("Failed to start scan", 500);
  }
}
