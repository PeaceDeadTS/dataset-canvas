import { ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<DatasetImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<DatasetImage | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);


  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/${id}`, { headers });
        setDataset(response.data);
      } catch (err) {
        setError('Failed to fetch dataset details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      // fetchDataset(); // This is now redundant, fetchImages does it all.
    }
  }, [id]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!id) return;
      setImagesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/${id}?page=${currentPage}&limit=10`, { headers });
        
        // When just paginating, we only need to update images and totals
        // The main dataset object should already be loaded.
        if (!dataset) {
            setDataset(response.data);
        }
        setImages(response.data.images.data);
        setTotalPages(Math.ceil(response.data.images.total / response.data.images.limit));

      } catch (err) {
        toast.error('Failed to fetch images.');
        console.error(err);
      } finally {
        setImagesLoading(false);
      }
    };
    fetchImages();
  }, [id, currentPage, dataset]);

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
      
      // --- УЛУЧШЕНИЕ ЛОГИКИ ОБНОВЛЕНИЯ ---
      // Вместо перезагрузки страницы, мы вручную вызовем функцию 
      // для повторной загрузки данных, чтобы обеспечить плавное обновление.
      
      // Обернем fetchImages в useCallback, чтобы избежать лишних ререндеров
      // и иметь стабильную ссылку на функцию.
      const fetchImagesAfterUpload = async () => {
        if (!id) return;
        setImagesLoading(true);
        try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(`${API_URL}/${id}?page=1&limit=10`, { headers });
          
          if (!dataset) {
              setDataset(response.data);
          }
          setImages(response.data.images.data);
          setTotalPages(Math.ceil(response.data.images.total / response.data.images.limit));
          setCurrentPage(1); // Сбрасываем на первую страницу

        } catch (err) {
          toast.error('Failed to refresh images after upload.');
        } finally {
          setImagesLoading(false);
        }
      };

      fetchImagesAfterUpload();

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

  const getPaginationGroup = () => {
    const pageCount = totalPages;
    const currentPageLocal = currentPage;
    const siblings = 1;
    const totalPageNumbers = siblings * 2 + 3; // a.k.a 5: first, last, current, two siblings

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

  const canUpload = user && dataset && (user.role === 'Administrator' || user.id === dataset.user.id);

  return (
    <div className="min-h-screen bg-background">
      <DatasetHeader dataset={dataset || undefined} />
      <main className="mx-auto max-w-7xl px-6 py-8">
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
              <h2 className="text-xl font-semibold mb-4">Dataset Images ({dataset.images?.total || 0})</h2>
              {imagesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : images.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Row</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Dimensions</TableHead>
                        <TableHead>Prompt</TableHead>
                        <TableHead className="w-[280px]">Image Key</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map((image) => (
                        <Dialog key={image.id}>
                          <DialogTrigger asChild>
                            <TableRow className="cursor-pointer">
                              <TableCell>{image.row_number}</TableCell>
                              <TableCell onClick={(e) => { e.stopPropagation(); openLightbox(image); }}>
                                <img src={image.url} alt={image.filename} className="h-16 w-16 object-cover rounded" />
                              </TableCell>
                              <TableCell>{image.filename}</TableCell>
                              <TableCell>{`${image.width}x${image.height}`}</TableCell>
                              <TableCell className="max-w-xs truncate">{image.prompt}</TableCell>
                              <TableCell className="font-mono text-xs">{image.img_key}</TableCell>
                            </TableRow>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>{image.filename}</DialogTitle>
                              <DialogDescription>
                                Image details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                               <img src={image.url} alt={image.filename} className="w-full h-auto object-contain rounded-md" />
                               <div className="text-sm space-y-2">
                                <p><strong>Dimensions:</strong> {image.width}x{image.height}</p>
                                <p><strong>Prompt:</strong> {image.prompt}</p>
                                <p className="font-mono text-xs"><strong>Key:</strong> {image.img_key}</p>
                               </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </TableBody>
                  </Table>
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
                  <div className="flex justify-center mt-4">
                     <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((prev) => Math.max(prev - 1, 1));
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
                                  setCurrentPage(item as number);
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
                              setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none text-muted-foreground' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
