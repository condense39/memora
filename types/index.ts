import mongoose from "mongoose";

// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface UserPublic {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile extends UserPublic {
  googleId?: string;
  rekognitionFaceId?: string;
  selfieUrl?: string;
  selfieS3Key?: string;
  updatedAt: string;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventCategory =
  | "photoshoot"
  | "workshop"
  | "trip"
  | "competition"
  | "cultural"
  | "party"
  | "other";

export type EventVisibility = "public" | "private";

export interface EventData {
  _id: string;
  name: string;
  description?: string;
  category: EventCategory;
  date: string;
  coverImageUrl?: string;
  coverImageS3Key?: string;
  createdBy: UserPublic | string;
  visibility: EventVisibility;
  members: {
    userId: UserPublic | string;
    role: "club_admin" | "club_member";
  }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

// ─── Media Types ──────────────────────────────────────────────────────────────

export type MediaType = "photo" | "video";

export interface MediaData {
  _id: string;
  eventId: string;
  uploadedBy: UserPublic | string;
  fileUrl: string;
  thumbnailUrl: string;
  s3Key: string;
  type: MediaType;
  mediaVisibility: "public" | "private";
  size?: number;
  width?: number;
  height?: number;
  aiTags: string[];
  likes: string[];
  favouritedBy: string[];
  downloadCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Comment Types ────────────────────────────────────────────────────────────

export interface CommentData {
  _id: string;
  mediaId: string;
  userId: UserPublic | string;
  content: string;
  taggedUsers: (UserPublic | string)[];
  createdAt: string;
  updatedAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType =
  | "like"
  | "comment"
  | "tag"
  | "share"
  | "face_match"
  | "scan_complete";

export interface NotificationData {
  _id: string;
  recipientId: string;
  actorId: UserPublic | string;
  type: NotificationType;
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: string;
}

// ─── FaceMatch Types ──────────────────────────────────────────────────────────

export interface BoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

export interface FaceMatchData {
  _id: string;
  mediaId: string;
  userId: UserPublic | string;
  rekognitionFaceId?: string;
  confidence: number;
  boundingBox: BoundingBox;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ─── Upload Types ─────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  presignedUrl: string;
  s3Key: string;
  fileUrl: string;
}

export interface UploadFileItem {
  file: File;
  id: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  mediaVisibility: "public" | "private";
  progress: number;
  s3Key?: string;
  fileUrl?: string;
  errorMessage?: string;
}

// ─── Session Extension ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEvents: number;
  totalPhotos: number;
  totalLikes: number;
  totalMatches: number;
}
