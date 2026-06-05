"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import type { UploadFileItem } from "@/types";

interface BulkUploaderProps {
  eventId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function BulkUploader({
  eventId,
  onComplete,
  onClose,
}: BulkUploaderProps) {
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newItems: UploadFileItem[] = accepted.map((file) => ({
      file,
      id: generateId(),
      preview: URL.createObjectURL(file),
      status: "pending",
      mediaVisibility: "public",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const setFileVisibility = (id: string, visibility: "public" | "private") => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, mediaVisibility: visibility } : f))
    );
  };

  const uploadSingleFile = async (item: UploadFileItem): Promise<void> => {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
    );

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type,
          eventId,
        }),
      });

      if (!presignRes.ok) throw new Error("Failed to get presigned URL");

      const { presignedUrl, s3Key, fileUrl } = await presignRes.json();

      // Step 2: Upload to S3 via XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress } : f))
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", item.file.type);
        xhr.send(item.file);
      });

      // Step 3: Save media record
      const mediaRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key,
          eventId,
          type: item.file.type.startsWith("video/") ? "video" : "photo",
          mediaVisibility: item.mediaVisibility,
          size: item.file.size,
        }),
      });

      if (!mediaRes.ok) throw new Error("Failed to save media record");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "done", progress: 100, s3Key, fileUrl }
            : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: "error",
                errorMessage:
                  err instanceof Error ? err.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Upload concurrently (max 3 at a time)
    const chunks: UploadFileItem[][] = [];
    for (let i = 0; i < pendingFiles.length; i += 3) {
      chunks.push(pendingFiles.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(uploadSingleFile));
    }

    const updatedFiles = files;
    const successCount = updatedFiles.filter(f => f.status === "done").length;
    const errorCount = updatedFiles.filter(f => f.status === "error").length;

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} item${successCount !== 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} item${errorCount !== 1 ? 's' : ''}`);
    }

    setIsUploading(false);

    if (errorCount === 0 && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const totalCount = files.length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-yellow-500 bg-yellow-100 scale-[0.99]"
            : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400"
        )}
      >
        <input {...getInputProps()} id="bulk-uploader-input" />
        <CloudUpload
          size={48}
          className={cn(
            "mx-auto mb-3 transition-colors",
            isDragActive ? "text-yellow-500" : "text-yellow-400"
          )}
        />
        <p className="text-gray-700 font-medium">
          {isDragActive ? "Drop your files here!" : "Drop photos here or click to browse"}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Supports JPG, PNG, WEBP, MP4 · Multiple files allowed
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {files.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 group"
            >
              {/* Thumbnail */}
              {item.file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-500">VID</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-400">{formatFileSize(item.file.size)}</p>

                {/* Progress bar */}
                {(item.status === "uploading" || item.status === "done") && (
                  <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        item.status === "done" ? "bg-green-400" : "bg-yellow-400"
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                
                {item.status === "pending" && (
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => setFileVisibility(item.id, "public")}
                      className={
                        item.mediaVisibility === "public"
                          ? "bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-medium"
                          : "bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full"
                      }
                    >
                      Public
                    </button>
                    <button
                      onClick={() => setFileVisibility(item.id, "private")}
                      className={
                        item.mediaVisibility === "private"
                          ? "bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full font-medium"
                          : "bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full"
                      }
                    >
                      🔒 Private
                    </button>
                  </div>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {item.status === "pending" && (
                  <button
                    onClick={() => removeFile(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
                {item.status === "uploading" && (
                  <Loader2 size={16} className="text-yellow-500 animate-spin" />
                )}
                {item.status === "done" && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
                {item.status === "error" && (
                  <span title={item.errorMessage}>
                    <AlertCircle
                      size={16}
                      className="text-red-400"
                    />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {files.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            {isUploading
              ? `${doneCount} of ${totalCount} uploaded…`
              : `${totalCount} file${totalCount !== 1 ? "s" : ""} selected`}
          </p>
          <div className="flex gap-2">
            {onClose && (
              <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">
                Cancel
              </button>
            )}
            <button
              id="bulk-upload-submit"
              onClick={handleUploadAll}
              disabled={isUploading || pendingCount === 0}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60"
            >
              {isUploading && <Loader2 size={14} className="animate-spin" />}
              {isUploading ? "Uploading…" : `Upload ${pendingCount > 0 ? pendingCount : ""} Files`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
