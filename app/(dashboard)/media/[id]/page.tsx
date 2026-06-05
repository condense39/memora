import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import Comment from "@/models/Comment";
import Event from "@/models/Event";
import { ArrowLeft, Download, Eye, Camera } from "lucide-react";
import LikeButton from "@/components/social/LikeButton";
import ShareButton from "@/components/social/ShareButton";
import CommentSection from "@/components/social/CommentSection";
import FavouriteButton from "@/components/social/FavouriteButton";
import DownloadButton from "@/components/social/DownloadButton";
import { formatRelativeTime, formatDateLong } from "@/lib/utils";
import type { Metadata } from "next";
import type mongoose from "mongoose";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Photo — Memora` };
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  await connectDB();

  const media = await Media.findById(id)
    .populate("uploadedBy", "name image role")
    .populate("eventId", "name visibility category")
    .lean();

  if (!media) notFound();

  const m = media as unknown as {
    _id: mongoose.Types.ObjectId;
    fileUrl: string;
    thumbnailUrl: string;
    type: string;
    s3Key: string;
    likes: mongoose.Types.ObjectId[];
    favouritedBy: mongoose.Types.ObjectId[];
    aiTags: string[];
    downloadCount: number;
    createdAt: string;
    uploadedBy: { _id: mongoose.Types.ObjectId; name: string; image?: string; role: string };
    eventId: { _id: mongoose.Types.ObjectId; name: string; visibility: string; category: string };
  };

  // Access check for private events
  const event = m.eventId;
  if (event?.visibility === "private" && !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-600">This photo is in a private event.</p>
        <Link href="/login" className="btn-primary">Sign in to view</Link>
      </div>
    );
  }

  const userId = session?.user?.id;
  const isLiked = userId
    ? m.likes.some((l: mongoose.Types.ObjectId) => l.toString() === userId)
    : false;
  const isFavourited = userId
    ? m.favouritedBy.some((f: mongoose.Types.ObjectId) => f.toString() === userId)
    : false;
  const isPublicEvent = event?.visibility === "public";

  // Fetch comments
  const rawComments = await Comment.find({ mediaId: id })
    .sort({ createdAt: 1 })
    .populate("userId", "name image")
    .populate("taggedUsers", "name image")
    .lean();

  const comments = rawComments as unknown as {
    _id: mongoose.Types.ObjectId;
    content: string;
    userId: { _id: mongoose.Types.ObjectId; name: string; image?: string };
    taggedUsers: { _id: mongoose.Types.ObjectId; name: string; image?: string }[];
    createdAt: string;
  }[];

  // Serialise for client components
  const serialisedComments = comments.map((c) => ({
    _id: c._id.toString(),
    content: c.content,
    createdAt: c.createdAt,
    userId: {
      _id: c.userId._id.toString(),
      name: c.userId.name,
      image: c.userId.image,
    },
    taggedUsers: c.taggedUsers.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      image: u.image,
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      {/* Back */}
      <Link
        href={event ? `/events/${m.eventId._id}` : "/events"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        id="media-detail-back"
      >
        <ArrowLeft size={16} />
        Back to {event?.name ?? "Events"}
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: Image ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Image display */}
          <div className="relative bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px]">
            {m.type === "video" ? (
              <video
                src={m.fileUrl}
                controls
                className="max-h-[80vh] w-full object-contain"
              />
            ) : (
              <Image
                src={m.fileUrl}
                alt="Photo"
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto mx-auto object-contain"
                priority
                unoptimized={m.fileUrl.includes("amazonaws.com")}
              />
            )}
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <LikeButton
              mediaId={id}
              initialLiked={isLiked}
              initialCount={m.likes.length}
            />
            <FavouriteButton
              mediaId={id}
              initialFavourited={isFavourited}
              initialCount={m.favouritedBy.length}
            />
            <ShareButton mediaId={id} isPublic={isPublicEvent} />
            {m.type !== "video" && (
              <DownloadButton mediaId={id} />
            )}
          </div>
        </div>

        {/* ── Right: Details ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Uploader */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              {m.uploadedBy.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.uploadedBy.image}
                  alt={m.uploadedBy.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                  {m.uploadedBy.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {m.uploadedBy.name}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {m.uploadedBy.role} · {formatRelativeTime(m.createdAt)}
                </p>
              </div>
            </div>

            {/* Event link */}
            {event && (
              <Link
                href={`/events/${m.eventId._id}`}
                className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800 font-medium bg-yellow-50 rounded-xl px-3 py-2 transition-colors"
                id="media-event-link"
              >
                <Camera size={14} />
                {event.name}
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="card p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-gray-900">{m.likes.length}</p>
                <p className="text-xs text-gray-400">Likes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-gray-900">{comments.length}</p>
                <p className="text-xs text-gray-400">Comments</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-center gap-1">
                  <Eye size={14} className="text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">{m.downloadCount}</p>
                <p className="text-xs text-gray-400">Downloads</p>
              </div>
            </div>
          </div>

          {/* AI Tags */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              AI Tags
            </h3>
            {m.aiTags && m.aiTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {m.aiTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/events/${m.eventId._id}?tag=${tag}`}
                    className="bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs font-medium hover:bg-yellow-200 transition cursor-pointer"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">
                Tags being generated...
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Comments{" "}
              <span className="text-gray-400 font-normal text-sm">
                ({comments.length})
              </span>
            </h3>
            <CommentSection
              mediaId={id}
              currentUserId={userId}
              currentUserRole={session?.user?.role}
              initialComments={serialisedComments}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
