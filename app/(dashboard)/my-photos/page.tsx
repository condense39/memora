import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SelfieEnrollmentCard from "./_components/SelfieEnrollmentCard";
import FaceMatchGallery from "@/components/face/FaceMatchGallery";

export const metadata: Metadata = { title: "My Photos" };

export default async function MyPhotosPage() {
  const session = await auth();
  if (!session?.user) return null;

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  
  // Safe cast since we know the schema
  const u = user as unknown as { selfieUrl?: string };
  const hasSelfie = !!u?.selfieUrl;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Photos</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Find yourself in event photos using AI facial recognition
        </p>
      </div>

      <SelfieEnrollmentCard initialSelfieUrl={u?.selfieUrl} />
      <FaceMatchGallery hasSelfie={hasSelfie} />
    </div>
  );
}
