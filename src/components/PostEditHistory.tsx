import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscussionEditHistory } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { DiffViewer } from './DiffViewer';
import axios from '../lib/axios';
import { useToast } from '../hooks/use-toast';

interface PostEditHistoryProps {
  postId: number;
}

export function PostEditHistory({ postId }: PostEditHistoryProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? ru : enUS;
  const { toast } = useToast();
  const [history, setHistory] = useState<DiscussionEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [postId]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`/posts/${postId}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch edit history:', error);
      toast({
        title: t('common:error'),
        description: 'Failed to load edit history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  const toggleHistoryExpand = (historyId: number) => {
    setExpandedHistoryId(expandedHistoryId === historyId ? null : historyId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          {t('common:discussions.noEditHistory')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">{t('common:discussions.editHistory')}</h4>
      {history.map((entry) => (
        <Card key={entry.id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {entry.editor?.username || 'Unknown'}
                </span>
                <span className="text-muted-foreground">
                  {t('common:discussions.edited')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(entry.editedAt)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleHistoryExpand(entry.id)}
            >
              {expandedHistoryId === entry.id ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {t('common:discussions.hideEditHistory')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('common:discussions.showEditHistory')}
                </>
              )}
            </Button>
          </div>

          {expandedHistoryId === entry.id && (
            <div className="mt-3">
              <DiffViewer
                oldText={entry.oldContentMarkdown || entry.oldContent}
                newText={entry.newContentMarkdown || entry.newContent}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

