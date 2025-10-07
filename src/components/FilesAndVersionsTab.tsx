import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dataset, DatasetFile } from '@/types';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Calendar } from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';

interface FilesAndVersionsTabProps {
  dataset: Dataset;
}

export const FilesAndVersionsTab: React.FC<FilesAndVersionsTabProps> = ({
  dataset,
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`/datasets/${dataset.id}/files`);
        setFiles(response.data.files);
      } catch (err: any) {
        console.error('Error loading files:', err);
        setError(t('pages:dataset.error_loading_files') || 'Error loading files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [dataset.id, t]);

  const handleDownload = async (fileId: number) => {
    try {
      const response = await axios.get(`/datasets/${dataset.id}/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Get filename from response headers or find it in our files data
      const file = files.find(f => f.id === fileId);
      const filename = file?.originalName || 'download.csv';
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('pages:dataset.download_success'));
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.error || t('pages:dataset.download_error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-6" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        <div className="space-y-6">
          {/* Files Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('pages:dataset.files_and_versions')}</h2>
            <p className="text-muted-foreground">
              {t('pages:dataset.files_description')}
            </p>
          </div>

          {/* Files List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('pages:dataset.dataset_files')}
              </CardTitle>
              <CardDescription>
                {t('pages:dataset.dataset_files_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span>{file.description || t('pages:dataset.original_upload')}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(file.createdAt)}
                            </span>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {t('pages:dataset.download_csv')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('pages:dataset.no_files')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages:dataset.version_history')}</CardTitle>
              <CardDescription>
                {t('pages:dataset.version_history_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('pages:dataset.version_history_coming_soon')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
