"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import BulkUploader from "@/components/media/BulkUploader";
import { useRouter } from "next/navigation";

interface UploadModalWrapperProps {
  eventId: string;
}

export default function UploadModalWrapper({ eventId }: UploadModalWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleComplete = () => {
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        id="event-upload-photos-btn"
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Upload size={16} />
        Upload Photos
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Photos
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <BulkUploader
              eventId={eventId}
              onComplete={handleComplete}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
