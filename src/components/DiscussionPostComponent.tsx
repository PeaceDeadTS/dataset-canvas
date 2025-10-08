import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DiscussionPost } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MessageSquare, Edit, Trash2, Clock, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { PostEditHistory } from './PostEditHistory';

interface DiscussionPostComponentProps {
  post: DiscussionPost;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (postId: number) => void;
  onDelete: (postId: number) => void;
  onReply: (postId: number, authorName: string) => void;
}

export function DiscussionPostComponent({
  post,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onReply,
}: DiscussionPostComponentProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? ru : enUS;
  const [showHistory, setShowHistory] = useState(false);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  if (post.isDeleted) {
    return (
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground italic">
          {t('common:discussions.postDeleted')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Reply indicator */}
      {post.replyTo && (
        <div className="mb-3 p-2 bg-muted rounded-md text-sm">
          <span className="text-muted-foreground">{t('common:discussions.replyTo', { username: post.replyTo.author?.username || 'Unknown' })}</span>
          <p className="mt-1 text-xs line-clamp-2 text-muted-foreground italic">
            {post.replyTo.content}
          </p>
        </div>
      )}

      {/* Post header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {post.author?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div>
            {post.author?.username ? (
              <Link 
                to={`/users/${post.author.username}`}
                className="font-medium text-sm hover:text-primary transition-colors"
              >
                {post.author.username}
              </Link>
            ) : (
              <p className="font-medium text-sm">Unknown</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {getRelativeTime(post.createdAt)}
              {post.editCount && post.editCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {t('common:discussions.edited')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(post.id, post.author?.username || 'Unknown')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {t('common:discussions.reply')}
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(post.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="prose prose-sm max-w-none">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Show history button if post has been edited */}
      {post.editCount && post.editCount > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs"
          >
            <History className="h-3 w-3 mr-1" />
            {showHistory
              ? t('common:discussions.hideEditHistory')
              : t('common:discussions.showEditHistory')}
          </Button>
        </div>
      )}

      {/* Edit history */}
      {showHistory && post.editCount && post.editCount > 0 && (
        <div className="mt-3 pt-3 border-t">
          <PostEditHistory postId={post.id} />
        </div>
      )}
    </Card>
  );
}

