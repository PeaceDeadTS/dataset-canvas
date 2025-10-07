import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaptionHistoryEntry } from '@/types';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { DiffViewer } from './DiffViewer';

interface CaptionHistoryListProps {
  history: CaptionHistoryEntry[];
  currentCaption: string;
}

export const CaptionHistoryList: React.FC<CaptionHistoryListProps> = ({
  history,
  currentCaption,
}) => {
  const { t } = useTranslation(['pages']);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        {t('pages:dataset.history_empty')}
      </div>
    );
  }

  const displayedHistory = isExpanded ? history : history.slice(0, 3);
  const hasMore = history.length > 3;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('pages:dataset.history_just_now');
    if (diffMins < 60) return t('pages:dataset.history_minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('pages:dataset.history_hours_ago', { count: diffHours });
    if (diffDays < 7) return t('pages:dataset.history_days_ago', { count: diffDays });
    
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('pages:dataset.history_title')} ({history.length})
        </h4>
      </div>

      <Separator />

      <div className="space-y-3">
        {displayedHistory.map((entry) => {
          const isSelected = selectedHistoryId === entry.id;
          
          return (
            <div key={entry.id} className="space-y-2">
              <button
                onClick={() => setSelectedHistoryId(isSelected ? null : entry.id)}
                className="w-full text-left p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium">
                        {entry.user?.username || t('pages:dataset.history_deleted_user')}
                      </span>
                      <span className="text-muted-foreground">{t('pages:dataset.history_user_edited')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {isSelected ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </button>

              {isSelected && (
                <div className="pl-4 border-l-2 border-muted">
                  <DiffViewer
                    oldText={entry.oldCaption}
                    newText={entry.newCaption}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && !isExpanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full"
        >
          {t('pages:dataset.history_show_more', { count: history.length - 3 })}
        </Button>
      )}

      {isExpanded && hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="w-full"
        >
          {t('pages:dataset.history_collapse')}
        </Button>
      )}
    </div>
  );
};

