"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  mediaId: string;
  isPublic?: boolean;
}

export default function ShareButton({ mediaId, isPublic = false }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (shareUrl) return; // Already fetched

    setLoading(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/share`, { method: "POST" });
      const data = await res.json();
      setShareUrl(data.url);
      setExpires(data.expires);
    } catch {
      setShareUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative">
      <button
        id={`share-btn-${mediaId}`}
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm font-medium"
        aria-label="Share"
      >
        <Share2 size={18} />
        <span>Share</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Share Photo</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={28} className="animate-spin text-yellow-400" />
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1.5">
                    {isPublic ? "Direct link" : "Private link (expires in 24h)"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={shareUrl}
                      readOnly
                      onClick={() => inputRef.current?.select()}
                      className="input-field flex-1 text-sm font-mono bg-gray-50"
                    />
                    <button
                      id={`copy-share-link-${mediaId}`}
                      onClick={handleCopy}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        copied
                          ? "bg-green-100 text-green-700"
                          : "btn-primary"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check size={15} /> Copied!
                        </>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                </div>

                {expires && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    🔒 This link expires{" "}
                    {new Date(expires).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-500 text-sm text-center py-4">
                Failed to generate share link. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
