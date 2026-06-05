import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Media from "@/models/Media";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const tag = searchParams.get("tag");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    
    if (!q && !tag) {
      return errorResponse("Search query or tag is required", 400);
    }

    await connectDB();

    const skip = (page - 1) * limit;
    let eventsResult: any[] = [];
    let mediaResult: any[] = [];
    let totalEvents = 0;
    let totalMedia = 0;

    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    const userId = session?.user?.id;

    // Search Events
    if ((type === "events" || type === "all") && q) {
      const eventQuery: any = {
        $text: { $search: q },
        $or: [
          { visibility: "public" }
        ],
        ...dateFilter
      };

      if (userId) {
        eventQuery.$or.push({ "members.userId": userId });
        eventQuery.$or.push({ createdBy: userId });
      }

      eventsResult = await Event.find(eventQuery)
        .select({ score: { $meta: "textScore" }, name: 1, description: 1, category: 1, date: 1, coverImageUrl: 1, visibility: 1, createdBy: 1 })
        .populate("createdBy", "name image")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit)
        .lean();
        
      totalEvents = await Event.countDocuments(eventQuery);
    }

    // Search Media
    if (type === "media" || type === "all") {
      let accessibleEventIds: string[] = [];
      let memberEventIds: string[] = [];

      if (userId) {
        // Find events user is a member of
        const userEvents = await Event.find({
          $or: [
            { "members.userId": userId },
            { createdBy: userId }
          ]
        }).select("_id");
        memberEventIds = userEvents.map(e => e._id.toString());
        
        // Find all public events
        const publicEvents = await Event.find({ visibility: "public" }).select("_id");
        accessibleEventIds = [...new Set([...memberEventIds, ...publicEvents.map(e => e._id.toString())])];
      } else {
        const publicEvents = await Event.find({ visibility: "public" }).select("_id");
        accessibleEventIds = publicEvents.map(e => e._id.toString());
      }

      let mediaQuery: any = {
        ...dateFilter
      };

      if (tag && !q) {
        // Tag-only search (exact match on array)
        mediaQuery.aiTags = { $in: [tag.toLowerCase()] };
      } else if (q) {
        // Text search
        mediaQuery.$text = { $search: q };
      }

      // Permissions filter for media
      mediaQuery.eventId = { $in: accessibleEventIds };
      mediaQuery.$or = [
        { mediaVisibility: "public" },
        { eventId: { $in: memberEventIds } } // private ok if member
      ];

      let mediaQueryBuilder = Media.find(mediaQuery);
      if (q) {
        mediaQueryBuilder = mediaQueryBuilder.select({ score: { $meta: "textScore" }, fileUrl: 1, thumbnailUrl: 1, aiTags: 1, eventId: 1, uploadedBy: 1, createdAt: 1 }) as any;
      }
      mediaQueryBuilder = mediaQueryBuilder
        .populate("uploadedBy", "name image")
        .populate("eventId", "name")
        .skip(skip)
        .limit(limit);
        
      if (q) {
        mediaQueryBuilder.sort({ score: { $meta: "textScore" } });
      } else {
        mediaQueryBuilder.sort({ createdAt: -1 });
      }

      mediaResult = await mediaQueryBuilder.lean();
      totalMedia = await Media.countDocuments(mediaQuery);
    }

    return successResponse({
          events: eventsResult,
          media: mediaResult,
          total: totalEvents + totalMedia,
          page,
          totalPages: Math.ceil((totalEvents + totalMedia) / limit),
        });

  } catch (error: any) {
    console.error("GET /api/search error:", error);
    return errorResponse(error.message || "Failed to search", 500);
  }
}
