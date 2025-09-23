import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import type { Request } from "express";

// Extend Request interface for user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const r2 = new S3Client({
  region: "auto", // R2 doesn't need real AWS regions
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB

// Configure multer for R2 upload
export const uploadToR2 = multer({
  storage: multerS3({
    s3: r2,
    bucket: process.env.R2_BUCKET_NAME || 'social-media-uploads',
    key: function (req: AuthenticatedRequest, file: Express.Multer.File, cb: Function) {
      const fileExtension = mime.extension(file.mimetype) || 'bin';
      const folder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req: AuthenticatedRequest, file: Express.Multer.File, cb: Function) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadTime: new Date().toISOString(),
        userId: req.user?.userId?.toString() || 'anonymous'
      });
    }
  }),
  fileFilter: (req: AuthenticatedRequest, file: Express.Multer.File, cb: Function) => {
    const isImage = allowedImageTypes.includes(file.mimetype);
    const isVideo = allowedVideoTypes.includes(file.mimetype);
    
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV, AVI) are allowed.`));
    }
  },
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Set to max allowed (videos)
    files: 10 // Maximum 10 files per request
  }
});

// Utility function to delete files from R2
export const deleteFromR2 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'social-media-uploads',
      Key: key,
    });
    
    await r2.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
};

// LinkedIn-friendly media structure
export interface LinkedInMediaAsset {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  title?: string;
  description?: string;
  size: number;
  mimeType: string;
  fileName: string;
}

// Process uploaded files for LinkedIn compatibility
export const processUploadedFiles = (files: any[]): LinkedInMediaAsset[] => {
  return files.map(file => {
    const type = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    
    // Check if file has the expected structure from multerS3
    const fileUrl = file.location || file.url;
    if (!fileUrl) {
      console.error('File missing location/url:', file);
      throw new Error('File upload failed: missing file URL');
    }
    
    return {
      id: uuidv4(),
      url: fileUrl,
      type,
      size: file.size,
      mimeType: file.mimetype,
      fileName: file.originalname,
      title: file.originalname.split('.')[0],
      description: `${type.toLowerCase()} uploaded for LinkedIn sharing`
    };
  });
};
