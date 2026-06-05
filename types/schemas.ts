import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Event Schemas ────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .max(200, "Event name cannot exceed 200 characters"),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: z.enum([
    "photoshoot",
    "workshop",
    "trip",
    "competition",
    "cultural",
    "party",
    "other",
  ]),
  date: z.string().min(1, "Event date is required"),
  visibility: z.enum(["public", "private"]),
  tags: z.array(z.string()).optional().default([]),
  coverImageS3Key: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  // No memberIds here anymore; managed via specific member endpoints
});

// ─── Media Schemas ────────────────────────────────────────────────────────────

export const createMediaSchema = z.object({
  s3Key: z.string().min(1, "S3 key is required"),
  eventId: z.string().min(1, "Event ID is required"),
  type: z.enum(["photo", "video"]).default("photo"),
  mediaVisibility: z.enum(["public", "private"]).default("public"),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

// ─── Presign Schema ───────────────────────────────────────────────────────────

export const presignSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z
    .string()
    .min(1, "Content type is required")
    .refine(
      (v) => v.startsWith("image/") || v.startsWith("video/"),
      "Only image and video files are allowed"
    ),
  eventId: z.string().min(1, "Event ID is required"),
});

// ─── Profile Schema ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  image: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type PresignInput = z.infer<typeof presignSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
