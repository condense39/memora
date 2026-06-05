export async function getImageTags(imageUrl: string): Promise<string[]> {
  try {
    const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;

    const response = await fetch(VISION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: "LABEL_DETECTION", maxResults: 15 },
              { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[vision] Vision API failed with status:", response.status);
      return [];
    }

    const data = await response.json();
    const annotations = data.responses?.[0];

    if (!annotations) return [];

    const rawTags: { description: string; score: number }[] = [];

    // Collect labels
    if (annotations.labelAnnotations) {
      for (const label of annotations.labelAnnotations) {
        if (label.score >= 0.7 && label.description) {
          rawTags.push({ description: label.description, score: label.score });
        }
      }
    }

    // Collect localized objects
    if (annotations.localizedObjectAnnotations) {
      for (const obj of annotations.localizedObjectAnnotations) {
        if (obj.score >= 0.7 && obj.name) {
          rawTags.push({ description: obj.name, score: obj.score });
        }
      }
    }

    // Sort by score descending
    rawTags.sort((a, b) => b.score - a.score);

    const tagsSet = new Set<string>();

    for (const item of rawTags) {
      const normalized = item.description.toLowerCase().trim();
      if (normalized) {
        tagsSet.add(normalized);
      }
      if (tagsSet.size >= 10) break;
    }

    return Array.from(tagsSet);
  } catch (error) {
    console.error("[vision] Error fetching tags:", error);
    return [];
  }
}
