"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  mediaId: string;
}

export default function DownloadButton({ mediaId }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memora-${mediaId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      id={`download-btn-${mediaId}`}
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-60"
      aria-label="Download with watermark"
    >
      {isDownloading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Download size={18} />
      )}
      <span>{isDownloading ? "Downloading…" : "Download"}</span>
    </button>
  );
}
