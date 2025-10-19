import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileJson, Loader2, FileText, Table } from 'lucide-react';
import axios from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetId: string;
  datasetName: string;
}

type ExportFormat = 'kohya' | 'url-list-txt' | 'url-list-csv';

export const ExportDialog = ({ open, onOpenChange, datasetId, datasetName }: ExportDialogProps) => {
  const { t } = useTranslation(['pages', 'common']);
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('kohya');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let endpoint = '';
      let filename = '';
      
      switch (selectedFormat) {
        case 'kohya':
          endpoint = `/datasets/${datasetId}/export/kohya`;
          filename = `${datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}_kohya.jsonl`;
          break;
        case 'url-list-txt':
          endpoint = `/datasets/${datasetId}/export/url-list-txt`;
          filename = `${datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}_urls.txt`;
          break;
        case 'url-list-csv':
          endpoint = `/datasets/${datasetId}/export/url-list-csv`;
          filename = `${datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}_urls.csv`;
          break;
        default:
          throw new Error('Unknown export format');
      }

      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: t('pages:dataset.export.success'),
        description: t('pages:dataset.export.successDescription'),
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Export failed:', error);
      
      // Check if it's a 400 error (no images)
      const errorMessage = error.response?.status === 400 
        ? (error.response?.data?.message || t('pages:dataset.export_no_images'))
        : t('pages:dataset.export.errorDescription');
      
      toast({
        title: t('pages:dataset.export.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('pages:dataset.export.title')}</DialogTitle>
          <DialogDescription>
            {t('pages:dataset.export.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('pages:dataset.export.formatLabel')}</Label>
            <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="kohya" id="kohya" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="kohya" className="cursor-pointer font-medium">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Kohya SS / sd-scripts (JSONL)
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages:dataset.export.kohyaDescription')}
                  </p>
                  <div className="mt-2 rounded-md bg-muted p-2 text-xs font-mono">
                    {'{"file_name": "path/to/image.jpg", "caption": "..."}'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="url-list-txt" id="url-list-txt" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="url-list-txt" className="cursor-pointer font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('pages:dataset.export.urlListTxtTitle')}
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages:dataset.export.urlListTxtDescription')}
                  </p>
                  <div className="mt-2 rounded-md bg-muted p-2 text-xs font-mono">
                    https://example.com/image1.jpg<br />
                    https://example.com/image2.jpg<br />
                    https://example.com/image3.jpg
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="url-list-csv" id="url-list-csv" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="url-list-csv" className="cursor-pointer font-medium">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {t('pages:dataset.export.urlListCsvTitle')}
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages:dataset.export.urlListCsvDescription')}
                  </p>
                  <div className="mt-2 rounded-md bg-muted p-2 text-xs font-mono">
                    url,filename,width,height<br />
                    "https://example.com/img.jpg","img.jpg",512,512
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">{t('pages:dataset.export.noteTitle')}</p>
            <p>{t('pages:dataset.export.noteContent')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('common:cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('pages:dataset.export.exporting')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('pages:dataset.export.exportButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

