import type { Request, Response } from 'express';
import prisma from '../model/prisma.js';
import { processUploadedFiles, deleteFromR2, type LinkedInMediaAsset } from '../config/r2.js';
import type { ValidatedFile } from '../middlewares/fileValidation.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

interface MediaUploadResponse {
  success: boolean;
  message: string;
  data?: {
    uploadedFiles: LinkedInMediaAsset[];
    totalUploaded: number;
    linkedinReady: boolean;
  };
  error?: string;
}

export class MediaController {
  
  /**
   * Upload multiple media files (images and videos)
   * POST /api/media/upload
   */
  static async uploadMedia(req: AuthenticatedRequest, res: Response<MediaUploadResponse>) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to upload media'
        });
      }

      const files = req.files as ValidatedFile[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded',
          message: 'Please select at least one file to upload'
        });
      }

      console.log('Received files:', files.map(f => ({
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        location: f.location,
        key: f.key
      })));

      // Process files for LinkedIn compatibility
      const linkedinAssets = processUploadedFiles(files);
      
      // Save media assets to database
      const savedAssets = await Promise.all(
        linkedinAssets.map(async (asset: LinkedInMediaAsset) => {
          return await prisma.mediaAsset.create({
            data: {
              userId,
              fileName: asset.fileName,
              originalName: asset.fileName,
              mimeType: asset.mimeType,
              size: asset.size,
              r2Key: asset.url.split('/').pop() || '', // Extract key from URL
              r2Url: asset.url,
              type: asset.type,
              title: asset.title || null,
              description: asset.description || null,
            }
          });
        })
      );

      return res.status(201).json({
        success: true,
        message: `Successfully uploaded ${files.length} file(s)`,
        data: {
          uploadedFiles: savedAssets.map(asset => {
            const result: any = {
              id: asset.id,
              url: asset.r2Url,
              type: asset.type as 'IMAGE' | 'VIDEO',
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              size: asset.size
            };
            if (asset.title) result.title = asset.title;
            if (asset.description) result.description = asset.description;
            return result;
          }),
          totalUploaded: files.length,
          linkedinReady: true
        }
      });

    } catch (error) {
      console.error('Media upload error:', error);
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: 'An error occurred while uploading media files'
      });
    }
  }

  /**
   * Get user's media assets
   * GET /api/media/assets
   */
  static async getUserMedia(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { page = 1, limit = 20, type } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (type && (type === 'IMAGE' || type === 'VIDEO')) {
        whereClause.type = type;
      }

      const [assets, total] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { uploadedAt: 'desc' },
        }),
        prisma.mediaAsset.count({ where: whereClause })
      ]);

      return res.json({
        success: true,
        data: {
          assets,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get media assets error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch media assets'
      });
    }
  }

  /**
   * Delete a media asset
   * DELETE /api/media/assets/:id
   */
  static async deleteMedia(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId?.toString();
      const { id } = req.params;

      if (!userId || !id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Find the media asset
      const asset = await prisma.mediaAsset.findFirst({
        where: {
          id,
          userId // Ensure user owns the asset
        }
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'Media asset not found'
        });
      }

      // Delete from R2
      const deleted = await deleteFromR2(asset.r2Key);
      if (!deleted) {
        console.warn(`Failed to delete file from R2: ${asset.r2Key}`);
      }

      // Delete from database
      await prisma.mediaAsset.deleteMany({
        where: { 
          id,
          userId // Ensure ownership
        }
      });

      return res.json({
        success: true,
        message: 'Media asset deleted successfully'
      });

    } catch (error) {
      console.error('Delete media error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete media asset'
      });
    }
  }

  /**
   * Prepare media for LinkedIn post
   * POST /api/media/prepare-linkedin
   */
  static async prepareForLinkedIn(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId?.toString();
      const { assetIds, postContent } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Asset IDs are required'
        });
      }

      // Fetch the selected media assets
      const assets = await prisma.mediaAsset.findMany({
        where: {
          id: { in: assetIds },
          userId
        }
      });

      if (assets.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No valid assets found'
        });
      }

      // Prepare LinkedIn-compatible structure
      const linkedinPayload = {
        author: `urn:li:person:${userId}`, // This should be the LinkedIn person URN
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postContent || "Check out these media files!"
            },
            shareMediaCategory: assets.length === 1 && assets[0] ? 
              (assets[0].type === 'IMAGE' ? 'IMAGE' : 'VIDEO') : 
              'IMAGE', // LinkedIn API prefers IMAGE for mixed content
            media: assets.map((asset: any) => ({
              status: "READY",
              description: {
                text: asset.description || asset.title || asset.fileName
              },
              media: `urn:li:digitalmediaAsset:${asset.id}`, // This would need to be the LinkedIn asset URN after upload
              title: {
                text: asset.title || asset.fileName
              }
            }))
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      };

      return res.json({
        success: true,
        message: 'Media prepared for LinkedIn sharing',
        data: {
          linkedinPayload,
          assets: assets.map((asset: any) => ({
            id: asset.id,
            type: asset.type,
            url: asset.r2Url,
            fileName: asset.fileName,
            title: asset.title,
            description: asset.description
          }))
        }
      });

    } catch (error) {
      console.error('Prepare LinkedIn error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to prepare media for LinkedIn'
      });
    }
  }

  /**
   * Get media asset details
   * GET /api/media/assets/:id
   */
  static async getMediaAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId?.toString();
      const { id } = req.params;

      if (!userId || !id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const asset = await prisma.mediaAsset.findFirst({
        where: {
          id,
          userId
        },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true
            }
          }
        }
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'Media asset not found'
        });
      }

      return res.json({
        success: true,
        data: asset
      });

    } catch (error) {
      console.error('Get media asset error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch media asset'
      });
    }
  }
}
