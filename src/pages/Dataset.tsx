import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '@/lib/axios';
import { AppHeader } from '@/components/AppHeader';
import { DatasetBreadcrumb } from '@/components/DatasetBreadcrumb';
import { DatasetTabs } from '@/components/DatasetTabs';
import { Dataset, DatasetImage } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const API_URL = '/datasets';

const DatasetPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation(['pages', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const response = await axios.get(`${API_URL}/${id}?page=${currentPage}&limit=${limit}`);
        setDataset(response.data);
        setImages(response.data.images.data);
        setTotalImages(response.data.images.total);
        setTotalPages(Math.ceil(response.data.images.total / response.data.images.limit));
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError(t('common:error_access_denied'));
        } else if (err.response?.status === 404) {
          setError(t('common:error_not_found'));
        } else {
          setError(t('common:error_load_failed'));
        }
        console.error(err);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    };

    fetchDataset();
  }, [id, currentPage, limit]);

  const handleUploadSuccess = () => {
    // Сбрасываем на первую страницу для загрузки новых данных
    updateCurrentPage(1);
  };

  const handleVisibilityChange = (newVisibility: boolean) => {
    // Обновляем локальное состояние датасета
    if (dataset) {
      setDataset({ ...dataset, isPublic: newVisibility });
    }
  };

  const handleDescriptionUpdate = (descriptionMarkdown: string) => {
    // Обновляем описание в локальном состоянии
    if (dataset) {
      setDataset({ 
        ...dataset, 
        descriptionMarkdown,
        description: descriptionMarkdown.substring(0, 500)
      });
    }
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

  const canUpload = user && dataset && (user.role === 'Administrator' || (dataset.user && user.id === dataset.user.id));

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* App Header */}
      <AppHeader />
      
      {/* Dataset Breadcrumb */}
      {dataset && <DatasetBreadcrumb dataset={dataset} />}
      
      {/* Dataset Info Section */}
      <div className="flex-none bg-background border-b">
        <div className="container mx-auto px-4 py-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          {loading && <Skeleton className="mb-4 h-8 w-1/2" />}
          {error && <p className="text-red-500">{error}</p>}
          {dataset && (
            <h1 className="text-3xl font-bold">{dataset.name}</h1>
          )}
        </div>
      </div>

      {/* Main Content with Tabs */}
      {dataset && (
        <>
          <div className="flex-1 overflow-hidden">
            <DatasetTabs
              dataset={dataset}
              images={images}
              imagesLoading={imagesLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalImages={totalImages}
              limit={limit}
              canUpload={canUpload}
              onPageChange={updateCurrentPage}
              onLimitChange={updateLimit}
              onUploadSuccess={handleUploadSuccess}
              onVisibilityChange={handleVisibilityChange}
              onDescriptionUpdate={handleDescriptionUpdate}
            />
          </div>

          {/* Sticky Footer - Pagination */}
          {images.length > 0 && searchParams.get('tab') === 'data-studio' && (
            <div className="flex-none bg-background border-t">
              <div className="container mx-auto px-4 py-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('pages:dataset.items_per_page')}:</span>
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
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DatasetPage;
