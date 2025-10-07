import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { CaptionEditHistory } from '../entity/CaptionEditHistory.entity';
import { Discussion } from '../entity/Discussion.entity';
import { DiscussionPost } from '../entity/DiscussionPost.entity';
import { DiscussionEditHistory } from '../entity/DiscussionEditHistory.entity';
import { checkJwtOptional } from '../middleware/checkJwt';
import logger from '../logger';

const router = Router();

interface UnifiedChange {
  type: 'caption_edit' | 'discussion_created' | 'discussion_post' | 'post_edit';
  id: string;
  timestamp: Date;
  user: { id: number; username: string } | null;
  dataset: { id: number; name: string; owner: { id: number; username: string } | null };
  data: any;
}

// GET /api/recent-changes - Get recent changes (caption edits and discussions) across all datasets
router.get('/', checkJwtOptional, async (req: Request, res: Response) => {
  const { page = '1', limit = '50', type = 'all' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

  try {
    const changes: UnifiedChange[] = [];

    // Get caption edits
    if (type === 'all' || type === 'caption_edit') {
      const captionEdits = await AppDataSource.getRepository(CaptionEditHistory)
        .createQueryBuilder('edit')
        .leftJoinAndSelect('edit.user', 'user')
        .leftJoinAndSelect('edit.image', 'image')
        .leftJoinAndSelect('image.dataset', 'dataset')
        .leftJoinAndSelect('dataset.user', 'datasetOwner')
        .orderBy('edit.createdAt', 'DESC')
        .limit(limitNum * 2)
        .getMany();

      captionEdits.forEach((edit) => {
        changes.push({
          type: 'caption_edit',
          id: `caption_${edit.id}`,
          timestamp: edit.createdAt,
          user: edit.user ? { id: edit.user.id, username: edit.user.username } : null,
          dataset: {
            id: edit.image.dataset.id,
            name: edit.image.dataset.name,
            owner: edit.image.dataset.user ? {
              id: edit.image.dataset.user.id,
              username: edit.image.dataset.user.username,
            } : null,
          },
          data: {
            imageId: edit.image.id,
            imgKey: edit.image.img_key,
            oldCaption: edit.oldCaption,
            newCaption: edit.newCaption,
          },
        });
      });
    }

    // Get new discussions
    if (type === 'all' || type === 'discussion_created') {
      const discussions = await AppDataSource.getRepository(Discussion)
        .createQueryBuilder('discussion')
        .leftJoinAndSelect('discussion.author', 'author')
        .leftJoinAndSelect('discussion.dataset', 'dataset')
        .leftJoinAndSelect('dataset.user', 'datasetOwner')
        .orderBy('discussion.createdAt', 'DESC')
        .limit(limitNum * 2)
        .getMany();

      discussions.forEach((discussion) => {
        changes.push({
          type: 'discussion_created',
          id: `discussion_${discussion.id}`,
          timestamp: discussion.createdAt,
          user: discussion.author ? { id: discussion.author.id, username: discussion.author.username } : null,
          dataset: {
            id: discussion.dataset.id,
            name: discussion.dataset.name,
            owner: discussion.dataset.user ? {
              id: discussion.dataset.user.id,
              username: discussion.dataset.user.username,
            } : null,
          },
          data: {
            discussionId: discussion.id,
            title: discussion.title,
          },
        });
      });
    }

    // Get new discussion posts
    if (type === 'all' || type === 'discussion_post') {
      const posts = await AppDataSource.getRepository(DiscussionPost)
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.discussion', 'discussion')
        .leftJoinAndSelect('discussion.dataset', 'dataset')
        .leftJoinAndSelect('dataset.user', 'datasetOwner')
        .where('post.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('post.createdAt', 'DESC')
        .limit(limitNum * 2)
        .getMany();

      posts.forEach((post) => {
        changes.push({
          type: 'discussion_post',
          id: `post_${post.id}`,
          timestamp: post.createdAt,
          user: post.author ? { id: post.author.id, username: post.author.username } : null,
          dataset: {
            id: post.discussion.dataset.id,
            name: post.discussion.dataset.name,
            owner: post.discussion.dataset.user ? {
              id: post.discussion.dataset.user.id,
              username: post.discussion.dataset.user.username,
            } : null,
          },
          data: {
            postId: post.id,
            discussionId: post.discussionId,
            discussionTitle: post.discussion.title,
            content: post.content,
            replyToId: post.replyToId,
          },
        });
      });
    }

    // Get discussion post edits
    if (type === 'all' || type === 'post_edit') {
      const postEdits = await AppDataSource.getRepository(DiscussionEditHistory)
        .createQueryBuilder('edit')
        .leftJoinAndSelect('edit.editor', 'editor')
        .leftJoinAndSelect('edit.post', 'post')
        .leftJoinAndSelect('post.discussion', 'discussion')
        .leftJoinAndSelect('discussion.dataset', 'dataset')
        .leftJoinAndSelect('dataset.user', 'datasetOwner')
        .orderBy('edit.editedAt', 'DESC')
        .limit(limitNum * 2)
        .getMany();

      postEdits.forEach((edit) => {
        changes.push({
          type: 'post_edit',
          id: `post_edit_${edit.id}`,
          timestamp: edit.editedAt,
          user: edit.editor ? { id: edit.editor.id, username: edit.editor.username } : null,
          dataset: {
            id: edit.post.discussion.dataset.id,
            name: edit.post.discussion.dataset.name,
            owner: edit.post.discussion.dataset.user ? {
              id: edit.post.discussion.dataset.user.id,
              username: edit.post.discussion.dataset.user.username,
            } : null,
          },
          data: {
            postId: edit.postId,
            discussionId: edit.post.discussionId,
            discussionTitle: edit.post.discussion.title,
            oldContent: edit.oldContent,
            newContent: edit.newContent,
          },
        });
      });
    }

    // Sort all changes by timestamp
    changes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginate
    const total = changes.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedChanges = changes.slice(skip, skip + limitNum);

    res.json({
      changes: paginatedChanges,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Failed to get recent changes', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

