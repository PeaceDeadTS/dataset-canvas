import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MDEditor from '@uiw/react-md-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Loader2 } from 'lucide-react';

interface DatasetDescriptionEditorProps {
  initialValue: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (markdown: string) => Promise<void>;
}

export function DatasetDescriptionEditor({
  initialValue,
  isOpen,
  onClose,
  onSave,
}: DatasetDescriptionEditorProps) {
  const { t } = useTranslation();
  const [markdown, setMarkdown] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(markdown);
      onClose();
    } catch (error) {
      console.error('Failed to save description:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setMarkdown(initialValue);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('pages.dataset.editDescription', 'Edit Dataset Description')}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">{t('pages.dataset.editTab', 'Edit')}</TabsTrigger>
            <TabsTrigger value="preview">{t('pages.dataset.previewTab', 'Preview')}</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-hidden mt-2" data-color-mode="auto">
            <div className="h-full overflow-auto">
              <MDEditor
                value={markdown}
                onChange={(val) => setMarkdown(val || '')}
                height="100%"
                preview="edit"
                hideToolbar={false}
                enableScroll={true}
                visibleDragbar={false}
                textareaProps={{
                  placeholder: t(
                    'pages.dataset.descriptionPlaceholder',
                    'Write your dataset description using Markdown...\n\n# Example\n\n- You can use **bold** and *italic* text\n- Add images: ![alt](https://example.com/image.png)\n- Create [links](https://example.com)\n- Add code blocks\n- And much more!'
                  ),
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-2 border rounded-lg p-4">
            {markdown ? (
              <MarkdownRenderer content={markdown} />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t('pages.dataset.noPreview', 'Nothing to preview. Start writing in the Edit tab.')}
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

