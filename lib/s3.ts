import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION!;
const bucketName = process.env.AWS_S3_BUCKET_NAME!;

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generate a presigned URL for uploading a file to S3.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
}

/**
 * Returns the public S3 URL for a given key.
 */
export function getS3Url(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Deletes an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Generates a structured S3 key for event media.
 * Format: events/{eventId}/{userId}/{timestamp}-{sanitizedFilename}
 */
export function generateS3Key(
  userId: string,
  eventId: string,
  filename: string
): string {
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  return `events/${eventId}/${userId}/${Date.now()}-${sanitized}`;
}
