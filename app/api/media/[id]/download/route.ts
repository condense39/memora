import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { applyWatermark } from "@/lib/watermark";
import { Readable } from "stream";
import { successResponse, errorResponse } from "@/lib/api-response";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

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

    const media = await Media.findById(id)
      .populate("eventId", "name visibility")
      .populate("uploadedBy", "name");

    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const event = media.eventId as unknown as { name: string; visibility: string } | null;
    const uploader = media.uploadedBy as unknown as { name: string } | null;

    // Increment download counter
    await Media.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

    // Fetch image buffer from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: media.s3Key,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return errorResponse("File not found in storage", 404);
    }

    const rawBuffer = await streamToBuffer(s3Response.Body as Readable);

    // Apply watermark
    const watermarked = await applyWatermark(
      rawBuffer,
      event?.name ?? "Memora Event",
      uploader?.name ?? "Memora"
    );

    return new NextResponse(watermarked as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="memora-${id}.jpg"`,
        "Content-Length": String(watermarked.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/media/[id]/download error:", err);
    return errorResponse("Failed to download media", 500);
  }
}
