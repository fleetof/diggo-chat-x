import debug from 'debug';

const log = debug('context-engine:compressImage');

export interface CompressImageOptions {
  /**
   * Compression threshold in bytes. Images smaller than this won't be compressed.
   * @default 512 * 1024 (512KB)
   */
  compressThreshold?: number;
  /**
   * Output format
   * @default 'image/webp'
   */
  format?: 'image/webp' | 'image/jpeg';
  /**
   * Maximum height in pixels
   * @default 2048
   */
  maxHeight?: number;
  /**
   * Maximum width in pixels
   * @default 2048
   */
  maxWidth?: number;
  /**
   * Compression quality (0-1)
   * @default 0.8
   */
  quality?: number;
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  compressThreshold: 512 * 1024, // 512KB
  format: 'image/webp',
  maxHeight: 2048,
  maxWidth: 2048,
  quality: 0.8,
};

/**
 * Calculate the base64 string size in bytes
 */
const getBase64Size = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  // Base64 encoding: 4 chars = 3 bytes
  const padding = (base64Data.match(/=+$/) || [''])[0].length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
};

/**
 * Load an image from a URL or base64 data URL
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(new Error(`Failed to load image: ${e.message}`)));

    img.src = src;
  });
};

/**
 * Calculate target dimensions while maintaining aspect ratio
 */
const calculateTargetDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { height: number; width: number } => {
  let targetWidth = width;
  let targetHeight = height;

  // Scale down if width exceeds max
  if (targetWidth > maxWidth) {
    targetHeight = Math.round((maxWidth / targetWidth) * targetHeight);
    targetWidth = maxWidth;
  }

  // Scale down if height still exceeds max
  if (targetHeight > maxHeight) {
    targetWidth = Math.round((maxHeight / targetHeight) * targetWidth);
    targetHeight = maxHeight;
  }

  return { height: targetHeight, width: targetWidth };
};

/**
 * Compress an image using Canvas API
 *
 * @param imageUrl - The image URL (can be base64 data URL or http URL)
 * @param options - Compression options
 * @returns Compressed image as base64 data URL
 *
 * @example
 * ```typescript
 * const compressed = await compressImageForAI('data:image/png;base64,...', {
 *   maxWidth: 2048,
 *   quality: 0.8,
 * });
 * ```
 */
export const compressImageForAI = async (
  imageUrl: string,
  options: CompressImageOptions = {},
): Promise<string> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    log('Not in browser environment, returning original image');
    return imageUrl;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const isDataUrl = imageUrl.startsWith('data:');
  let originalSize = 0;

  // Check if image size is below threshold (only for base64 data URLs)
  if (isDataUrl) {
    originalSize = getBase64Size(imageUrl);
    if (originalSize < opts.compressThreshold) {
      log(
        'Image size %d bytes is below threshold %d, skipping compression',
        originalSize,
        opts.compressThreshold,
      );
      return imageUrl;
    }
    log(
      'Image size %d bytes exceeds threshold %d, compressing...',
      originalSize,
      opts.compressThreshold,
    );
  }

  try {
    // Load the image
    const img = await loadImage(imageUrl);

    // Calculate target dimensions
    const { width, height } = calculateTargetDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight,
    );

    log('Resizing from %dx%d to %dx%d', img.width, img.height, width, height);

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas 2d context');
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);

    // Convert to compressed format
    const compressedDataUrl = canvas.toDataURL(opts.format, opts.quality);

    const compressedSize = getBase64Size(compressedDataUrl);
    const ratio = originalSize ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : '0';

    log('Compression complete: %d bytes -> %d bytes (-%s%%)', originalSize, compressedSize, ratio);

    // If compression doesn't reduce size, return original
    if (isDataUrl && originalSize > 0 && compressedSize >= originalSize) {
      log('Compressed image is larger or equal, returning original');
      return imageUrl;
    }

    return compressedDataUrl;
  } catch (error) {
    log('Compression failed, returning original image: %O', error);
    // Return original image if compression fails
    return imageUrl;
  }
};
