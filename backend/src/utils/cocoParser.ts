import { randomUUID } from 'crypto';
import logger from '../logger';

/**
 * COCO JSON format structure
 */
export interface COCOImage {
  id: number | string;
  file_name?: string;
  coco_url?: string;
  flickr_url?: string;
  width?: number;
  height?: number;
  license?: number | string;
}

export interface COCOAnnotation {
  id?: number | string;
  image_id: number | string;
  caption: string;
}

export interface COCODataset {
  images: COCOImage[];
  annotations: COCOAnnotation[];
  licenses?: Array<{ id: number | string; name: string; url?: string }>;
}

/**
 * Parsed COCO image with all relevant data
 */
export interface ParsedCOCOImage {
  cocoImageId: number;
  filename: string;
  url: string;
  flickrUrl?: string;
  width: number;
  height: number;
  prompt: string;
  additionalCaptions: string[];
  license?: string;
  img_key: string;
}

/**
 * Parse COCO JSON format and extract images with captions
 * 
 * @param buffer - File buffer containing COCO JSON
 * @returns Array of parsed images
 */
export async function parseCOCOJSON(buffer: Buffer): Promise<ParsedCOCOImage[]> {
  try {
    const jsonString = buffer.toString('utf-8');
    const cocoData: COCODataset = JSON.parse(jsonString);

    // Validate COCO structure
    if (!cocoData.images || !Array.isArray(cocoData.images)) {
      throw new Error('Invalid COCO format: missing or invalid "images" array');
    }

    if (!cocoData.annotations || !Array.isArray(cocoData.annotations)) {
      throw new Error('Invalid COCO format: missing or invalid "annotations" array');
    }

    // Build license lookup map
    const licenseMap = new Map<number | string, string>();
    if (cocoData.licenses && Array.isArray(cocoData.licenses)) {
      cocoData.licenses.forEach(lic => {
        licenseMap.set(lic.id, lic.name);
      });
    }

    // Group annotations by image_id
    const annotationsByImageId = new Map<number | string, COCOAnnotation[]>();
    cocoData.annotations.forEach(ann => {
      if (!ann.caption || !ann.caption.trim()) {
        // Skip annotations without captions
        logger.warn('Skipping annotation without caption', { annotationId: ann.id });
        return;
      }

      const imageId = ann.image_id;
      if (!annotationsByImageId.has(imageId)) {
        annotationsByImageId.set(imageId, []);
      }
      annotationsByImageId.get(imageId)!.push(ann);
    });

    // Process images
    const parsedImages: ParsedCOCOImage[] = [];
    const skippedImages: number[] = [];

    for (const image of cocoData.images) {
      // Extract URL with priority: coco_url -> flickr_url
      const url = image.coco_url || image.flickr_url;
      
      if (!url) {
        logger.warn('Skipping image without URL', { imageId: image.id });
        skippedImages.push(Number(image.id));
        continue;
      }

      // Get annotations for this image
      const annotations = annotationsByImageId.get(image.id);
      
      if (!annotations || annotations.length === 0) {
        logger.warn('Skipping image without captions', { imageId: image.id });
        skippedImages.push(Number(image.id));
        continue;
      }

      // Extract captions: first one goes to prompt, rest to additionalCaptions
      const captions = annotations.map(ann => ann.caption);
      const [firstCaption, ...additionalCaptions] = captions;

      // Extract license information
      let licenseInfo: string | undefined;
      if (image.license !== undefined) {
        licenseInfo = licenseMap.get(image.license) || String(image.license);
      }

      // Extract filename from file_name or URL
      const filename = image.file_name || extractFilenameFromUrl(url);

      parsedImages.push({
        cocoImageId: Number(image.id),
        filename,
        url,
        flickrUrl: image.flickr_url,
        width: image.width || 0,
        height: image.height || 0,
        prompt: firstCaption,
        additionalCaptions,
        license: licenseInfo,
        img_key: randomUUID() // Generate UUID for new images
      });
    }

    if (skippedImages.length > 0) {
      logger.info(`Skipped ${skippedImages.length} images without URLs or captions`, {
        skippedImageIds: skippedImages.slice(0, 10) // Log first 10
      });
    }

    if (parsedImages.length === 0) {
      throw new Error('No valid images found in COCO JSON. Images must have both URL and at least one caption.');
    }

    logger.info(`Successfully parsed COCO JSON: ${parsedImages.length} images, ${skippedImages.length} skipped`);
    
    return parsedImages;

  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in COCO file');
    }
    throw error;
  }
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Detect if file is COCO JSON format
 * 
 * @param buffer - File buffer
 * @returns true if file appears to be COCO JSON
 */
export function isCocoFormat(buffer: Buffer): boolean {
  try {
    const jsonString = buffer.toString('utf-8');
    const data = JSON.parse(jsonString);
    
    // Check for COCO structure markers
    return (
      data && 
      typeof data === 'object' &&
      Array.isArray(data.images) &&
      Array.isArray(data.annotations)
    );
  } catch {
    return false;
  }
}

