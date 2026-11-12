const SUPPORTED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/**
 * Parses a Base64 image Data URL into a validated Blob and metadata.
 * Verifies magic bytes match the declared MIME type.
 */
export function parseImageDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') {
    throw new Error('Image data URL must be a string.');
  }
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new Error('Unsupported or malformed image data URL.');
  }
  const mimeType = match[1].toLowerCase();
  if (!SUPPORTED_MIMES.has(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const base64 = match[2];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (bytes.length === 0) {
    throw new Error('Decoded image is empty.');
  }

  // Verify magic bytes match declared MIME type
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const validMagic =
    mimeType === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b) :
    mimeType === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
    mimeType === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' :
    ['GIF87a', 'GIF89a'].includes(ascii(0, 6));

  if (!validMagic) {
    throw new Error(`Magic bytes do not match declared MIME type ${mimeType}.`);
  }

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  const blob = new Blob([bytes], { type: mimeType });
  return { mimeType, ext, bytes, blob, size: bytes.length };
}
