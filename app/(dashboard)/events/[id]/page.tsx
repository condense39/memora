import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Media from "@/models/Media";
import MediaGrid from "@/components/media/MediaGrid";
import BulkUploader from "@/components/media/BulkUploader";
import EventMembersPanel from "./_components/EventMembersPanel";
import EventTagFilters from "./_components/EventTagFilters";
import {
  CalendarDays,
  Globe,
  Lock,
  ArrowLeft,
  Camera,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { formatDateLong, formatRelativeTime } from "@/lib/utils";
import { getEventRole, canUploadToEvent, canManageMembers } from "@/lib/permissions";
import type { EventData, MediaData, UserPublic } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tag?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const event = await Event.findById(id).lean();
  return {
    title: (event as { name?: string })?.name ?? "Event",
  };
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tag } = await searchParams;
  const session = await auth();

  await connectDB();

  const event = await Event.findById(id)
    .populate("createdBy", "name image role")
    .populate("members.userId", "name email image role")
    .lean();

  if (!event) notFound();

  const e = event as unknown as EventData;

  const currentUserId = session?.user?.id;
  const isGlobalAdmin = session?.user?.role === "admin";
  const eventRole = getEventRole(e, currentUserId);

  if (e.visibility === "private" && eventRole === "viewer" && !isGlobalAdmin) {
    if (!currentUserId) redirect("/login");
    redirect("/events");
  }

  // Fetch media
  const mediaVisibilityFilter: any =
    eventRole === "club_admin" || eventRole === "club_member" || isGlobalAdmin
      ? {}
      : { mediaVisibility: "public" };

  if (tag) {
    mediaVisibilityFilter.aiTags = { $in: [tag.toLowerCase()] };
  }

  const mediaRaw = await Media.find({ eventId: id, ...mediaVisibilityFilter })
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "name image")
    .lean();

  const media = JSON.parse(JSON.stringify(mediaRaw)) as MediaData[];

  const canUpload = canUploadToEvent(eventRole) || isGlobalAdmin;
  const canManage = canManageMembers(eventRole, isGlobalAdmin);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-yellow-100 to-yellow-200">
        {e.coverImageUrl && (
          <Image
            src={e.coverImageUrl}
            alt={e.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-category capitalize">{e.category}</span>
            {e.visibility === "public" ? (
              <span className="flex items-center gap-1 bg-green-100/90 text-green-700 text-xs px-2 py-0.5 rounded-full">
                <Globe size={10} /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-gray-100/90 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                <Lock size={10} /> Private
              </span>
            )}
            {eventRole === "club_admin" && (
              <span className="flex items-center gap-1 bg-yellow-100/90 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                <ShieldAlert size={10} /> Admin
              </span>
            )}
            {eventRole === "club_member" && (
              <span className="flex items-center gap-1 bg-gray-100/90 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                <Tag size={10} /> Member
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{e.name}</h1>
          <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatDateLong(e.date)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Media & Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          {canUpload && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Photos & Videos</h2>
              <BulkUploader eventId={id} />
            </div>
          )}

          {/* Media Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gallery</h2>
                <p className="text-sm text-gray-500">{media.length} item{media.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <EventTagFilters eventId={id} />

            <MediaGrid
              media={media}
              eventId={id}
              canUpload={false} // Handled by BulkUploader inline now
              eventRole={eventRole}
              currentUserId={currentUserId}
              isGlobalAdmin={isGlobalAdmin}
              selectedTag={tag}
            />
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Members Panel */}
          {canManage && (
            <EventMembersPanel eventId={id} initialMembers={JSON.parse(JSON.stringify(e.members || []))} />
          )}

          {/* Description */}
          {e.description && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{e.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Details</h3>

            {/* Created */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-gray-600">{formatRelativeTime(e.createdAt)}</p>
            </div>
          </div>

          {/* Tags */}
          {e.tags && e.tags.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                <Tag size={14} /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {e.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
