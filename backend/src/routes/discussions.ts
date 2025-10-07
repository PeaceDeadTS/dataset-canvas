import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Discussion } from '../entity/Discussion.entity';
import { DiscussionPost } from '../entity/DiscussionPost.entity';
import { DiscussionEditHistory } from '../entity/DiscussionEditHistory.entity';
import { Dataset } from '../entity/Dataset.entity';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import {
  checkDiscussionPermission,
  checkCanEditPost,
} from '../middleware/checkDiscussionPermission';
import logger from '../logger';

const router = Router();

// Get all discussions for a dataset
router.get(
  '/datasets/:datasetId/discussions',
  checkJwtOptional,
  async (req, res) => {
    try {
      const datasetId = Number(req.params.datasetId);
      const userId = req.user?.id;

      // Check if dataset exists and user has access
      const datasetRepository = AppDataSource.manager.getRepository(Dataset);
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
        relations: ['user'],
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Check dataset access (same logic as dataset routes)
      if (!dataset.isPublic) {
        if (!userId) {
          return res.status(403).json({ message: 'Access denied' });
        }
        const userRepository = AppDataSource.manager.getRepository(
          require('../entity/User.entity').User
        );
        const user = await userRepository.findOne({ where: { id: userId } });
        if (
          user?.role !== 'Administrator' &&
          dataset.user.id !== userId
        ) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      // Get discussions with metadata
      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussions = await discussionRepository
        .createQueryBuilder('discussion')
        .leftJoinAndSelect('discussion.author', 'author')
        .leftJoinAndSelect('discussion.posts', 'posts')
        .loadRelationCountAndMap('discussion.postCount', 'discussion.posts')
        .where('discussion.datasetId = :datasetId', { datasetId })
        .orderBy('discussion.isPinned', 'DESC')
        .addOrderBy('discussion.updatedAt', 'DESC')
        .getMany();

      // Get last post info for each discussion
      const discussionsWithMeta = await Promise.all(
        discussions.map(async (discussion) => {
          const lastPost = await AppDataSource.manager
            .getRepository(DiscussionPost)
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.discussionId = :discussionId', {
              discussionId: discussion.id,
            })
            .orderBy('post.createdAt', 'DESC')
            .getOne();

          return {
            ...discussion,
            lastPostAt: lastPost?.createdAt,
            lastPostAuthor: lastPost?.author,
          };
        })
      );

      return res.json(discussionsWithMeta);
    } catch (error) {
      logger.error('Error fetching discussions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create a new discussion
router.post(
  '/datasets/:datasetId/discussions',
  checkJwt,
  checkDiscussionPermission('create_discussions'),
  async (req, res) => {
    try {
      const datasetId = Number(req.params.datasetId);
      const userId = req.user!.id;
      const { title, content } = req.body;

      if (!title || !content) {
        return res
          .status(400)
          .json({ message: 'Title and content are required' });
      }

      // Check dataset access
      const datasetRepository = AppDataSource.manager.getRepository(Dataset);
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
        relations: ['user'],
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Create discussion
      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussion = discussionRepository.create({
        title,
        datasetId,
        authorId: userId,
      });
      await discussionRepository.save(discussion);

      // Create first post
      const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
      const post = postRepository.create({
        discussionId: discussion.id,
        authorId: userId,
        content,
      });
      await postRepository.save(post);

      // Load relations for response
      const createdDiscussion = await discussionRepository.findOne({
        where: { id: discussion.id },
        relations: ['author', 'posts', 'posts.author'],
      });

      logger.info(
        `User ${userId} created discussion ${discussion.id} in dataset ${datasetId}`
      );

      return res.status(201).json(createdDiscussion);
    } catch (error) {
      logger.error('Error creating discussion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get a single discussion with all posts
router.get('/discussions/:id', checkJwtOptional, async (req, res) => {
  try {
    const discussionId = Number(req.params.id);
    const userId = req.user?.id;

    const discussionRepository =
      AppDataSource.manager.getRepository(Discussion);
    const discussion = await discussionRepository.findOne({
      where: { id: discussionId },
      relations: ['author', 'dataset', 'dataset.user'],
    });

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check dataset access
    if (!discussion.dataset.isPublic) {
      if (!userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const userRepository = AppDataSource.manager.getRepository(
        require('../entity/User.entity').User
      );
      const user = await userRepository.findOne({ where: { id: userId } });
      if (
        user?.role !== 'Administrator' &&
        discussion.dataset.user.id !== userId
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get posts with replies
    const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
    const posts = await postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.author', 'replyToAuthor')
      .loadRelationCountAndMap('post.editCount', 'post.editHistory')
      .where('post.discussionId = :discussionId', { discussionId })
      .orderBy('post.createdAt', 'ASC')
      .getMany();

    return res.json({ ...discussion, posts });
  } catch (error) {
    logger.error('Error fetching discussion:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a post to a discussion
router.post(
  '/discussions/:id/posts',
  checkJwt,
  checkDiscussionPermission('reply_to_discussions'),
  async (req, res) => {
    try {
      const discussionId = Number(req.params.id);
      const userId = req.user!.id;
      const { content, replyToId } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussion = await discussionRepository.findOne({
        where: { id: discussionId },
        relations: ['dataset'],
      });

      if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found' });
      }

      if (discussion.isLocked) {
        return res.status(403).json({ message: 'Discussion is locked' });
      }

      const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
      const post = postRepository.create({
        discussionId,
        authorId: userId,
        content,
        replyToId: replyToId || null,
      });
      await postRepository.save(post);

      // Update discussion updated_at
      discussion.updatedAt = new Date();
      await discussionRepository.save(discussion);

      const createdPost = await postRepository.findOne({
        where: { id: post.id },
        relations: ['author', 'replyTo', 'replyTo.author'],
      });

      logger.info(
        `User ${userId} posted in discussion ${discussionId}, post ${post.id}`
      );

      return res.status(201).json(createdPost);
    } catch (error) {
      logger.error('Error creating post:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Edit a post
router.patch(
  '/posts/:id',
  checkJwt,
  checkCanEditPost,
  async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = req.user!.id;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
      const post = await postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Save edit history
      const historyRepository = AppDataSource.manager.getRepository(
        DiscussionEditHistory
      );
      const history = historyRepository.create({
        postId,
        editorId: userId,
        oldContent: post.content,
        newContent: content,
      });
      await historyRepository.save(history);

      // Update post
      post.content = content;
      await postRepository.save(post);

      const updatedPost = await postRepository.findOne({
        where: { id: postId },
        relations: ['author', 'replyTo', 'replyTo.author'],
      });

      logger.info(`User ${userId} edited post ${postId}`);

      return res.json(updatedPost);
    } catch (error) {
      logger.error('Error editing post:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get edit history for a post
router.get('/posts/:id/history', checkJwtOptional, async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const historyRepository = AppDataSource.manager.getRepository(
      DiscussionEditHistory
    );
    const history = await historyRepository.find({
      where: { postId },
      relations: ['editor'],
      order: { editedAt: 'DESC' },
    });

    return res.json(history);
  } catch (error) {
    logger.error('Error fetching edit history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a discussion (soft delete)
router.delete(
  '/discussions/:id',
  checkJwt,
  checkDiscussionPermission('delete_discussions'),
  async (req, res) => {
    try {
      const discussionId = Number(req.params.id);
      const userId = req.user!.id;

      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussion = await discussionRepository.findOne({
        where: { id: discussionId },
      });

      if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found' });
      }

      await discussionRepository.remove(discussion);

      logger.info(
        `User ${userId} deleted discussion ${discussionId}`
      );

      return res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
      logger.error('Error deleting discussion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete a post (soft delete)
router.delete(
  '/posts/:id',
  checkJwt,
  checkDiscussionPermission('delete_discussions'),
  async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = req.user!.id;

      const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
      const post = await postRepository.findOne({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      post.isDeleted = true;
      post.deletedAt = new Date();
      post.deletedById = userId;
      await postRepository.save(post);

      logger.info(`User ${userId} deleted post ${postId}`);

      return res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      logger.error('Error deleting post:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Lock/unlock a discussion
router.patch(
  '/discussions/:id/lock',
  checkJwt,
  checkDiscussionPermission('delete_discussions'),
  async (req, res) => {
    try {
      const discussionId = Number(req.params.id);
      const { isLocked } = req.body;

      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussion = await discussionRepository.findOne({
        where: { id: discussionId },
      });

      if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found' });
      }

      discussion.isLocked = isLocked;
      await discussionRepository.save(discussion);

      logger.info(
        `Discussion ${discussionId} ${isLocked ? 'locked' : 'unlocked'}`
      );

      return res.json(discussion);
    } catch (error) {
      logger.error('Error locking/unlocking discussion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Pin/unpin a discussion
router.patch(
  '/discussions/:id/pin',
  checkJwt,
  checkDiscussionPermission('delete_discussions'),
  async (req, res) => {
    try {
      const discussionId = Number(req.params.id);
      const { isPinned } = req.body;

      const discussionRepository =
        AppDataSource.manager.getRepository(Discussion);
      const discussion = await discussionRepository.findOne({
        where: { id: discussionId },
      });

      if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found' });
      }

      discussion.isPinned = isPinned;
      await discussionRepository.save(discussion);

      logger.info(
        `Discussion ${discussionId} ${isPinned ? 'pinned' : 'unpinned'}`
      );

      return res.json(discussion);
    } catch (error) {
      logger.error('Error pinning/unpinning discussion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;

