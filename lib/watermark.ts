import sharp from "sharp";

/**
 * Applies a watermark to an image buffer and returns a JPEG buffer.
 * The watermark is a semi-transparent pill in the bottom-right corner.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  eventName: string,
  uploaderName: string
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 600;

  // Scale font size relative to image width
  const fontSize = Math.max(16, Math.floor(width / 40));
  const padding = 20;
  const innerPadding = 12;

  const text = `${eventName} • Memora`;
  // Approximate character width
  const svgWidth = Math.ceil(text.length * fontSize * 0.58 + innerPadding * 2);
  const svgHeight = fontSize + innerPadding * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
    <rect width="100%" height="100%" rx="8" ry="8" fill="rgba(0,0,0,0.55)"/>
    <text
      x="50%"
      y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${fontSize}px"
      font-weight="600"
      fill="white"
      opacity="0.92"
    >${text}</text>
  </svg>`;

  // Add Memora branding line below
  const creditText = `📸 ${uploaderName}`;
  const creditWidth = Math.ceil(creditText.length * (fontSize * 0.75) * 0.58 + innerPadding * 2);
  const creditHeight = Math.floor(fontSize * 0.75) + innerPadding;
  const creditFontSize = Math.max(12, Math.floor(fontSize * 0.75));

  const creditSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${creditWidth}" height="${creditHeight}">
    <text
      x="50%"
      y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${creditFontSize}px"
      fill="rgba(255,255,255,0.7)"
    >${creditText}</text>
  </svg>`;

  const mainLeft = width - svgWidth - padding;
  const mainTop = height - svgHeight - creditHeight - padding - 4;
  const creditLeft = width - creditWidth - padding;
  const creditTop = height - creditHeight - padding;

  return sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svg),
        left: Math.max(0, mainLeft),
        top: Math.max(0, mainTop),
      },
      {
        input: Buffer.from(creditSvg),
        left: Math.max(0, creditLeft),
        top: Math.max(0, creditTop),
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
