import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-yellow-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-gray-800">Page not found</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or didn&apos;t exist in the first place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/events"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            View Events
          </Link>
        </div>
      </div>
    </div>
  );
}
