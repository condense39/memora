import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { getS3Url } from "@/lib/s3";
import { createEventSchema } from "@/types/schemas";
import { ZodError } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "date";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (session?.user) {
      // Authenticated: public events OR private events user is member of or created
      query.$or = [
        { visibility: "public" },
        { createdBy: session.user.id },
        { "members.userId": session.user.id },
      ];
    } else {
      // Unauthenticated: only public events
      query.visibility = "public";
    }

    if (category) {
      query.category = category;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      date: { date: -1 },
      "-date": { date: 1 },
      name: { name: 1 },
      "-name": { name: -1 },
    };
    const sortOption = sortMap[sort] ?? { date: -1 };

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name image")
        .lean(),
      Event.countDocuments(query),
    ]);

    return successResponse({
          events,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return errorResponse("Failed to fetch events", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    // Any logged-in user can create an event

    const body = await req.json();
    const validated = createEventSchema.parse(body);

    await connectDB();

    const eventData: Record<string, unknown> = {
      ...validated,
      createdBy: session.user.id,
      members: [{ userId: session.user.id, role: "club_admin" }],
    };

    if (validated.coverImageS3Key) {
      eventData.coverImageUrl = getS3Url(validated.coverImageS3Key);
    }

    const event = await Event.create(eventData);
    await event.populate("createdBy", "name image");

    return successResponse(event.toObject(), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("Validation failed", 400);
    }

    console.error("POST /api/events error:", error);
    return errorResponse("Failed to create event", 500);
  }
}
