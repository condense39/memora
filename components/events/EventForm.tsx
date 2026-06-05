"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { X, Loader2, Upload } from "lucide-react";
import { createEventSchema, type CreateEventInput } from "@/types/schemas";
import type { EventData } from "@/types";
import { toast } from "sonner";

const categories = [
  { value: "photoshoot", label: "Photoshoot" },
  { value: "workshop", label: "Workshop" },
  { value: "trip", label: "Trip" },
  { value: "competition", label: "Competition" },
  { value: "cultural", label: "Cultural" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

interface EventFormProps {
  initialData?: Partial<EventData>;
  onSuccess?: (event: EventData) => void;
}

type EventFormValues = {
  name: string;
  description?: string;
  category: CreateEventInput["category"];
  date: string;
  visibility: CreateEventInput["visibility"];
};

export default function EventForm({ initialData, onSuccess }: EventFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.coverImageUrl ?? null
  );
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverS3Key, setCoverS3Key] = useState<string | null>(
    initialData?.coverImageS3Key ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      category: initialData?.category ?? "other",
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split("T")[0]
        : "",
      visibility: initialData?.visibility ?? "public",
    },
  });

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
        setTags((prev) => [...prev, trimmed]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCoverUploading(true);

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          eventId: "cover",
        }),
      });

      if (!presignRes.ok) throw new Error("Failed to get upload URL");

      const { presignedUrl, s3Key } = await presignRes.json();

      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setCoverS3Key(s3Key);
      setCoverPreview(URL.createObjectURL(file));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to upload cover image. Please try again.");
    } finally {
      setCoverUploading(false);
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        tags,
        ...(coverS3Key && { coverImageS3Key: coverS3Key }),
      };

      const method = initialData?._id ? "PUT" : "POST";
      const url = initialData?._id
        ? `/api/events/${initialData._id}`
        : "/api/events";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to save event.");
        setError(json.error ?? "Failed to save event.");
        return;
      }

      toast.success(initialData?._id ? "Event updated successfully!" : "Event created successfully!");

      if (onSuccess) {
        onSuccess(json);
      } else {
        router.push(`/events/${json._id}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Photography Club Annual Shoot"
          className="input-field"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          rows={4}
          placeholder="Tell people what this event is about…"
          className="input-field resize-none"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Category & Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select className="input-field" {...register("category")}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Event Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input-field"
            {...register("date")}
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visibility
        </label>
        <div className="flex gap-4">
          {["public", "private"].map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={v}
                className="accent-yellow-400 w-4 h-4"
                {...register("visibility")}
              />
              <span className="text-sm text-gray-700 capitalize">{v}</span>
              <span className="text-xs text-gray-400">
                {v === "public" ? "— visible to everyone" : "— invite-only"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tags
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Type a tag and press Enter…"
          className="input-field"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">{tags.length}/10 tags</p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Cover Image
        </label>
        <div
          className="relative border-2 border-dashed border-yellow-300 rounded-2xl bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          {coverPreview ? (
            <div className="relative aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">Click to change</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              {coverUploading ? (
                <Loader2 size={32} className="text-yellow-400 animate-spin" />
              ) : (
                <Upload size={32} className="text-yellow-400" />
              )}
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">
                  {coverUploading ? "Uploading…" : "Click to upload cover image"}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCoverUpload(file);
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          id="event-form-submit"
          type="submit"
          disabled={isLoading || coverUploading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          {isLoading
            ? "Saving…"
            : initialData?._id
            ? "Update Event"
            : "Create Event"}
        </button>
      </div>
    </form>
  );
}
