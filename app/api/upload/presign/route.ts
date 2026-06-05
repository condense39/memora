import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePresignedUploadUrl, generateS3Key, getS3Url } from "@/lib/s3";
import { presignSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validated = presignSchema.parse(body);

    const s3Key = generateS3Key(
      session.user.id,
      validated.eventId,
      validated.filename
    );

    const presignedUrl = await generatePresignedUploadUrl(
      s3Key,
      validated.contentType
    );

    const fileUrl = getS3Url(s3Key);

    return successResponse({
          presignedUrl,
          s3Key,
          fileUrl,
        });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }

    console.error("Presign error:", error);
    return errorResponse("Failed to generate upload URL", 500);
  }
}
