import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Discussion } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MessageSquare, Pin, Lock, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface DiscussionListProps {
  discussions: Discussion[];
  onSelectDiscussion: (discussionId: number) => void;
  onCreateDiscussion: () => void;
  canCreate: boolean;
}

export function DiscussionList({
  discussions,
  onSelectDiscussion,
  onCreateDiscussion,
  canCreate,
}: DiscussionListProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? ru : enUS;

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{t('community.noDiscussionsYet')}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {t('community.noDiscussionsDescription')}
        </p>
        {canCreate && (
          <Button onClick={onCreateDiscussion} className="mt-6">
            {t('discussions.newDiscussion')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('community.discussionsTitle')}</h3>
        {canCreate && (
          <Button onClick={onCreateDiscussion}>{t('discussions.newDiscussion')}</Button>
        )}
      </div>

      <div className="space-y-3">
        {discussions.map((discussion) => (
          <Card
            key={discussion.id}
            className="p-4 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onSelectDiscussion(discussion.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium truncate">{discussion.title}</h4>
                  {discussion.isPinned && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      {t('discussions.pinned')}
                    </Badge>
                  )}
                  {discussion.isLocked && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {t('discussions.locked')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {t('discussions.posts', { count: discussion.postCount || 0 })}
                  </span>
                  <span>{t('discussions.startedBy', { username: discussion.author?.username })}</span>
                </div>

                {discussion.lastPostAt && discussion.lastPostAuthor && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {t('discussions.lastPostBy', { username: discussion.lastPostAuthor.username })}
                      {' · '}
                      {getRelativeTime(discussion.lastPostAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

