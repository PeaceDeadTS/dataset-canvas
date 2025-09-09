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
      fetchDataset();
    }
  }, [id]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!id) return;
      setImagesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/${id}/images?page=${currentPage}&limit=10`, { headers });
        setImages(response.data.data);
        setTotalPages(response.data.last_page);
      } catch (err) {
        toast.error('Failed to fetch images.');
        console.error(err);
      } finally {
        setImagesLoading(false);
      }
    };
    fetchImages();
  }, [id, currentPage]);

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
      // Refresh image list after upload
      setCurrentPage(1); // Reset to first page to see new images
      // Manually trigger refetch, ideally fetchImages() would be called here.
      // The dependency array on `currentPage` change will trigger it if it was not 1.
      // If it was already 1, we need a better way. For now, this is a simple solution.
      if (currentPage === 1) {
          // This is a bit of a hack to re-trigger the useEffect
          // A better solution would be to wrap fetchImages in a useCallback and call it here.
          window.location.reload();
      }

    } catch (err: any) {
      toast.error(err.response?.data || 'Failed to upload file.');
      console.error(err);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const canUpload = user && dataset && (user.role === 'Administrator' || user.userId === dataset.user.id);

  return (
    <div className="min-h-screen bg-background">
      <DatasetHeader dataset={dataset || undefined} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && <Skeleton className="mb-4 h-8 w-1/2" />}
        {error && <p className="text-red-500">{error}</p>}
        {dataset && (
          <div>
            <h1 className="text-3xl font-bold mb-2">{dataset.name}</h1>
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

            {/* Image display */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Dataset Images ({dataset.imageCount || 0})</h2>
              {imagesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : images.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Dimensions</TableHead>
                        <TableHead>Prompt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map((image) => (
                        <TableRow key={image.id}>
                          <TableCell>
                            <img src={image.url} alt={image.filename} className="h-16 w-16 object-cover rounded" />
                          </TableCell>
                          <TableCell>{image.filename}</TableCell>
                          <TableCell>{`${image.width}x${image.height}`}</TableCell>
                          <TableCell className="max-w-xs truncate">{image.prompt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination className="mt-4">
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
                      {/* Simple pagination numbers - can be improved */}
                      {[...Array(totalPages)].map((_, i) => (
                         <PaginationItem key={i}>
                            <PaginationLink
                                href="#"
                                isActive={currentPage === i + 1}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(i + 1);
                                }}
                            >
                                {i + 1}
                            </PaginationLink>
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
