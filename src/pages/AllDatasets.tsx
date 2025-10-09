import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { DatasetListItem } from "@/components/DatasetListItem";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateDataset } from "@/contexts/CreateDatasetContext";
import { Dataset } from "@/types";
import axios from "@/lib/axios";
import { useTranslation } from 'react-i18next';
import { PlusCircle } from "lucide-react";

type SortField = 'name' | 'createdAt' | 'imageCount' | 'username';
type SortOrder = 'ASC' | 'DESC';

interface DatasetWithImageCount extends Dataset {
  imageCount: number;
}

const AllDatasetsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openDialog } = useCreateDataset();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allDatasets, setAllDatasets] = useState<DatasetWithImageCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<SortOrder>('DESC');
  
  // Получаем активную вкладку из URL
  const activeTab = searchParams.get('tab') || 'public';

  useEffect(() => {
    fetchDatasets();
  }, [sortBy, order, user]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/datasets', {
        params: { sortBy, order }
      });
      
      setAllDatasets(response.data);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Разделяем датасеты на три категории
  const publicDatasets = allDatasets.filter(dataset => dataset.isPublic);
  const myPublicDatasets = allDatasets.filter(dataset => dataset.isPublic && dataset.user?.id === user?.id);
  const myPrivateDatasets = allDatasets.filter(dataset => !dataset.isPublic && dataset.user?.id === user?.id);

  const DatasetGrid = ({ datasets, emptyMessage }: { datasets: DatasetWithImageCount[], emptyMessage: string }) => (
    <>
      {datasets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <DatasetListItem key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t('pages:datasets.title')}</h1>
              <p className="text-gray-600 mt-2">{t('pages:datasets.description')}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <Button onClick={openDialog} size="lg">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('pages:create_dataset.title')}
                </Button>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('pages:datasets.sort_by')}</label>
                <Select value={sortBy} onValueChange={(value: SortField) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{t('pages:datasets.sort_by_name')}</SelectItem>
                    <SelectItem value="createdAt">{t('pages:datasets.sort_by_created')}</SelectItem>
                    <SelectItem value="imageCount">{t('pages:datasets.sort_by_pairs')}</SelectItem>
                    <SelectItem value="username">{t('pages:datasets.sort_by_author')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('pages:datasets.order')}</label>
                <Select value={order} onValueChange={(value: SortOrder) => setOrder(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASC">{t('common:ascending')}</SelectItem>
                    <SelectItem value="DESC">{t('common:descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Separator />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('tab', value);
              setSearchParams(newParams);
            }}
            className="w-full"
          >
            <TabsList className={`grid w-full mb-8 ${user ? 'grid-cols-3 max-w-2xl' : 'grid-cols-1 max-w-md'}`}>
              <TabsTrigger value="public" className="relative">
                {t('pages:datasets.public_tab')}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {publicDatasets.length}
                </Badge>
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my-public" className="relative">
                  {t('pages:datasets.my_public_tab')}
                  <Badge variant="default" className="ml-2 text-xs">
                    {myPublicDatasets.length}
                  </Badge>
                </TabsTrigger>
              )}
              {user && (
                <TabsTrigger value="my-private" className="relative">
                  {t('pages:datasets.my_private_tab')}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {myPrivateDatasets.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="public">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {t('pages:datasets.public_title')}
                </h2>
                <p className="text-gray-600">
                  {t('pages:datasets.public_description')}
                </p>
              </div>
              <DatasetGrid 
                datasets={publicDatasets} 
                emptyMessage={t('pages:datasets.no_public_datasets')}
              />
            </TabsContent>
            
            {user && (
              <TabsContent value="my-public">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {t('pages:datasets.my_public_title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('pages:datasets.my_public_description')}
                  </p>
                </div>
                <DatasetGrid 
                  datasets={myPublicDatasets} 
                  emptyMessage={t('pages:datasets.no_my_public_datasets')}
                />
              </TabsContent>
            )}
            
            {user && (
              <TabsContent value="my-private">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {t('pages:datasets.my_private_title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('pages:datasets.my_private_description')}
                  </p>
                </div>
                <DatasetGrid 
                  datasets={myPrivateDatasets} 
                  emptyMessage={t('pages:datasets.no_my_private_datasets')}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AllDatasetsPage;
