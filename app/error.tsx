"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Something went wrong!</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            We apologize for the inconvenience. An unexpected error has occurred while processing your request.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 overflow-x-auto">
          <p className="text-xs text-red-600 font-mono break-words">
            {error.message || "Unknown Application Error"}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono mt-1 mt-2">
              Digest ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => reset()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
