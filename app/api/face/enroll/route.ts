import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ensureCollection, enrollFace, deleteFace } from "@/lib/rekognition";
import { s3Client, getS3Url, deleteS3Object } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Ensure background scan runs without blocking
async function triggerBackgroundScan(userId: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/face/scan`, {
      method: "POST",
      headers: {
        // We'd typically need to pass an auth token or secret here for server-to-server calls,
        // but for this MVP, the scan route can just use the session. Wait, the scan route uses `auth()`.
        // A server-to-server fetch won't have the session cookie.
        // Let's just import and call the function directly here to bypass auth issues.
      },
    });
  } catch (err) {
    console.error("Failed to trigger background scan:", err);
  }
}

// Actually, it's better to just import the scan function directly to avoid fetch auth issues.
// But we haven't created it yet. Let's create it inline or import it.
import { scanAllPhotosForUser } from "../scan/route";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }
    const userId = session.user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("Must be an image", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large (max 5MB)", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // 1. Ensure Rekognition collection exists
    await ensureCollection();

    // 2. Delete existing face from Rekognition
    if (user.rekognitionFaceId) {
      await deleteFace(user.rekognitionFaceId);
    }

    // 3. Delete existing selfie from S3
    if (user.selfieS3Key) {
      await deleteS3Object(user.selfieS3Key);
    }

    // 4. Upload new selfie to S3
    const key = `selfies/${userId}/${Date.now()}.jpg`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
    const selfieUrl = getS3Url(key);

    // 5. Enroll face in Rekognition
    const faceId = await enrollFace(buffer, userId);
    if (!faceId) {
      // If we uploaded it to S3 but it has no face, delete from S3
      await deleteS3Object(key);
      return errorResponse("No face detected. Please use a clear front-facing photo.", 400);
    }

    // 6. Update user in MongoDB
    await User.findByIdAndUpdate(userId, {
      rekognitionFaceId: faceId,
      selfieUrl,
      selfieS3Key: key,
    });

    // 7. Fire background scan
    scanAllPhotosForUser(userId, buffer).catch((err) =>
      console.error("Background scan failed:", err)
    );

    return successResponse({ success: true, selfieUrl }, 200);
  } catch (error: any) {
    console.error("POST /api/face/enroll error:", error);
    return errorResponse(error?.message || "Failed to enroll face", 500);
  }
}
