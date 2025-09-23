import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { uploadToR2 } from '../config/r2.js';
import { validateUploadRequest, handleMulterError, validateFileSize } from '../middlewares/fileValidation.js';
import { authmiddleware } from '../middlewares/authmiddleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authmiddleware);

/**
 * Upload multiple media files (images and videos)
 * POST /api/media/upload
 * Accepts: multipart/form-data with 'media' field containing files
 * Max: 10 files, Images <5MB, Videos <15MB
 */
router.post('/upload', 
  uploadToR2.array('media', 10), // Field name 'media', max 10 files
  handleMulterError, // Handle multer-specific errors
  validateUploadRequest, // Validate file count and types
  validateFileSize, // Validate individual file sizes
  MediaController.uploadMedia
);

/**
 * Get user's media assets with pagination
 * GET /api/media/assets?page=1&limit=20&type=IMAGE|VIDEO
 */
router.get('/assets', MediaController.getUserMedia);

/**
 * Get specific media asset details
 * GET /api/media/assets/:id
 */
router.get('/assets/:id', MediaController.getMediaAsset);

/**
 * Delete a media asset
 * DELETE /api/media/assets/:id
 */
router.delete('/assets/:id', MediaController.deleteMedia);

/**
 * Prepare selected media assets for LinkedIn sharing
 * POST /api/media/prepare-linkedin
 * Body: { assetIds: string[], postContent?: string }
 */
router.post('/prepare-linkedin', MediaController.prepareForLinkedIn);

export default router;
