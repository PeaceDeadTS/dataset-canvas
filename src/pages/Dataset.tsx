import { ChangeEvent, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { DatasetHeader } from '@/components/DatasetHeader';
import { Dataset } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const API_URL = '/api/datasets';

interface DatasetImage {
  id: number;
  img_key: string;
  row_number: number;
  filename: string;
  url: string;
  width: number;
  height: number;
  prompt: string;
}

const DatasetPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<DatasetImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  
  // Инициализация currentPage из URL параметра
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('p');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  // Инициализация limit из URL параметра
  const [limit, setLimit] = useState(() => {
    const limitParam = searchParams.get('limit');
    const validLimits = [10, 25, 50, 100];
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 10;
    return validLimits.includes(parsedLimit) ? parsedLimit : 10;
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [selectedImage, setSelectedImage] = useState<DatasetImage | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Функция для обновления страницы с синхронизацией URL
  const updateCurrentPage = (page: number) => {
    setCurrentPage(page);
    const newSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newSearchParams.delete('p');
    } else {
      newSearchParams.set('p', page.toString());
    }
    setSearchParams(newSearchParams);
  };

  // Функция для обновления лимита с синхронизацией URL
  const updateLimit = (newLimit: number) => {
    setLimit(newLimit);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newLimit === 10) {
      newSearchParams.delete('limit');
    } else {
      newSearchParams.set('limit', newLimit.toString());
    }
    // При изменении лимита сбрасываем на первую страницу
    newSearchParams.delete('p');
    setCurrentPage(1);
    setSearchParams(newSearchParams);
  };

  // useEffect для обновления currentPage и limit из URL
  useEffect(() => {
    const pageParam = searchParams.get('p');
    const limitParam = searchParams.get('limit');
    const newPage = pageParam ? parseInt(pageParam, 10) : 1;
    const validLimits = [10, 25, 50, 100];
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 10;
    const newLimit = validLimits.includes(parsedLimit) ? parsedLimit : 10;
    
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
    if (newLimit !== limit) {
      setLimit(newLimit);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDataset = async () => {
      if (!id) return;
      
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/${id}?page=${currentPage}&limit=${limit}`, { headers });
        setDataset(response.data);
        setImages(response.data.images.data);
        setTotalImages(response.data.images.total);
        setTotalPages(Math.ceil(response.data.images.total / response.data.images.limit));
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('У вас нет прав для просмотра этого датасета.');
        } else if (err.response?.status === 404) {
          setError('Датасет не найден.');
        } else {
          setError('Не удалось загрузить датасет.');
        }
        console.error(err);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    };

    fetchDataset();
  }, [id, currentPage, limit]);

  // Этот useEffect больше не нужен - загрузка данных объединена в первом useEffect

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (!id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(response.data.message || 'File uploaded successfully!');
      
      // Обновляем данные после успешной загрузки
      updateCurrentPage(1); // Сбрасываем на первую страницу - это автоматически запустит перезагрузку данных

    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to upload file.');
      console.error(err);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

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
      // Убираем query параметры, если есть
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
    
    // Список популярных соотношений сторон
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

    // Ищем ближайшее стандартное соотношение
    let closest = commonRatios[0];
    let minDifference = Math.abs(ratio - closest.ratio);

    for (const common of commonRatios) {
      const difference = Math.abs(ratio - common.ratio);
      if (difference < minDifference) {
        minDifference = difference;
        closest = common;
      }
    }

    // Если разница меньше 0.03, используем стандартное обозначение
    if (minDifference < 0.03) {
      return closest.label;
    }

    // Упрощаем дробь с помощью НОД
    const divisor = gcd(width, height);
    const simplifiedWidth = width / divisor;
    const simplifiedHeight = height / divisor;

    // Если упрощенные числа получились большими (больше 50), округляем к ближайшему стандарту
    if (simplifiedWidth > 50 || simplifiedHeight > 50) {
      return closest.label;
    }

    return `${simplifiedWidth}:${simplifiedHeight}`;
  };

  const getPaginationGroup = () => {
    const pageCount = totalPages;
    const currentPageLocal = currentPage;
    const siblings = 2; // Расширено с 1 до 2 для показа большего количества страниц
    const totalPageNumbers = siblings * 2 + 3; // a.k.a 7: first, last, current, four siblings

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
    return []; // Should not happen
  };

  const canUpload = user && dataset && (user.role === 'Administrator' || (dataset.user && user.id === dataset.user.id));

  return (
    <div className="min-h-screen bg-background">
      <DatasetHeader dataset={dataset || undefined} />
      <main className="container mx-auto px-4 py-8" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        {loading && <Skeleton className="mb-4 h-8 w-1/2" />}
        {error && <p className="text-red-500">{error}</p>}
        {dataset && (
          <div>
            <h1 className="text-3xl font-bold mb-2">{dataset.name}</h1>
            
            <Accordion type="single" collapsible className="w-full mb-6">
              <AccordionItem value="item-1">
                <AccordionTrigger>Dataset Card</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-6">{dataset.description}</p>
                   {canUpload && (
                    <div className="my-6 p-4 border rounded-lg">
                      <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a CSV file with columns: filename, url, width, height, prompt.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs" />
                        <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>


            {/* Image display */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Dataset Images ({totalImages})</h2>
              {imagesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : images.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table className="table-auto w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead className="min-w-[10rem] max-w-[16rem] w-1/4">Image Key</TableHead>
                        <TableHead className="min-w-[10rem] max-w-[16rem] w-1/6">Filename</TableHead>
                        <TableHead className="min-w-[12rem] max-w-[20rem] w-1/6">Image</TableHead>
                        <TableHead className="w-20">Dimensions</TableHead>
                        <TableHead className="min-w-[16rem] max-w-[32rem] w-1/3">Prompt</TableHead>
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
                                Image details
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
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Items per page:</span>
                      <Select value={limit.toString()} onValueChange={(value) => updateLimit(parseInt(value, 10))}>
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
                              updateCurrentPage(Math.max(currentPage - 1, 1));
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
                                  updateCurrentPage(item as number);
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
                              updateCurrentPage(Math.min(currentPage + 1, totalPages));
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none text-muted-foreground' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    </div>
                  </div>
                </>
              ) : (
                <p>No images found in this dataset.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DatasetPage;
