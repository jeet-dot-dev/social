import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB

export interface ValidatedFile extends Express.Multer.File {
  location: string;
  key: string;
}

// Middleware to validate file sizes after upload
export const validateFileSize = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as ValidatedFile[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ 
      error: 'No files uploaded',
      code: 'NO_FILES'
    });
  }

  // Validate each file
  for (const file of files) {
    const isImage = allowedImageTypes.includes(file.mimetype);
    const isVideo = allowedVideoTypes.includes(file.mimetype);
    
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ 
        error: `Image file "${file.originalname}" exceeds 5MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        code: 'IMAGE_TOO_LARGE',
        fileName: file.originalname,
        size: file.size,
        limit: MAX_IMAGE_SIZE
      });
    }
    
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({ 
        error: `Video file "${file.originalname}" exceeds 15MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        code: 'VIDEO_TOO_LARGE',
        fileName: file.originalname,
        size: file.size,
        limit: MAX_VIDEO_SIZE
      });
    }
  }
  
  next();
};

// Middleware to handle multer errors
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          code: 'FILE_TOO_LARGE',
          message: 'One or more files exceed the maximum size limit'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          code: 'TOO_MANY_FILES',
          message: 'Maximum 10 files allowed per upload'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          code: 'UNEXPECTED_FIELD',
          message: 'File uploaded to unexpected field'
        });
      default:
        return res.status(400).json({
          error: 'File upload error',
          code: 'UPLOAD_ERROR',
          message: err.message
        });
    }
  }
  
  // Handle other file-related errors
  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      code: 'INVALID_FILE_TYPE',
      message: err.message
    });
  }
  
  next(err);
};

// Middleware to validate file count and types
export const validateUploadRequest = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as ValidatedFile[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({
      error: 'No files provided',
      code: 'NO_FILES'
    });
  }
  
  if (files.length > 10) {
    return res.status(400).json({
      error: 'Too many files',
      code: 'TOO_MANY_FILES',
      message: 'Maximum 10 files allowed per upload'
    });
  }
  
  // Validate file types
  const invalidFiles = files.filter(file => {
    const isImage = allowedImageTypes.includes(file.mimetype);
    const isVideo = allowedVideoTypes.includes(file.mimetype);
    return !isImage && !isVideo;
  });
  
  if (invalidFiles.length > 0) {
    return res.status(400).json({
      error: 'Invalid file types',
      code: 'INVALID_FILE_TYPES',
      invalidFiles: invalidFiles.map(f => ({
        name: f.originalname,
        type: f.mimetype
      })),
      allowedTypes: {
        images: allowedImageTypes,
        videos: allowedVideoTypes
      }
    });
  }
  
  next();
};
