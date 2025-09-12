import React, { useState } from 'react';
import { Dataset, DatasetImage } from '@/types';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedImage, setSelectedImage] = useState<DatasetImage | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (image: DatasetImage) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
  };

  // Функция для получения расширения файла из URL
  const getFileExtension = (url: string): string => {
    try {
      const cleanUrl = url.split('?')[0];
      const parts = cleanUrl.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'Unknown';
    } catch {
      return 'Unknown';
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

  const getPaginationGroup = () => {
    const pageCount = totalPages;
    const currentPageLocal = currentPage;
    const siblings = 2;
    const totalPageNumbers = siblings * 2 + 3;

    if (pageCount <= totalPageNumbers) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPageLocal - siblings, 1);
    const rightSiblingIndex = Math.min(currentPageLocal + siblings, pageCount);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < pageCount - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', pageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblings;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => pageCount - rightItemCount + 1 + i);
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
      return [1, '...', ...middleRange, '...', pageCount];
    }
    return [];
  };

  return (
    <>
      {/* Header */}
      <div className="bg-background border-b">
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
                    <TableHead className="min-w-[18rem] max-w-[30rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.image_key')}</TableHead>
                    <TableHead className="min-w-[18rem] max-w-[80rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.filename')}</TableHead>
                    <TableHead className="min-w-[20rem] max-w-[80rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('common:image')}</TableHead>
                    <TableHead className="w-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.dimensions')}</TableHead>
                    <TableHead className="min-w-[44rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">{t('pages:dataset.prompt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image) => (
                    <Dialog key={image.id}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell className="py-4 text-center">{image.row_number}</TableCell>
                          <TableCell className="font-mono text-xs py-4 overflow-hidden text-ellipsis">{image.img_key}</TableCell>
                          <TableCell className="py-4 overflow-hidden text-ellipsis">{image.filename}</TableCell>
                          <TableCell className="py-4" onClick={(e) => { e.stopPropagation(); openLightbox(image); }}>
                            <div className="flex flex-col items-center gap-2 w-full min-w-0">
                              <img src={image.url} alt={image.filename} className="h-16 w-16 object-cover rounded flex-shrink-0" />
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
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>{image.filename}</DialogTitle>
                          <DialogDescription>
                            {t('pages:dataset.image_details')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
                           <div className="flex justify-center">
                             <img 
                               src={image.url} 
                               alt={image.filename} 
                               className="max-w-full max-h-[50vh] object-contain rounded-md" 
                             />
                           </div>
                           <div className="text-sm space-y-2 min-w-0">
                            <p><strong>Filename:</strong> {image.filename}</p>
                            <p><strong>File extension:</strong> {getFileExtension(image.url)}</p>
                            <p><strong>Dimensions:</strong> {image.width} × {image.height} pixels</p>
                            <p><strong>Aspect ratio:</strong> {formatAspectRatio(image.width, image.height)}</p>
                            <div>
                              <p><strong>URL:</strong></p>
                              <a 
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary break-all max-w-full text-xs underline"
                              >
                                {image.url}
                              </a>
                            </div>
                            <div>
                              <p><strong>Prompt:</strong></p>
                              <p className="text-muted-foreground break-words max-w-full">{image.prompt}</p>
                            </div>
                            <p className="font-mono text-xs break-all"><strong>Key:</strong> {image.img_key}</p>
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

      {/* Footer - Pagination */}
      {images.length > 0 && (
        <div className="bg-background border-t">
          <div className="container mx-auto px-4 py-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('pages:dataset.items_per_page')}:</span>
                <Select value={limit.toString()} onValueChange={(value) => onLimitChange(parseInt(value, 10))}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
               <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(Math.max(currentPage - 1, 1));
                      }}
                      className={currentPage === 1 ? 'pointer-events-none text-muted-foreground' : ''}
                    />
                  </PaginationItem>

                  {getPaginationGroup().map((item, index) => (
                    <PaginationItem key={index}>
                      {item === '...' ? (
                        <span className="px-4 py-2">...</span>
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={currentPage === item}
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(item as number);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(Math.min(currentPage + 1, totalPages));
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none text-muted-foreground' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
