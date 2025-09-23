'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  size: number;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  r2Url?: string;
  assetId?: string;
}

interface MediaUploadProps {
  onMediaUpload: (mediaAssets: Array<{ id: string; url: string; type: string; assetId: string }>) => void;
  uploadedMedia: Array<{ id: string; url: string; type: string; assetId: string }>;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaUpload, uploadedMedia }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: MediaFile[] = [];
    
    files.forEach(file => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(`${file.name} is not a supported file type. Please upload images or videos only.`);
        return;
      }

      // Validate file size
      const maxSize = isImage ? 5 * 1024 * 1024 : 15 * 1024 * 1024; // 5MB for images, 15MB for videos
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is ${isImage ? '5MB' : '15MB'}.`);
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      
      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview,
        type: isImage ? 'image' : 'video',
        size: file.size,
        uploadStatus: 'uploading'
      };

      validFiles.push(mediaFile);
    });

    if (validFiles.length === 0) return;

    // Add files to state with uploading status
    setMediaFiles(prev => [...prev, ...validFiles]);

    // Auto-upload files
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to upload media');
        return;
      }

      const formData = new FormData();
      validFiles.forEach(mediaFile => {
        formData.append('media', mediaFile.file);
      });

      const response = await fetch('http://localhost:3002/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const uploadedAssets = result.data.uploadedFiles;
        
        // Update status to success and store asset info
        setMediaFiles(prev => prev.map((file) => {
          const matchingValidFile = validFiles.find(vf => vf.id === file.id);
          if (matchingValidFile) {
            const assetIndex = validFiles.indexOf(matchingValidFile);
            return {
              ...file,
              uploadStatus: 'success' as const,
              r2Url: uploadedAssets[assetIndex]?.url,
              assetId: uploadedAssets[assetIndex]?.id
            };
          }
          return file;
        }));

        // Send uploaded media to parent component
        const mediaAssetsForParent = uploadedAssets.map((asset: any) => ({
          id: asset.id,
          url: asset.url,
          type: asset.type,
          assetId: asset.id
        }));

        onMediaUpload([...uploadedMedia, ...mediaAssetsForParent]);
      } else {
        // Update status to error
        setMediaFiles(prev => prev.map(file => {
          const matchingValidFile = validFiles.find(vf => vf.id === file.id);
          if (matchingValidFile) {
            return { ...file, uploadStatus: 'error' as const };
          }
          return file;
        }));
        
        alert(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update status to error
      setMediaFiles(prev => prev.map(file => {
        const matchingValidFile = validFiles.find(vf => vf.id === file.id);
        if (matchingValidFile) {
          return { ...file, uploadStatus: 'error' as const };
        }
        return file;
      }));
      
      alert('Upload failed. Please try again.');
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (mediaFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Get token from localStorage (assuming it's stored there)
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to upload media');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      mediaFiles.forEach(mediaFile => {
        formData.append('media', mediaFile.file);
      });

      // Update status to uploading
      setMediaFiles(prev => prev.map(file => ({ ...file, uploadStatus: 'uploading' as const })));

      const response = await fetch('http://localhost:3002/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update status to success and store asset info
        const uploadedAssets = result.data.uploadedFiles;
        
        setMediaFiles(prev => prev.map((file, index) => ({
          ...file,
          uploadStatus: 'success' as const,
          r2Url: uploadedAssets[index]?.url,
          assetId: uploadedAssets[index]?.id
        })));

        // Send uploaded media to parent component
        const mediaAssetsForParent = uploadedAssets.map((asset: any) => ({
          id: asset.id,
          url: asset.url,
          type: asset.type,
          assetId: asset.id
        }));

        onMediaUpload([...uploadedMedia, ...mediaAssetsForParent]);
        
        // Clear uploaded files from local state
        setTimeout(() => {
          setMediaFiles([]);
        }, 2000);
      } else {
        // Update status to error
        setMediaFiles(prev => prev.map(file => ({ ...file, uploadStatus: 'error' as const })));
        alert(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMediaFiles(prev => prev.map(file => ({ ...file, uploadStatus: 'error' as const })));
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadedMedia = (assetId: string) => {
    const updatedMedia = uploadedMedia.filter(media => media.assetId !== assetId);
    onMediaUpload(updatedMedia);
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
                  <img src={mediaFile.preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={mediaFile.preview} className="w-full h-full object-cover" />
                )}
              </div>
              
              {/* Status Overlay */}
              <div className="absolute top-1 left-1">
                {mediaFile.uploadStatus === 'pending' && (
                  <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">•</span>
                  </div>
                )}
                {mediaFile.uploadStatus === 'uploading' && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">↑</span>
                  </div>
                )}
                {mediaFile.uploadStatus === 'success' && (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
                {mediaFile.uploadStatus === 'error' && (
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">✗</span>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {mediaFile.uploadStatus === 'pending' && (
                <button
                  onClick={() => removeFile(mediaFile.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
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

      {/* Uploaded Media */}
      {uploadedMedia.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Media:</h4>
          <div className="grid grid-cols-2 gap-2">
            {uploadedMedia.map((media) => (
              <div key={media.assetId} className="relative group">
                {media.type === 'IMAGE' ? (
                  <img 
                    src={media.url} 
                    alt="Uploaded" 
                    className="w-full h-20 object-cover rounded border border-gray-200"
                  />
                ) : (
                  <video 
                    src={media.url} 
                    className="w-full h-20 object-cover rounded border border-gray-200"
                    controls={false}
                  />
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => removeUploadedMedia(media.assetId)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
