import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User.entity';
import { Permission } from '../entity/Permission.entity';
import { DiscussionPost } from '../entity/DiscussionPost.entity';

/**
 * Default discussion permissions for authenticated users
 * These are the permissions that all authenticated users have by default
 */
const DEFAULT_DISCUSSION_PERMISSIONS = [
  'read_discussions',
  'create_discussions',
  'reply_to_discussions',
  'edit_own_posts',
];

/**
 * Middleware to check if a user has a specific discussion permission
 * Administrators automatically pass all permission checks
 * Default permissions are granted to all authenticated users automatically
 */
export const checkDiscussionPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRepository = AppDataSource.manager.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['permissions'],
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Administrators bypass all permission checks
      if (user.role === 'Administrator') {
        return next();
      }

      // Check if this is a default permission - grant automatically
      if (DEFAULT_DISCUSSION_PERMISSIONS.includes(permissionName)) {
        return next();
      }

      // For non-default permissions, check explicit grants
      const hasPermission = user.permissions?.some(
        (p) => p.name === permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Permission denied: ${permissionName} required`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Middleware to check if user can edit a specific post
 * Users can edit their own posts if they have edit_own_posts permission
 * Users with edit_all_posts can edit any post
 * Administrators can always edit any post
 */
export const checkCanEditPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const postId = Number(req.params.postId || req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Administrators can edit any post
    if (user.role === 'Administrator') {
      return next();
    }

    const postRepository = AppDataSource.manager.getRepository(DiscussionPost);
    const post = await postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user can edit all posts
    const canEditAll = user.permissions?.some(
      (p) => p.name === ('edit_all_posts' as any)
    );
    if (canEditAll) {
      return next();
    }

    // All authenticated users can edit their own posts (default permission)
    if (post.authorId === userId) {
      return next();
    }

    return res.status(403).json({
      message: 'You do not have permission to edit this post',
    });
  } catch (error) {
    console.error('Edit permission check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Note: Default discussion permissions are now handled automatically by middleware
 * All authenticated users automatically have: read_discussions, create_discussions,
 * reply_to_discussions, and edit_own_posts without explicit permission grants
 */

