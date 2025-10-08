import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '@/lib/axios';
import { UnifiedChange, UnifiedChangesResponse } from '@/types';
import { AppHeader } from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, User, Database, FileText, MessageSquare } from 'lucide-react';
import { DiffViewer } from '@/components/DiffViewer';

const RecentChanges = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<UnifiedChangesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 50;

  useEffect(() => {
    const fetchRecentChanges = async () => {
      setLoading(true);
      try {
        const response = await axios.get<UnifiedChangesResponse>(
          `/recent-changes?page=${page}&limit=${limit}`
        );
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch recent changes:', err);
        setError('Failed to load recent changes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChanges();
  }, [page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('recentChanges.justNow');
    if (diffMins < 60) return t('recentChanges.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('recentChanges.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('recentChanges.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('recentChanges.title')}</h1>
          <p className="text-muted-foreground">{t('recentChanges.description')}</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data && data.changes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">{t('recentChanges.noChanges')}</p>
          </div>
        )}

        {/* Changes List */}
        {!loading && !error && data && data.changes.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {data.changes.map((change) => (
                <div
                  key={change.id}
                  className="bg-card border border-border rounded-lg p-5 space-y-4"
                >
                  {/* Render based on change type */}
                  {change.type === 'caption_edit' && (
                    <>
                      {/* Header with metadata */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {change.user && (
                              <Link
                                to={`/users/${change.user.username}?tab=edits`}
                                className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                              >
                                <User className="w-4 h-4" />
                                <span>{change.user.username}</span>
                              </Link>
                            )}
                            <span className="text-muted-foreground text-sm">
                              {t('recentChanges.edited')}
                            </span>
                            <Link
                              to={`/datasets/${change.dataset?.id}?tab=data-studio`}
                              className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                            >
                              <Database className="w-4 h-4" />
                              <span className="truncate">{change.dataset?.name}</span>
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {change.data.imgKey}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(change.timestamp)}</span>
                            </div>
                            {change.dataset?.owner && (
                              <span className="text-xs">
                                {t('recentChanges.datasetBy')}{' '}
                                <Link
                                  to={`/users/${change.dataset.owner.username}`}
                                  className="hover:text-primary transition-colors"
                                >
                                  {change.dataset.owner.username}
                                </Link>
                              </span>
                            )}
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
                              {t('recentChanges.showLess')}
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
                              {t('recentChanges.showDiff')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {change.type === 'discussion_created' && (
                    <>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {change.user && (
                          <Link
                            to={`/users/${change.user.username}`}
                            className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>{change.user.username}</span>
                          </Link>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {t('recentChanges.createdDiscussion')}
                        </span>
                        <Link
                          to={`/datasets/${change.dataset?.id}?tab=community`}
                          className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                        >
                          <Database className="w-4 h-4" />
                          <span className="truncate">{change.dataset?.name}</span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(change.timestamp)}</span>
                        </div>
                        {change.dataset?.owner && (
                          <span className="text-xs">
                            {t('recentChanges.datasetBy')}{' '}
                            <Link
                              to={`/users/${change.dataset.owner.username}`}
                              className="hover:text-primary transition-colors"
                            >
                              {change.dataset.owner.username}
                            </Link>
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/datasets/${change.dataset?.id}?tab=community`}
                        className="bg-muted/30 rounded p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-medium">{change.data.title}</span>
                      </Link>
                    </>
                  )}

                  {change.type === 'discussion_post' && (
                    <>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {change.user && (
                          <Link
                            to={`/users/${change.user.username}`}
                            className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>{change.user.username}</span>
                          </Link>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {t('recentChanges.postedIn')}
                        </span>
                        <Link
                          to={`/datasets/${change.dataset?.id}?tab=community`}
                          className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                        >
                          <Database className="w-4 h-4" />
                          <span className="truncate">{change.dataset?.name}</span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <Link
                          to={`/datasets/${change.dataset?.id}?tab=community`}
                          className="hover:text-primary transition-colors"
                        >
                          <Badge variant="outline" className="text-xs">
                            {change.data.discussionTitle}
                          </Badge>
                        </Link>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
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
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {change.user && (
                          <Link
                            to={`/users/${change.user.username}`}
                            className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>{change.user.username}</span>
                          </Link>
                        )}
                        <span className="text-muted-foreground text-sm">
                          {t('recentChanges.editedPost')}
                        </span>
                        <Link
                          to={`/datasets/${change.dataset?.id}?tab=community`}
                          className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                        >
                          <Database className="w-4 h-4" />
                          <span className="truncate">{change.dataset?.name}</span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <Link
                          to={`/datasets/${change.dataset?.id}?tab=community`}
                          className="hover:text-primary transition-colors"
                        >
                          <Badge variant="outline" className="text-xs">
                            {change.data.discussionTitle}
                          </Badge>
                        </Link>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
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
                              {t('recentChanges.showLess')}
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
                              {t('recentChanges.showDiff')}
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
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-6">
                <div className="text-sm text-muted-foreground">
                  {t('recentChanges.showing', {
                    start: (data.pagination.page - 1) * data.pagination.limit + 1,
                    end: Math.min(data.pagination.page * data.pagination.limit, data.pagination.total),
                    total: data.pagination.total
                  })}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('common.previous')}
                  </Button>

                  <span className="text-sm px-3">
                    {t('common.pageOf', { page: data.pagination.page, total: data.pagination.totalPages })}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RecentChanges;

