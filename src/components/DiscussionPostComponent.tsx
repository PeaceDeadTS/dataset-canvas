import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DiscussionPost, PostLike } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MessageSquare, Edit, Trash2, Clock, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { PostEditHistory } from './PostEditHistory';
import { PostLikesDisplay } from './PostLikesDisplay';
import { MarkdownRenderer } from './MarkdownRenderer';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  
  // Likes state
  const [likes, setLikes] = useState<PostLike[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikesLoading, setIsLikesLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [post.id]);

  const fetchLikes = async () => {
    try {
      const response = await axios.get(`/posts/${post.id}/likes`);
      const likesData = response.data as PostLike[];
      setLikes(likesData);
      
      // Check if current user has liked
      if (user) {
        const userLike = likesData.find(like => like.user.id === user.id);
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Failed to fetch post likes:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) return;
    
    setIsLikesLoading(true);
    try {
      if (isLiked) {
        await axios.delete(`/posts/${post.id}/likes`);
        toast({ title: t('common:likes.unlikeSuccess') });
      } else {
        await axios.post(`/posts/${post.id}/likes`);
        toast({ title: t('common:likes.likeSuccess') });
      }
      
      // Refresh likes
      await fetchLikes();
    } catch (error) {
      console.error('Failed to toggle post like:', error);
      toast({
        title: t('common:likes.toggleError'),
        variant: 'destructive'
      });
    } finally {
      setIsLikesLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  // Проверяем, является ли пост собственным
  const isOwnPost = user && post.authorId === user.id;

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
              {(post.editCount ?? 0) > 0 && (
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
        {post.contentMarkdown ? (
          <MarkdownRenderer content={post.contentMarkdown} className="text-sm" />
        ) : (
          <p className="whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Post likes - показываем только если пост не удален */}
      {!post.isDeleted && (
        <div className="mt-3 pt-3 border-t">
          <PostLikesDisplay
            likes={likes}
            isLiked={isLiked}
            isLoading={isLikesLoading}
            onToggleLike={handleToggleLike}
            canLike={!!user && !!post.authorId && post.authorId !== user.id}
          />
        </div>
      )}

      {/* Show history button if post has been edited */}
      {(post.editCount ?? 0) > 0 && (
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
      {showHistory && (post.editCount ?? 0) > 0 && (
        <div className="mt-3 pt-3 border-t">
          <PostEditHistory postId={post.id} />
        </div>
      )}
    </Card>
  );
}

