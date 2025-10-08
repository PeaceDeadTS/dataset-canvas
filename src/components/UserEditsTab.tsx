import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '@/lib/axios';
import { UnifiedChange, UnifiedChangesResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, FileEdit, MessageSquare, Database } from 'lucide-react';
import { DiffViewer } from '@/components/DiffViewer';

interface UserEditsTabProps {
  userId: string;
}

const UserEditsTab = ({ userId }: UserEditsTabProps) => {
  const { t } = useTranslation();
  const [data, setData] = useState<UnifiedChangesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const fetchEdits = async () => {
      setLoading(true);
      try {
        const response = await axios.get<UnifiedChangesResponse>(
          `/users/${userId}/edits?page=${page}&limit=${limit}`
        );
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch user edits:', err);
        setError('Failed to load user edits');
      } finally {
        setLoading(false);
      }
    };

    fetchEdits();
  }, [userId, page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('userEdits.justNow');
    if (diffMins < 60) return t('userEdits.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('userEdits.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('userEdits.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.changes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileEdit className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">{t('userEdits.noEdits')}</p>
      </div>
    );
  }

  const { changes, pagination } = data;

  return (
    <div className="space-y-6">
      {/* Changes List */}
      <div className="space-y-4">
        {changes.map((change) => (
          <div
            key={change.id}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            {/* Render based on change type */}
            {change.type === 'caption_edit' && (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link 
                        to={`/datasets/${change.data.dataset?.id}?tab=data-studio`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {change.data.dataset?.name}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {change.data.image?.img_key}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(change.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3">
                  {expandedChangeId === change.id ? (
                    <div>
                      <DiffViewer 
                        oldText={change.data.oldCaption} 
                        newText={change.data.newCaption} 
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedChangeId(null)}
                        className="mt-2"
                      >
                        {t('userEdits.showLess')}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {change.data.newCaption}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedChangeId(change.id)}
                        className="mt-2"
                      >
                        {t('userEdits.showDiff')}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {change.type === 'discussion_created' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('recentChanges.createdDiscussion')}</span>
                  <Link 
                    to={`/datasets/${change.data.dataset?.id}?tab=community`}
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Database className="w-4 h-4" />
                    {change.data.dataset?.name}
                  </Link>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(change.timestamp)}</span>
                </div>
                <Link
                  to={`/datasets/${change.data.dataset?.id}?tab=community&discussion=${change.data.discussionId}`}
                  className="bg-muted/30 rounded p-3 block hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{change.data.title}</span>
                </Link>
              </>
            )}

            {change.type === 'discussion_post' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('recentChanges.postedIn')}</span>
                  <Link 
                    to={`/datasets/${change.data.dataset?.id}?tab=community`}
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Database className="w-4 h-4" />
                    {change.data.dataset?.name}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <Link
                    to={`/datasets/${change.data.dataset?.id}?tab=community&discussion=${change.data.discussionId}`}
                    className="hover:text-primary transition-colors"
                  >
                    <Badge variant="outline" className="text-xs">
                      {change.data.discussionTitle}
                    </Badge>
                  </Link>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(change.timestamp)}</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3">
                  <p className="text-sm line-clamp-3">{change.data.content}</p>
                </div>
              </>
            )}

            {change.type === 'post_edit' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('recentChanges.editedPost')}</span>
                  <Link 
                    to={`/datasets/${change.data.dataset?.id}?tab=community`}
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Database className="w-4 h-4" />
                    {change.data.dataset?.name}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <Link
                    to={`/datasets/${change.data.dataset?.id}?tab=community&discussion=${change.data.discussionId}`}
                    className="hover:text-primary transition-colors"
                  >
                    <Badge variant="outline" className="text-xs">
                      {change.data.discussionTitle}
                    </Badge>
                  </Link>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(change.timestamp)}</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded p-3">
                  {expandedChangeId === change.id ? (
                    <div>
                      <DiffViewer 
                        oldText={change.data.oldContent} 
                        newText={change.data.newContent} 
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedChangeId(null)}
                        className="mt-2"
                      >
                        {t('userEdits.showLess')}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {change.data.newContent}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedChangeId(change.id)}
                        className="mt-2"
                      >
                        {t('userEdits.showDiff')}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            {t('userEdits.showing', {
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.previous')}
            </Button>

            <span className="text-sm px-3">
              {t('common.pageOf', { page: pagination.page, total: pagination.totalPages })}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserEditsTab;

