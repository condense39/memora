import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const result = await Media.aggregate([
      { $match: { eventId: id as any } }, // the mongoose ObjectId cast will happen if we pass string, but just to be safe, wait, aggregate doesn't auto-cast.
    ]);
    
    // To be safe with aggregate casting:
    const mongoose = require("mongoose");
    const eventObjId = new mongoose.Types.ObjectId(id);

    const tagsResult = await Media.aggregate([
      { $match: { eventId: eventObjId } },
      { $unwind: "$aiTags" },
      { $group: { _id: "$aiTags" } },
      { $sort: { _id: 1 } },
    ]);

    const tags = tagsResult.map((t) => t._id);

    return successResponse({ tags });
  } catch (error) {
    console.error("GET /api/events/[id]/tags error:", error);
    return errorResponse("Failed to fetch tags", 500);
  }
}
