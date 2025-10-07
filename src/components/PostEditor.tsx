import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { X } from 'lucide-react';

interface PostEditorProps {
  initialContent?: string;
  replyTo?: { username: string; content: string } | null;
  placeholder?: string;
  onSubmit: (content: string) => Promise<void>;
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
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
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

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('common:discussions.replyPlaceholder')}
        rows={4}
        disabled={isSubmitting}
        className="resize-none"
      />

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">
          {t('common:discussions.quote')}: Ctrl+Enter
        </p>
        <div className="flex gap-2">
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
      </div>
    </Card>
  );
}

