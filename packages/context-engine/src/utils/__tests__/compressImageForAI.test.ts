import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compressImageForAI } from '../compressImageForAI';

// Mock canvas context
const mockDrawImage = vi.fn();
const mockToDataURL = vi.fn();

const createMockContext = () => ({
  drawImage: mockDrawImage,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
});

// Mock document.createElement
const originalCreateElement = document.createElement.bind(document);
const mockCanvas = {
  getContext: vi.fn(() => createMockContext()),
  height: 0,
  toDataURL: mockToDataURL,
  width: 0,
};

describe('compressImageForAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToDataURL.mockReturnValue('data:image/webp;base64,compressed');

    // Mock createElement to return mock canvas
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('size threshold check', () => {
    it('should skip compression for small images below threshold', async () => {
      // Create a small base64 image (less than 512KB)
      const smallBase64 = 'data:image/png;base64,' + 'A'.repeat(100);

      const result = await compressImageForAI(smallBase64, {
        compressThreshold: 512 * 1024,
      });

      // Should return original image without compression
      expect(result).toBe(smallBase64);
      expect(mockCanvas.getContext).not.toHaveBeenCalled();
    });

    it('should compress images above threshold', async () => {
      // Create a large base64 image (more than 512KB)
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(800_000);

      // Mock Image load
      const mockImage = {
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'load') {
            // Simulate image dimensions
            Object.defineProperty(mockImage, 'width', { value: 3000 });
            Object.defineProperty(mockImage, 'height', { value: 2000 });
            handler();
          }
        }),
        crossOrigin: '',
        height: 2000,
        src: '',
        width: 3000,
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const result = await compressImageForAI(largeBase64, {
        compressThreshold: 512 * 1024,
      });

      // Should return compressed image
      expect(result).toBe('data:image/webp;base64,compressed');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockToDataURL).toHaveBeenCalledWith('image/webp', 0.8);
    });
  });

  describe('dimension scaling', () => {
    it('should scale down images exceeding maxWidth', async () => {
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(800_000);

      // Mock Image with dimensions exceeding maxWidth
      const mockImage = {
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'load') {
            Object.defineProperty(mockImage, 'width', { value: 4000 });
            Object.defineProperty(mockImage, 'height', { value: 2000 });
            handler();
          }
        }),
        crossOrigin: '',
        height: 2000,
        src: '',
        width: 4000,
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      await compressImageForAI(largeBase64, {
        maxWidth: 2048,
        maxHeight: 2048,
      });

      // Check canvas dimensions are scaled correctly (4000 -> 2048, 2000 -> 1024)
      expect(mockCanvas.width).toBe(2048);
      expect(mockCanvas.height).toBe(1024);
    });

    it('should scale down images exceeding maxHeight', async () => {
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(800_000);

      // Mock Image with dimensions exceeding maxHeight
      const mockImage = {
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'load') {
            Object.defineProperty(mockImage, 'width', { value: 1500 });
            Object.defineProperty(mockImage, 'height', { value: 4000 });
            handler();
          }
        }),
        crossOrigin: '',
        height: 4000,
        src: '',
        width: 1500,
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      await compressImageForAI(largeBase64, {
        maxWidth: 2048,
        maxHeight: 2048,
      });

      // Check canvas dimensions are scaled correctly (1500 -> 768, 4000 -> 2048)
      expect(mockCanvas.width).toBe(768);
      expect(mockCanvas.height).toBe(2048);
    });
  });

  describe('format and quality options', () => {
    it('should use custom format and quality', async () => {
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(800_000);

      const mockImage = {
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'load') {
            Object.defineProperty(mockImage, 'width', { value: 1000 });
            Object.defineProperty(mockImage, 'height', { value: 1000 });
            handler();
          }
        }),
        crossOrigin: '',
        height: 1000,
        src: '',
        width: 1000,
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      await compressImageForAI(largeBase64, {
        format: 'image/jpeg',
        quality: 0.6,
      });

      expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.6);
    });
  });

  describe('error handling', () => {
    it('should return original image on error', async () => {
      const imageUrl = 'data:image/png;base64,' + 'A'.repeat(800_000);

      // Mock Image that fails to load
      const mockImage = {
        addEventListener: vi.fn((event: string, handler: (e: Error) => void) => {
          if (event === 'error') {
            handler(new Error('Failed to load'));
          }
        }),
        crossOrigin: '',
        src: '',
      };

      vi.spyOn(window, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const result = await compressImageForAI(imageUrl);

      // Should return original image when error occurs
      expect(result).toBe(imageUrl);
    });
  });

  describe('non-browser environment', () => {
    it('should return original image in non-browser environment', async () => {
      // Save original
      const originalWindow = global.window;
      const originalDocument = global.document;

      // Simulate non-browser environment
      // @ts-ignore
      delete global.window;
      // @ts-ignore
      delete global.document;

      const imageUrl = 'data:image/png;base64,test';
      const result = await compressImageForAI(imageUrl);

      // Should return original image
      expect(result).toBe(imageUrl);

      // Restore
      global.window = originalWindow;
      global.document = originalDocument;
    });
  });
});
