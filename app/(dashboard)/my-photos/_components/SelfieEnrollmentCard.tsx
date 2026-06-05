"use client";

import { useState } from "react";
import { ScanFace, Check, Loader2 } from "lucide-react";
import SelfieUploader from "@/components/face/SelfieUploader";
import toast from "react-hot-toast";

export default function SelfieEnrollmentCard({ initialSelfieUrl }: { initialSelfieUrl?: string }) {
  const [selfieUrl, setSelfieUrl] = useState<string | undefined>(initialSelfieUrl);
  const [isReEnrolling, setIsReEnrolling] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/face/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast("Scan already in progress. We'll notify you when it's done.", {
            icon: "⏳",
          });
        } else {
          throw new Error(data.error || "Failed to start scan");
        }
      } else {
        toast.success(data.message || "Scan started!");
      }
    } catch (err: any) {
      toast.error(err.message || "Error starting scan");
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnrollSuccess = (url: string) => {
    setSelfieUrl(url);
    setIsReEnrolling(false);
    toast.success("Face enrolled successfully!");
  };

  if (!selfieUrl || isReEnrolling) {
    return (
      <div className="card p-6 mb-8 border border-gray-100 shadow-sm rounded-2xl bg-white">
        {!isReEnrolling && (
          <div className="text-center mb-6 max-w-md mx-auto">
            <ScanFace className="text-yellow-400 w-16 h-16 mx-auto mb-4" />
            <h2 className="font-bold text-xl text-gray-900">Find yourself in event photos</h2>
            <p className="text-gray-500 text-sm mt-2">
              Upload a clear selfie and Memora will automatically find all photos you appear in across all events.
            </p>
          </div>
        )}
        <SelfieUploader onSuccess={handleEnrollSuccess} />
        
        {isReEnrolling && (
          <div className="text-center mt-4">
            <button onClick={() => setIsReEnrolling(false)} className="text-gray-500 text-sm hover:underline">
              Cancel re-enrollment
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-6 mb-8 border border-gray-100 shadow-sm rounded-2xl bg-white">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selfieUrl}
          alt="Your enrolled face"
          className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow-md flex-shrink-0"
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
            <Check size={16} />
            <span>Face enrolled</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Memora will automatically detect you in newly uploaded photos. You can also manually scan all past photos.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => setIsReEnrolling(true)}
              className="btn-secondary py-2 text-sm px-4"
              disabled={isScanning}
            >
              Re-enroll Face
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="btn-primary py-2 text-sm px-4 flex items-center gap-2"
            >
              {isScanning && <Loader2 size={16} className="animate-spin" />}
              {isScanning ? "Scanning..." : "Scan All Photos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
