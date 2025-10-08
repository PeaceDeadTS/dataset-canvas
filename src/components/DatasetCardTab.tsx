import React, { ChangeEvent, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dataset, DatasetStatistics } from '@/types';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, BarChart3, Calendar, User, Lock, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { useParams } from 'react-router-dom';

interface DatasetCardTabProps {
  dataset: Dataset;
  canUpload: boolean;
  onUploadSuccess: () => void;
}

export const DatasetCardTab: React.FC<DatasetCardTabProps> = ({
  dataset,
  canUpload,
  onUploadSuccess,
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const { id } = useParams<{ id: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statistics, setStatistics] = useState<DatasetStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showAllResolutions, setShowAllResolutions] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const loadStatistics = async () => {
    if (!id) return;
    
    try {
      setLoadingStats(true);
      const response = await axios.get(`/datasets/${id}/statistics`);
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Failed to load dataset statistics:', err);
      // Не показываем ошибку пользователю, просто не загружаем статистику
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(t('pages:dataset.no_file_selected'));
      return;
    }
    if (!id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`/datasets/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message || t('pages:dataset.upload_success'));
      onUploadSuccess();
      // Перезагружаем статистику после успешной загрузки
      await loadStatistics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data || t('pages:dataset.upload_error'));
      console.error(err);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-6" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        <div className="space-y-6">
          {/* Dataset Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('pages:dataset.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <h2 className="text-2xl font-bold">{dataset.name}</h2>
                <Badge variant={dataset.isPublic ? "default" : "secondary"}>
                  {dataset.isPublic ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      {t('common:public')}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      {t('common:private')}
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  <FileText className="w-3 h-3 mr-1" />
                  {dataset.format || 'CSV'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{t('common:author')}: {dataset.user?.username || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t('common:created')}: {formatDate(dataset.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">{t('pages:dataset.description')}</h3>
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-muted-foreground/20">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {dataset.description || t('pages:datasets.no_description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dataset Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('pages:dataset.statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {loadingStats ? '...' : (statistics?.totalSamples || '0')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('pages:dataset.total_samples')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {loadingStats ? '...' : (statistics?.avgPromptLength || '0')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('pages:dataset.avg_prompt_length')}
                  </div>
                </div>
              </div>

              {/* Resolution Statistics */}
              {!loadingStats && statistics && statistics.resolutionStats.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">{t('pages:dataset.resolution_distribution')}</h4>
                  <div className="space-y-2">
                    {statistics.resolutionStats
                      .slice(0, showAllResolutions ? statistics.resolutionStats.length : 5)
                      .map(({ resolution, count, percentage }) => (
                        <div key={resolution} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm font-mono truncate">{resolution}</span>
                            <span className="text-xs text-muted-foreground">
                              {count} {t('common:pairs')}, {percentage}%
                            </span>
                          </div>
                          <div className="w-20">
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                      ))}
                    
                    {/* Toggle button for showing more/less resolutions */}
                    {statistics.resolutionStats.length > 5 && (
                      <div className="text-center mt-3">
                        <button
                          onClick={() => setShowAllResolutions(!showAllResolutions)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {showAllResolutions ? (
                            t('pages:dataset.show_less_resolutions')
                          ) : (
                            t('pages:dataset.and_more_resolutions', { 
                              count: statistics.resolutionStats.length - 5 
                            })
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Training Compatibility Check */}
              {!loadingStats && statistics && (
                <div className={`p-3 rounded-lg border ${
                  statistics.divisibilityCheck.allDivisibleBy64 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {statistics.divisibilityCheck.allDivisibleBy64 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {statistics.divisibilityCheck.allDivisibleBy64 
                        ? t('pages:dataset.training_compatible') 
                        : t('pages:dataset.training_warning')
                      }
                    </span>
                  </div>
                  {!statistics.divisibilityCheck.allDivisibleBy64 && (
                    <p className="text-xs mt-1">
                      {t('pages:dataset.divisibility_details', {
                        compatible: statistics.divisibilityCheck.divisibleCount,
                        total: statistics.divisibilityCheck.totalCount
                      })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Section */}
          {canUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {t('pages:dataset.upload_csv')}
                </CardTitle>
                <CardDescription>
                  {t('pages:dataset.upload_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="max-w-xs"
                    placeholder={t('pages:dataset.select_file')} 
                  />
                  <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? t('pages:dataset.uploading') : t('common:upload')}
                  </Button>
                </div>
                {!selectedFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('pages:dataset.no_file_selected')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
