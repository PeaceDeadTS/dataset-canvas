import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface CreateDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDiscussion: (title: string, content: string, contentMarkdown?: string) => Promise<void>;
}

export function CreateDiscussionDialog({
  open,
  onOpenChange,
  onCreateDiscussion,
}: CreateDiscussionDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateDiscussion(title, content, content); // Send same content as markdown for now
      setTitle('');
      setContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create discussion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('discussions.createDiscussion')}</DialogTitle>
          <DialogDescription>
            {t('community.discussionsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('discussions.discussionTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('discussions.discussionTitlePlaceholder')}
              disabled={isSubmitting}
            />
            {title.trim() === '' && (
              <p className="text-xs text-destructive">{t('discussions.titleRequired')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('discussions.firstPost')}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('discussions.firstPostPlaceholder')}
              rows={6}
              disabled={isSubmitting}
            />
            {content.trim() === '' && (
              <p className="text-xs text-destructive">{t('discussions.contentRequired')}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('discussions.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('discussions.createDiscussion')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

