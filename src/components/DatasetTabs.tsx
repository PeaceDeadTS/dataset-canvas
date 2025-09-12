import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatasetCardTab } from '@/components/DatasetCardTab';
import { DataStudioTab } from '@/components/DataStudioTab';
import { FilesAndVersionsTab } from '@/components/FilesAndVersionsTab';
import { CommunityTab } from '@/components/CommunityTab';
import { Dataset, DatasetImage } from '@/types';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatasetTabsProps {
  dataset: Dataset;
  images: DatasetImage[];
  imagesLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalImages: number;
  limit: number;
  canUpload: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onUploadSuccess: () => void;
}

export const DatasetTabs: React.FC<DatasetTabsProps> = ({
  dataset,
  images,
  imagesLoading,
  currentPage,
  totalPages,
  totalImages,
  limit,
  canUpload,
  onPageChange,
  onLimitChange,
  onUploadSuccess,
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Получаем текущую вкладку из URL параметров
  const activeTab = searchParams.get('tab') || 'dataset-card';
  
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === 'dataset-card') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    setSearchParams(newSearchParams);
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
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex-none border-b bg-background">
          <div className="container mx-auto px-4" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            <TabsList className="grid grid-cols-4 w-fit bg-transparent h-auto p-0">
              <TabsTrigger 
                value="dataset-card" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                {t('pages:dataset.dataset_card')}
              </TabsTrigger>
              <TabsTrigger 
                value="data-studio" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                {t('pages:dataset.data_studio')}
              </TabsTrigger>
              <TabsTrigger 
                value="files-versions" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                {t('pages:dataset.files_and_versions')}
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                {t('pages:dataset.community')}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="dataset-card" className="h-full m-0 data-[state=inactive]:hidden">
            <DatasetCardTab dataset={dataset} canUpload={canUpload} onUploadSuccess={onUploadSuccess} />
          </TabsContent>
          
          <TabsContent value="data-studio" className="h-full m-0 data-[state=inactive]:hidden">
            <DataStudioTab
              dataset={dataset}
              images={images}
              imagesLoading={imagesLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalImages={totalImages}
              limit={limit}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
            />
          </TabsContent>
          
          <TabsContent value="files-versions" className="h-full m-0 data-[state=inactive]:hidden">
            <FilesAndVersionsTab dataset={dataset} />
          </TabsContent>
          
          <TabsContent value="community" className="h-full m-0 data-[state=inactive]:hidden">
            <CommunityTab dataset={dataset} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer - Pagination (только для Data Studio) */}
      {activeTab === 'data-studio' && images.length > 0 && (
        <div className="flex-none bg-background border-t">
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
    </div>
  );
};