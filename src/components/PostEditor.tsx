import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X } from 'lucide-react';
import { MarkdownEditorField } from './MarkdownEditorField';

interface PostEditorProps {
  initialContent?: string;
  replyTo?: { username: string; content: string } | null;
  placeholder?: string;
  onSubmit: (content: string, contentMarkdown?: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PostEditor({
  initialContent = '',
  replyTo,
  placeholder,
  onSubmit,
  onCancel,
  submitLabel,
}: PostEditorProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Send both plain content and markdown (same for now, as users type markdown)
      await onSubmit(content, content);
      setContent('');
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      {replyTo && (
        <div className="mb-3 p-2 bg-muted rounded-md flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">{t('common:discussions.replyTo', { username: replyTo.username })}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {replyTo.content}
            </p>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <MarkdownEditorField
        value={content}
        onChange={setContent}
        placeholder={placeholder || t('common:discussions.replyPlaceholder')}
        disabled={isSubmitting}
        minHeight={200}
        showTabs={true}
      />

      <div className="flex items-center justify-end gap-2 mt-3">
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('common:discussions.cancel')}
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting
            ? t('common:loading')
            : submitLabel || t('common:discussions.reply')}
        </Button>
      </div>
    </Card>
  );
}

