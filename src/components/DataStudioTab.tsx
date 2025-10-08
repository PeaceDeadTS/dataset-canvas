import React, { useState, useRef, useEffect } from 'react';
import { Dataset, DatasetImage, CaptionHistoryEntry } from '@/types';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Edit, Loader2 } from 'lucide-react';
import { CaptionEditor } from './CaptionEditor';
import { CaptionHistoryList } from './CaptionHistoryList';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import axios from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface DataStudioTabProps {
  dataset: Dataset;
  images: DatasetImage[];
  imagesLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalImages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

// Компонент для ленивой загрузки изображений
const LazyImage: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ src, alt, className, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Начинаем загрузку за 50px до появления в viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`relative ${className || ''}`} ref={imgRef}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onClick={onClick}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
      )}
    </div>
  );
};

export const DataStudioTab: React.FC<DataStudioTabProps> = ({
  dataset,
  images,
  imagesLoading,
  currentPage,
  totalPages,
  totalImages,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();
  const [selectedImage, setSelectedImage] = useState<DatasetImage | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionHistory, setCaptionHistory] = useState<CaptionHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedImageForDialog, setSelectedImageForDialog] = useState<DatasetImage | null>(null);

  const openLightbox = (image: DatasetImage) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
  };

  const loadCaptionHistory = async (imageId: number) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        `/datasets/${dataset.id}/images/${imageId}/caption-history`
      );
      setCaptionHistory(response.data.history || []);
    } catch (error) {
      console.error('Error loading caption history:', error);
      setCaptionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveCaption = async (imageId: number, newCaption: string) => {
    try {
      await axios.put(
        `/datasets/${dataset.id}/images/${imageId}/caption`,
        { caption: newCaption }
      );

      // Обновляем изображение в локальном состоянии
      const updatedImage = { ...selectedImageForDialog!, prompt: newCaption };
      setSelectedImageForDialog(updatedImage);

      // Перезагружаем историю
      await loadCaptionHistory(imageId);

      setIsEditingCaption(false);

      toast({
        title: t('pages:dataset.caption_updated'),
        description: t('pages:dataset.caption_update_success'),
      });
    } catch (error: any) {
      console.error('Error saving caption:', error);
      toast({
        title: t('common:error'),
        description: error.response?.data?.message || t('pages:dataset.caption_update_error'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleOpenDialog = async (image: DatasetImage) => {
    setSelectedImageForDialog(image);
    setIsEditingCaption(false);
    
    // Загружаем историю правок
    if (hasPermission('edit_caption')) {
      await loadCaptionHistory(image.id);
    }
  };

  // Функция для получения расширения файла из URL
  const getFileExtension = (url: string): string => {
    try {
      const cleanUrl = url.split('?')[0];
      const parts = cleanUrl.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : t('common:imageDetails.unknown');
    } catch {
      return t('common:imageDetails.unknown');
    }
  };

  // Функция для вычисления НОД (наибольший общий делитель)
  const gcd = (a: number, b: number): number => {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };

  // Функция для форматирования aspect ratio в понятном виде
  const formatAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    
    const commonRatios = [
      { ratio: 16/9, label: '16:9' },
      { ratio: 4/3, label: '4:3' },
      { ratio: 3/2, label: '3:2' },
      { ratio: 1/1, label: '1:1' },
      { ratio: 5/4, label: '5:4' },
      { ratio: 21/9, label: '21:9' },
      { ratio: 9/16, label: '9:16' },
      { ratio: 2/3, label: '2:3' },
      { ratio: 3/4, label: '3:4' },
      { ratio: 4/5, label: '4:5' },
      { ratio: 8/5, label: '8:5' },
      { ratio: 5/3, label: '5:3' },
    ];

    let closest = commonRatios[0];
    let minDifference = Math.abs(ratio - closest.ratio);

    for (const common of commonRatios) {
      const difference = Math.abs(ratio - common.ratio);
      if (difference < minDifference) {
        minDifference = difference;
        closest = common;
      }
    }

    if (minDifference < 0.03) {
      return closest.label;
    }

    const divisor = gcd(width, height);
    const simplifiedWidth = width / divisor;
    const simplifiedHeight = height / divisor;

    if (simplifiedWidth > 50 || simplifiedHeight > 50) {
      return closest.label;
    }

    return `${simplifiedWidth}:${simplifiedHeight}`;
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none bg-background border-b">
        <div className="container mx-auto px-4 py-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          <h2 className="text-xl font-semibold">{t('common:images')} ({totalImages})</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          {imagesLoading ? (
            <div className="py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : images.length > 0 ? (
            <div className="overflow-x-auto py-4">
              <Table className="table-auto w-full">
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow className="border-b">
                    <TableHead className="w-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.row')}</TableHead>
                    {dataset.format === 'coco' && (
                      <TableHead className="w-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.coco_id')}</TableHead>
                    )}
                    <TableHead className="min-w-[18rem] max-w-[30rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.image_key')}</TableHead>
                    <TableHead className="min-w-[18rem] max-w-[80rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.filename')}</TableHead>
                    <TableHead className="min-w-[20rem] max-w-[80rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('common:image')}</TableHead>
                    <TableHead className="w-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.dimensions')}</TableHead>
                    <TableHead className="min-w-[44rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.prompt')}</TableHead>
                    {dataset.format === 'coco' && (
                      <TableHead className="min-w-[12rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.license')}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image) => (
                    <Dialog key={image.id} onOpenChange={(open) => { if (open) handleOpenDialog(image); }}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell className="py-4 text-center">{image.row_number}</TableCell>
                          {dataset.format === 'coco' && (
                            <TableCell className="py-4 text-center text-xs text-muted-foreground">{image.cocoImageId || '-'}</TableCell>
                          )}
                          <TableCell className="font-mono text-xs py-4 overflow-hidden text-ellipsis">{image.img_key}</TableCell>
                          <TableCell className="py-4 overflow-hidden text-ellipsis">{image.filename}</TableCell>
                          <TableCell className="py-4" onClick={(e) => { e.stopPropagation(); openLightbox(image); }}>
                            <div className="flex flex-col items-center gap-2 w-full min-w-0">
                              <LazyImage 
                                src={image.url} 
                                alt={image.filename} 
                                className="h-16 w-16 object-cover rounded flex-shrink-0" 
                              />
                              <a 
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-muted-foreground hover:text-primary underline w-full text-center overflow-hidden text-ellipsis whitespace-nowrap"
                                title={image.url}
                              >
                                {new URL(image.url).pathname.split('/').pop()}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center whitespace-nowrap">{`${image.width}x${image.height}`}</TableCell>
                          <TableCell className="py-4 overflow-hidden text-ellipsis">{image.prompt}</TableCell>
                          {dataset.format === 'coco' && (
                            <TableCell className="py-4 text-xs text-muted-foreground overflow-hidden text-ellipsis">{image.license || '-'}</TableCell>
                          )}
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>{selectedImageForDialog?.filename || image.filename}</DialogTitle>
                          <DialogDescription>
                            {t('pages:dataset.image_details')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[calc(90vh-10rem)] overflow-y-auto">
                           <div className="flex justify-center w-full">
                             <img 
                               src={image.url} 
                               alt={image.filename} 
                               className="max-w-full max-h-[40vh] sm:max-h-[45vh] md:max-h-[50vh] object-contain rounded-md"
                               loading="lazy"
                             />
                           </div>
                           <div className="text-sm space-y-2 w-full min-w-0">
                            <p><strong>{t('common:imageDetails.filename')}:</strong> {image.filename}</p>
                            <p><strong>{t('common:imageDetails.fileExtension')}:</strong> {getFileExtension(image.url)}</p>
                            <p><strong>{t('common:imageDetails.dimensions')}:</strong> {image.width} × {image.height} {t('common:imageDetails.pixels')}</p>
                            <p><strong>{t('common:imageDetails.aspectRatio')}:</strong> {formatAspectRatio(image.width, image.height)}</p>
                            <div>
                              <p><strong>{t('common:imageDetails.url')}:</strong></p>
                              <a 
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary break-all max-w-full text-xs underline"
                              >
                                {image.url}
                              </a>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p><strong>{t('common:imageDetails.prompt')}:</strong></p>
                                {hasPermission('edit_caption') && !isEditingCaption && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditingCaption(true)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {t('pages:dataset.edit_caption')}
                                  </Button>
                                )}
                              </div>
                              {isEditingCaption ? (
                                <CaptionEditor
                                  initialCaption={selectedImageForDialog?.prompt || image.prompt}
                                  onSave={(newCaption) => handleSaveCaption(image.id, newCaption)}
                                  onCancel={() => setIsEditingCaption(false)}
                                />
                              ) : (
                                <p className="text-muted-foreground break-words max-w-full">
                                  {selectedImageForDialog?.prompt || image.prompt}
                                </p>
                              )}
                            </div>
                            <p className="font-mono text-xs break-all"><strong>{t('common:imageDetails.key')}:</strong> {image.img_key}</p>
                            
                            {/* COCO-specific fields */}
                            {dataset.format === 'coco' && (
                              <>
                                {image.cocoImageId && (
                                  <p className="text-xs"><strong>{t('pages:dataset.coco_id')}:</strong> {image.cocoImageId}</p>
                                )}
                                {image.license && (
                                  <p className="text-xs"><strong>{t('pages:dataset.license')}:</strong> {image.license}</p>
                                )}
                                {image.flickrUrl && (
                                  <div>
                                    <p className="text-xs"><strong>{t('pages:dataset.flickr_url')}:</strong></p>
                                    <a 
                                      href={image.flickrUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-primary break-all max-w-full text-xs underline"
                                    >
                                      {image.flickrUrl}
                                    </a>
                                  </div>
                                )}
                                {image.additionalCaptions && image.additionalCaptions.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs"><strong>{t('pages:dataset.additional_captions')} ({image.additionalCaptions.length}):</strong></p>
                                    <div className="space-y-1 pl-4">
                                      {image.additionalCaptions.map((caption, idx) => (
                                        <p key={idx} className="text-xs text-muted-foreground">
                                          {idx + 1}. {caption}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {hasPermission('edit_caption') && (
                              <>
                                <Separator className="my-4" />
                                {loadingHistory ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                ) : (
                                  <CaptionHistoryList
                                    history={captionHistory}
                                    currentCaption={selectedImageForDialog?.prompt || image.prompt}
                                  />
                                )}
                              </>
                            )}
                           </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8">
              <p>{t('pages:dataset.no_images')}</p>
            </div>
          )}
        </div>
      </div>


      {/* Lightbox for single image view */}
      {isLightboxOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <img 
            src={selectedImage.url} 
            alt={selectedImage.filename} 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            loading="lazy"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
