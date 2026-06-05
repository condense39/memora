import {
  RekognitionClient,
  CreateCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  ResourceAlreadyExistsException,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID!;

export async function ensureCollection(): Promise<void> {
  try {
    const command = new CreateCollectionCommand({
      CollectionId: COLLECTION_ID,
    });
    await client.send(command);
  } catch (error) {
    if (error instanceof ResourceAlreadyExistsException) {
      // Silently continue if it already exists
      return;
    }
    console.error("[rekognition] ensureCollection error:", error);
    throw error;
  }
}

export async function enrollFace(
  imageBuffer: Buffer,
  userId: string
): Promise<string | null> {
  try {
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: userId,
      DetectionAttributes: ["DEFAULT"],
      MaxFaces: 1,
      QualityFilter: "AUTO",
    });

    const response = await client.send(command);

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return null;
    }

    return response.FaceRecords[0].Face?.FaceId || null;
  } catch (error) {
    console.error("[rekognition] enrollFace error:", error);
    return null;
  }
}

export interface FaceSearchResult {
  faceId: string;
  userId: string;
  similarity: number;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
}

export async function searchFacesByImage(
  imageBuffer: Buffer
): Promise<FaceSearchResult[]> {
  try {
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: 10,
      FaceMatchThreshold: 75,
    });

    const response = await client.send(command);

    if (!response.FaceMatches) return [];

    return response.FaceMatches.map((match) => ({
      faceId: match.Face?.FaceId!,
      userId: match.Face?.ExternalImageId!,
      similarity: match.Similarity || 0,
      boundingBox: {
        Width: match.Face?.BoundingBox?.Width || 0,
        Height: match.Face?.BoundingBox?.Height || 0,
        Left: match.Face?.BoundingBox?.Left || 0,
        Top: match.Face?.BoundingBox?.Top || 0,
      },
    }));
  } catch (error: any) {
    if (error.name === "InvalidParameterException") {
      // No faces in image
      return [];
    }
    console.error("[rekognition] searchFacesByImage error:", error);
    return [];
  }
}

export async function deleteFace(faceId: string): Promise<void> {
  try {
    const command = new DeleteFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceIds: [faceId],
    });
    await client.send(command);
  } catch (error) {
    console.error("[rekognition] deleteFace error:", error);
  }
}
