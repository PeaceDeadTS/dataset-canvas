import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { X, HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

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
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {t('common:discussions.quote')}: Ctrl+Enter
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <HelpCircle className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t('common:markdown.supported', 'Markdown Supported')}</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>**{t('common:markdown.bold', 'bold')}**</p>
                  <p>*{t('common:markdown.italic', 'italic')}*</p>
                  <p>~~{t('common:markdown.strikethrough', 'strikethrough')}~~</p>
                  <p>[{t('common:markdown.link', 'link')}](url)</p>
                  <p>![{t('common:markdown.image', 'image')}](url)</p>
                  <p>`{t('common:markdown.code', 'code')}`</p>
                  <p>```{t('common:markdown.codeBlock', 'code block')}```</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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

