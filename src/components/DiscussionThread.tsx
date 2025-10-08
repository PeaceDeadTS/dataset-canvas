import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Discussion, DiscussionPost } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Lock, Pin, MessageSquare, Trash2, LockOpen, PinOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { DiscussionPostComponent } from './DiscussionPostComponent';
import { PostEditor } from './PostEditor';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface DiscussionThreadProps {
  discussionId: number;
  onBack: () => void;
}

export function DiscussionThread({
  discussionId,
  onBack,
}: DiscussionThreadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [discussion, setDiscussion] = useState<Discussion & { posts: DiscussionPost[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ postId: number; username: string; content: string } | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [deleteDiscussionOpen, setDeleteDiscussionOpen] = useState(false);

  useEffect(() => {
    fetchDiscussion();
  }, [discussionId]);

  const fetchDiscussion = async () => {
    try {
      const response = await axios.get(`/discussions/${discussionId}`);
      setDiscussion(response.data);
    } catch (error) {
      console.error('Failed to fetch discussion:', error);
      toast({
        title: t('common:error'),
        description: 'Failed to load discussion',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (content: string) => {
    try {
      await axios.post(`/discussions/${discussionId}/posts`, {
        content,
        replyToId: replyTo?.postId || null,
      });
      toast({ title: t('common:discussions.postCreateSuccess') });
      setReplyTo(null);
      await fetchDiscussion();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: t('common:discussions.postCreateFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleEditPost = (postId: number) => {
    const post = discussion?.posts.find((p) => p.id === postId);
    if (post) {
      setEditingPostId(postId);
      setEditingContent(post.content);
      setReplyTo(null); // Cancel reply if editing
    }
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingPostId) return;

    try {
      await axios.patch(`/posts/${editingPostId}`, { content });
      toast({ title: t('common:discussions.postUpdateSuccess') });
      setEditingPostId(null);
      setEditingContent('');
      await fetchDiscussion();
    } catch (error) {
      console.error('Failed to update post:', error);
      toast({
        title: t('common:discussions.postUpdateFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingContent('');
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      await axios.delete(`/posts/${deletePostId}`);
      toast({ title: t('common:discussions.postDeleteSuccess') });
      setDeletePostId(null);
      await fetchDiscussion();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast({
        title: t('common:discussions.postDeleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleReplyToPost = (postId: number, username: string) => {
    const post = discussion?.posts.find((p) => p.id === postId);
    if (post) {
      setReplyTo({ postId, username, content: post.content });
    }
  };

  const handleLockDiscussion = async () => {
    if (!discussion) return;

    try {
      await axios.patch(`/discussions/${discussionId}/lock`, {
        isLocked: !discussion.isLocked,
      });
      toast({
        title: discussion.isLocked
          ? t('common:discussions.discussionUnlockSuccess')
          : t('common:discussions.discussionLockSuccess'),
      });
      await fetchDiscussion();
    } catch (error) {
      console.error('Failed to lock/unlock discussion:', error);
      toast({
        title: discussion.isLocked
          ? t('common:discussions.discussionUnlockFailed')
          : t('common:discussions.discussionLockFailed'),
        variant: 'destructive',
      });
    }
  };

  const handlePinDiscussion = async () => {
    if (!discussion) return;

    try {
      await axios.patch(`/discussions/${discussionId}/pin`, {
        isPinned: !discussion.isPinned,
      });
      toast({
        title: discussion.isPinned
          ? t('common:discussions.discussionUnpinSuccess')
          : t('common:discussions.discussionPinSuccess'),
      });
      await fetchDiscussion();
    } catch (error) {
      console.error('Failed to pin/unpin discussion:', error);
      toast({
        title: discussion.isPinned
          ? t('common:discussions.discussionUnpinFailed')
          : t('common:discussions.discussionPinFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDiscussion = async () => {
    try {
      await axios.delete(`/discussions/${discussionId}`);
      toast({ title: t('common:discussions.discussionDeleteSuccess') });
      setDeleteDiscussionOpen(false);
      onBack(); // Go back to list after deletion
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      toast({
        title: t('common:discussions.discussionDeleteFailed'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>{t('common:loading')}</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common:error')}</p>
        <Button onClick={onBack} className="mt-4">
          {t('common:back')}
        </Button>
      </div>
    );
  }

  const canReply = !!user && !discussion.isLocked;
  const canEdit = (postId: number) => {
    const post = discussion.posts.find((p) => p.id === postId);
    return user && post && (user.role === 'Administrator' || post.authorId === user.id);
  };
  const canDelete = user?.role === 'Administrator';
  const canModerate = user?.role === 'Administrator';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common:back')}
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">{discussion.title}</h2>
            {discussion.isPinned && (
              <Badge variant="secondary">
                <Pin className="h-3 w-3 mr-1" />
                {t('common:discussions.pinned')}
              </Badge>
            )}
            {discussion.isLocked && (
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" />
                {t('common:discussions.locked')}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {t('common:discussions.startedBy', { username: discussion.author?.username })}
            {' · '}
            <MessageSquare className="inline h-3 w-3" />
            {' '}
            {t('common:discussions.posts', { count: discussion.posts.length })}
          </p>
        </div>

        {/* Moderation buttons */}
        {canModerate && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockDiscussion}
            >
              {discussion.isLocked ? (
                <>
                  <LockOpen className="h-4 w-4 mr-1" />
                  {t('common:discussions.unlockDiscussion')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  {t('common:discussions.lockDiscussion')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePinDiscussion}
            >
              {discussion.isPinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-1" />
                  {t('common:discussions.unpinDiscussion')}
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-1" />
                  {t('common:discussions.pinDiscussion')}
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDiscussionOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('common:discussions.deleteDiscussion')}
            </Button>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {discussion.posts.map((post, index) => {
          const isFirstPost = index === 0;
          return editingPostId === post.id ? (
            <PostEditor
              key={post.id}
              initialContent={editingContent}
              onSubmit={handleSaveEdit}
              onCancel={handleCancelEdit}
              placeholder={t('common:discussions.editPost')}
              submitLabel={t('common:save')}
            />
          ) : (
            <div key={post.id} className={isFirstPost ? 'bg-accent/30 p-4 rounded-lg -m-4 mb-4' : ''}>
              <DiscussionPostComponent
                post={post}
                canEdit={canEdit(post.id)}
                canDelete={canDelete && !isFirstPost}
                onEdit={handleEditPost}
                onDelete={(postId) => setDeletePostId(postId)}
                onReply={handleReplyToPost}
              />
            </div>
          );
        })}
      </div>

      {/* Reply editor */}
      {canReply && (
        <div className="mt-6">
          <PostEditor
            replyTo={replyTo ? { username: replyTo.username, content: replyTo.content } : null}
            onSubmit={handleReply}
            onCancel={replyTo ? () => setReplyTo(null) : undefined}
          />
        </div>
      )}

      {!canReply && discussion.isLocked && (
        <p className="text-center text-muted-foreground py-4">
          {t('common:discussions.discussionLocked')}
        </p>
      )}

      {!canReply && !discussion.isLocked && !user && (
        <p className="text-center text-muted-foreground py-4">
          {t('common:discussions.loginToReply')}
        </p>
      )}

      {/* Delete Post Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:discussions.deletePost')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:discussions.confirmDeletePost')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Discussion Dialog */}
      <AlertDialog open={deleteDiscussionOpen} onOpenChange={setDeleteDiscussionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:discussions.deleteDiscussion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:discussions.confirmDeleteDiscussion')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDiscussion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

