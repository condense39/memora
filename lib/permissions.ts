import type { IEvent } from "@/models/Event";
import type { IMedia } from "@/models/Media";
import type { EventData, MediaData, UserPublic } from "@/types";

type EventRole = "club_admin" | "club_member" | "viewer" | null;

/**
 * Derives the role of a user for a specific event.
 */
export function getEventRole(
  event: IEvent | EventData,
  userId: string | undefined | null
): EventRole {
  if (!userId) return null;

  const members = event.members || [];
  const member = members.find((m: any) => {
    // Handle both populated and unpopulated cases
    const memberUserId = m.userId?._id ? m.userId._id.toString() : m.userId?.toString();
    return memberUserId === userId;
  });

  if (!member) return "viewer";
  return member.role as "club_admin" | "club_member";
}

/**
 * Checks if a user can view a specific media item.
 */
export function canViewMedia(
  media: IMedia | MediaData,
  eventRole: EventRole
): boolean {
  if (media.mediaVisibility === "public") return true;
  return eventRole === "club_admin" || eventRole === "club_member";
}

/**
 * Checks if a user can upload media to the event.
 */
export function canUploadToEvent(eventRole: EventRole): boolean {
  return eventRole === "club_admin" || eventRole === "club_member";
}

/**
 * Checks if a user can delete a specific media item.
 */
export function canDeleteMedia(
  media: IMedia | MediaData,
  userId: string,
  eventRole: EventRole,
  isGlobalAdmin: boolean
): boolean {
  if (isGlobalAdmin) return true;
  if (eventRole === "club_admin") return true;

  // club_member can only delete their own media
  const uploaderId = (media.uploadedBy as any)?._id
    ? (media.uploadedBy as any)._id.toString()
    : media.uploadedBy?.toString();

  if (eventRole === "club_member" && uploaderId === userId) {
    return true;
  }

  return false;
}

/**
 * Checks if a user can manage event details and members.
 */
export function canManageMembers(
  eventRole: EventRole,
  isGlobalAdmin: boolean
): boolean {
  return eventRole === "club_admin" || isGlobalAdmin;
}
