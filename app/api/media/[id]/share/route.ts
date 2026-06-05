import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import ShareToken from "@/models/ShareToken";
import { randomUUID } from "crypto";
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
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    await connectDB();

    const media = await Media.findById(id).populate("eventId", "visibility");
    if (!media) {
      return errorResponse("Media not found", 404);
    }

    const event = media.eventId as unknown as { visibility: string } | null;
    const isPublic = event?.visibility === "public";

    if (isPublic) {
      return successResponse({
              url: `${baseUrl}/media/${id}`,
              expires: null,
            });
    }

    // Private media — generate time-limited share token (24 h)
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await ShareToken.create({
      token,
      mediaId: id,
      createdBy: session.user.id,
      expiresAt,
    });

    return successResponse({
          url: `${baseUrl}/shared/${token}`,
          expires: expiresAt.toISOString(),
        });
  } catch (err) {
    console.error("POST /api/media/[id]/share error:", err);
    return errorResponse("Failed to generate share link", 500);
  }
}
