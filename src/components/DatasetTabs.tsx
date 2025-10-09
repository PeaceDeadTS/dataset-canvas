import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatasetCardTab } from '@/components/DatasetCardTab';
import { DataStudioTab } from '@/components/DataStudioTab';
import { FilesAndVersionsTab } from '@/components/FilesAndVersionsTab';
import { CommunityTab } from '@/components/CommunityTab';
import { Dataset, DatasetImage } from '@/types';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

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
  onVisibilityChange?: (newVisibility: boolean) => void;
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
  onVisibilityChange,
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
            <DatasetCardTab 
              dataset={dataset} 
              canUpload={canUpload} 
              onUploadSuccess={onUploadSuccess} 
              onVisibilityChange={onVisibilityChange}
            />
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

    </div>
  );
};