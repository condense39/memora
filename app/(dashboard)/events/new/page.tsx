import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventForm from "@/components/events/EventForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Event",
};

export default async function NewEventPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          id="back-to-events"
        >
          <ArrowLeft size={16} />
          Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Fill in the details below to create a new event.
        </p>
      </div>

      {/* Form Card */}
      <div className="card p-6">
        <EventForm />
      </div>
    </div>
  );
}
