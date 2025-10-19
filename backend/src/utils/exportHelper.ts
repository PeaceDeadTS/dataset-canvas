/**
 * Utility functions for dataset export operations
 */

/**
 * Extracts file path from full URL by removing the domain and protocol
 * Examples:
 *   https://datasets.pbc.red/media/datasets/games/poker/games_poker_0002.png 
 *   -> media/datasets/games/poker/games_poker_0002.png
 *   
 *   http://example.com/path/to/image.jpg
 *   -> path/to/image.jpg
 *   
 *   /media/local/file.png
 *   -> media/local/file.png
 */
export function extractFilePathFromURL(url: string): string {
  try {
    // If URL starts with http:// or https://, parse it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.startsWith('/') 
        ? urlObj.pathname.substring(1) 
        : urlObj.pathname;
    }
    
    // If it's a relative path starting with /, remove the leading slash
    if (url.startsWith('/')) {
      return url.substring(1);
    }
    
    // Return as-is if it's already a relative path
    return url;
  } catch (error) {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/^https?:\/\/[^\/]+\/(.+)$/);
    if (match) {
      return match[1];
    }
    
    // Fallback: return original URL with leading slash removed if present
    return url.startsWith('/') ? url.substring(1) : url;
  }
}

/**
 * Generates JSONL (JSON Lines) content for Kohya SS / sd-scripts format
 * Each line is a separate JSON object with file_name and caption
 */
export function generateKohyaJSONL(images: Array<{ url: string; prompt: string }>): string {
  const lines = images.map(image => {
    const fileName = extractFilePathFromURL(image.url);
    return JSON.stringify({
      file_name: fileName,
      caption: image.prompt || ''
    });
  });
  
  return lines.join('\n');
}

/**
 * Generates plain text list of image URLs
 * Each line contains one image URL
 */
export function generateURLListTXT(images: Array<{ url: string }>): string {
  return images.map(image => image.url).join('\n');
}

/**
 * Generates CSV list of image URLs with metadata
 * Format: url,filename,width,height
 */
export function generateURLListCSV(
  images: Array<{ 
    url: string; 
    filename: string;
    width?: number;
    height?: number;
  }>
): string {
  const headers = 'url,filename,width,height';
  const rows = images.map(image => {
    // Escape commas and quotes in values
    const url = `"${image.url.replace(/"/g, '""')}"`;
    const filename = `"${image.filename.replace(/"/g, '""')}"`;
    const width = image.width || '';
    const height = image.height || '';
    return `${url},${filename},${width},${height}`;
  });
  
  return [headers, ...rows].join('\n');
}

