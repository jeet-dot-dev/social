import type { Request, Response } from 'express';
import prisma from '../model/prisma.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

interface CreatePostRequest {
  content: string;
  convo?: any; // AI conversation history
  mediaAssetIds?: string[]; // IDs of uploaded media assets
  socials?: string[]; // Target social platforms
  scheduledAt?: string; // ISO date string for scheduling
}

export class PostController {
  
  /**
   * Create a new post
   * POST /api/posts/create
   */
  static async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to create posts'
        });
      }

      const {
        content,
        convo,
        mediaAssetIds = [],
        socials = ['linkedin'],
        scheduledAt
      }: CreatePostRequest = req.body;

      // Validate required fields
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
          message: 'Post content cannot be empty'
        });
      }

      // Validate media assets if provided
      let validatedMediaAssets: any[] = [];
      if (mediaAssetIds.length > 0) {
        console.log('Validating media assets:', mediaAssetIds);
        console.log('User ID:', userId);
        
        validatedMediaAssets = await prisma.mediaAsset.findMany({
          where: {
            id: { in: mediaAssetIds },
            userId
          }
        });

        console.log('Found media assets:', validatedMediaAssets.length);
        console.log('Expected count:', mediaAssetIds.length);
        console.log('Found assets:', validatedMediaAssets.map(a => ({ id: a.id, fileName: a.fileName })));

        if (validatedMediaAssets.length !== mediaAssetIds.length) {
          console.log('Validation failed: asset count mismatch');
          return res.status(400).json({
            success: false,
            error: 'Invalid media assets',
            message: 'One or more media assets not found or not owned by user'
          });
        }
      }

      // Parse scheduled date if provided
      let scheduledDate = null;
      if (scheduledAt) {
        scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid schedule date',
            message: 'Please provide a valid date for scheduling'
          });
        }
        
        // Check if date is in the future
        if (scheduledDate <= new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Invalid schedule date',
            message: 'Scheduled date must be in the future'
          });
        }
      }

      // Create the post
      const newPost = await prisma.post.create({
        data: {
          userId,
          content: content.trim(),
          convo: convo || null,
          socials,
          scheduledAt: scheduledDate,
          isPosted: false,
          // Legacy fields for backwards compatibility
          ImageUrls: validatedMediaAssets
            .filter(asset => asset.type === 'IMAGE')
            .map(asset => asset.r2Url),
          VideoUrls: validatedMediaAssets
            .filter(asset => asset.type === 'VIDEO')
            .map(asset => asset.r2Url),
        },
        include: {
          mediaAssets: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      // Update media assets to link them to this post
      if (validatedMediaAssets.length > 0) {
        await prisma.mediaAsset.updateMany({
          where: {
            id: { in: mediaAssetIds }
          },
          data: {
            postId: newPost.id
          }
        });
      }

      // Fetch the complete post with media assets
      const completePost = await prisma.post.findUnique({
        where: { id: newPost.id },
        include: {
          mediaAssets: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post: completePost,
          isScheduled: !!scheduledDate,
          mediaCount: validatedMediaAssets.length
        }
      });

    } catch (error) {
      console.error('Create post error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create post',
        message: 'An error occurred while creating the post'
      });
    }
  }

  /**
   * Get user's posts
   * GET /api/posts
   */
  static async getUserPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (status === 'posted') {
        whereClause.isPosted = true;
      } else if (status === 'draft') {
        whereClause.isPosted = false;
        whereClause.scheduledAt = null;
      } else if (status === 'scheduled') {
        whereClause.isPosted = false;
        whereClause.scheduledAt = { not: null };
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            mediaAssets: true
          }
        }),
        prisma.post.count({ where: whereClause })
      ]);

      return res.json({
        success: true,
        data: {
          posts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch posts'
      });
    }
  }

  /**
   * Get a specific post
   * GET /api/posts/:id
   */
  static async getPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId || !id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const post = await prisma.post.findFirst({
        where: {
          id,
          userId
        },
        include: {
          mediaAssets: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      return res.json({
        success: true,
        data: post
      });

    } catch (error) {
      console.error('Get post error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch post'
      });
    }
  }

  /**
   * Update a post
   * PUT /api/posts/:id
   */
  static async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId || !id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { content, mediaAssetIds, socials, scheduledAt } = req.body;

      // Check if post exists and belongs to user
      const existingPost = await prisma.post.findFirst({
        where: { id, userId }
      });

      if (!existingPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      // Parse scheduled date if provided
      let scheduledDate = null;
      if (scheduledAt) {
        scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Invalid schedule date'
          });
        }
      }

      // Update the post
      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          ...(content && { content: content.trim() }),
          ...(socials && { socials }),
          ...(scheduledAt !== undefined && { scheduledAt: scheduledDate }),
        },
        include: {
          mediaAssets: true
        }
      });

      // Update media assets if provided
      if (mediaAssetIds) {
        // Remove existing associations
        await prisma.mediaAsset.updateMany({
          where: { postId: id },
          data: { postId: null }
        });

        // Add new associations
        if (mediaAssetIds.length > 0) {
          await prisma.mediaAsset.updateMany({
            where: {
              id: { in: mediaAssetIds },
              userId
            },
            data: { postId: id }
          });
        }
      }

      return res.json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost
      });

    } catch (error) {
      console.error('Update post error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update post'
      });
    }
  }

  /**
   * Delete a post
   * DELETE /api/posts/:id
   */
  static async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId || !id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if post exists and belongs to user
      const existingPost = await prisma.post.findFirst({
        where: { id, userId }
      });

      if (!existingPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      // Remove media asset associations
      await prisma.mediaAsset.updateMany({
        where: { postId: id },
        data: { postId: null }
      });

      // Delete the post
      await prisma.post.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Post deleted successfully'
      });

    } catch (error) {
      console.error('Delete post error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete post'
      });
    }
  }
}
