import { useState, useEffect } from 'react';

interface ImageDimensions {
  width: number;
  height: number;
  loaded: boolean;
  error: boolean;
}

/**
 * Хук для загрузки размеров изображения
 * @param imageUrl - URL изображения
 * @param minWidth - Минимальная ширина для валидации (по умолчанию 300)
 * @returns Объект с размерами изображения и статусом загрузки
 */
export function useImageDimensions(imageUrl: string | null, minWidth: number = 300) {
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    width: 0,
    height: 0,
    loaded: false,
    error: false,
  });

  useEffect(() => {
    if (!imageUrl) {
      setDimensions({ width: 0, height: 0, loaded: false, error: false });
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        loaded: true,
        error: false,
      });
    };

    img.onerror = () => {
      setDimensions({
        width: 0,
        height: 0,
        loaded: false,
        error: true,
      });
    };

    img.src = imageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  const isValid = dimensions.loaded && dimensions.width >= minWidth;

  return {
    ...dimensions,
    isValid,
  };
}

