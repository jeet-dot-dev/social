'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  size: number;
}

interface MediaUploadProps {
  onMediaChange: (files: MediaFile[]) => void;
  mediaFiles: MediaFile[];
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaChange, mediaFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: MediaFile[] = [];
    
    files.forEach(file => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported file type. Please upload images or videos only.`);
        return;
      }

      // Validate file size
      const maxSize = isImage ? 5 * 1024 * 1024 : 15 * 1024 * 1024; // 5MB for images, 15MB for videos
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is ${isImage ? '5MB' : '15MB'}.`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      
      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview,
        type: isImage ? 'image' : 'video',
        size: file.size
      };

      validFiles.push(mediaFile);
    });

    if (validFiles.length === 0) return;

    // Add files to parent component
    onMediaChange([...mediaFiles, ...validFiles]);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = mediaFiles.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const updatedFiles = mediaFiles.filter(f => f.id !== id);
    onMediaChange(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Upload</h3>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media Files with Plus Button */}
      <div className="mb-4">
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {/* Selected Files */}
          {mediaFiles.map((mediaFile) => (
            <div key={mediaFile.id} className="flex-shrink-0 relative group">
              {/* Preview */}
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {mediaFile.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaFile.preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={mediaFile.preview} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(mediaFile.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* File Info */}
              <div className="mt-1 text-center">
                <p className="text-xs text-gray-900 truncate w-20" title={mediaFile.file.name}>
                  {mediaFile.file.name.length > 10 ? mediaFile.file.name.slice(0, 10) + '...' : mediaFile.file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(mediaFile.size)}</p>
              </div>
            </div>
          ))}
          
          {/* Plus Button to Add More */}
          <div className="flex-shrink-0">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-20 h-20 border-dashed border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center rounded-lg"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            <div className="mt-1 text-center">
              <p className="text-xs text-gray-500">Add Media</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
