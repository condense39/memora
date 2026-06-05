import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import Media from "@/models/Media";
import EventGrid from "@/components/events/EventGrid";
import {
  CalendarDays,
  Camera,
  Heart,
  Sparkles,
  Upload,
  ArrowRight,
} from "lucide-react";
import { getGreeting } from "@/lib/utils";
import type { EventData, DashboardStats } from "@/types";

async function getDashboardData(userId: string) {
  await connectDB();

  const [totalEvents, totalPhotos, likesData, recentEvents] = await Promise.all(
    [
      Event.countDocuments({ createdBy: userId }),
      Media.countDocuments({ uploadedBy: userId }),
      Media.aggregate([
        { $match: { uploadedBy: userId } },
        { $project: { likeCount: { $size: "$likes" } } },
        { $group: { _id: null, total: { $sum: "$likeCount" } } },
      ]),
      Event.find({
        $or: [{ createdBy: userId }, { memberIds: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("createdBy", "name image")
        .lean(),
    ]
  );

  const totalLikes = likesData[0]?.total ?? 0;

  return {
    stats: {
      totalEvents,
      totalPhotos,
      totalLikes,
      totalMatches: 0,
    } as DashboardStats,
    recentEvents: recentEvents as unknown as EventData[],
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { stats, recentEvents } = await getDashboardData(session.user.id);
  const greeting = getGreeting();

  const statCards = [
    {
      label: "Total Events",
      value: stats.totalEvents,
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-50",
      id: "stat-events",
    },
    {
      label: "Total Photos",
      value: stats.totalPhotos,
      icon: Camera,
      color: "text-green-500",
      bg: "bg-green-50",
      id: "stat-photos",
    },
    {
      label: "Likes Received",
      value: stats.totalLikes,
      icon: Heart,
      color: "text-pink-500",
      bg: "bg-pink-50",
      id: "stat-likes",
    },
    {
      label: "My Matches",
      value: stats.totalMatches,
      icon: Sparkles,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      id: "stat-matches",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Here&apos;s what&apos;s happening with your memories.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            id={card.id}
            className={`card p-6 animate-fade-in stagger-${i + 1}`}
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-gray-500 text-sm mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Recent Events
          </h2>
          <Link
            href="/events"
            className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
            id="view-all-events-link"
          >
            View All Events <ArrowRight size={14} />
          </Link>
        </div>
        <EventGrid events={recentEvents} />
      </div>

      {/* Quick Upload CTA */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Ready to upload? 🚀</h3>
          <p className="text-gray-600 text-sm mt-0.5">
            Add photos to your events and share your memories.
          </p>
        </div>
        <Link
          href="/events"
          className="btn-primary flex items-center gap-2 flex-shrink-0"
          id="dashboard-upload-cta"
        >
          <Upload size={16} />
          Upload Photos
        </Link>
      </div>
    </div>
  );
}
