import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MDEditor from '@uiw/react-md-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Card } from './ui/card';

interface MarkdownEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  showTabs?: boolean;
  className?: string;
}

export function MarkdownEditorField({
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 200,
  showTabs = true,
  className = '',
}: MarkdownEditorFieldProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const defaultPlaceholder = t(
    'common:markdown.placeholder',
    'Write your message using Markdown...\n\n**bold**, *italic*, [link](url), ![image](url), `code`'
  );

  if (!showTabs) {
    // Простой режим без вкладок
    return (
      <div className={className} data-color-mode="auto">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={minHeight}
          preview="edit"
          hideToolbar={false}
          enableScroll={true}
          visibleDragbar={false}
          textareaProps={{
            placeholder: placeholder || defaultPlaceholder,
            disabled,
          }}
        />
      </div>
    );
  }

  // Режим с вкладками Edit/Preview
  return (
    <Card className={`p-0 ${className}`}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2 rounded-b-none">
          <TabsTrigger value="edit">{t('common:markdown.edit', 'Edit')}</TabsTrigger>
          <TabsTrigger value="preview">{t('common:markdown.preview', 'Preview')}</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-0 border-t" data-color-mode="auto">
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            height={minHeight}
            preview="edit"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={false}
            textareaProps={{
              placeholder: placeholder || defaultPlaceholder,
              disabled,
            }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 border-t p-4" style={{ minHeight: `${minHeight}px` }}>
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t('common:markdown.noPreview', 'Nothing to preview. Start writing in the Edit tab.')}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

