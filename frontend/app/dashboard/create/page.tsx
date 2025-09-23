'use client';

import React, { useState } from 'react';
import { AIChat } from '@/components/dashboard/AIChat';
import { Calendar } from '@/components/dashboard/Calendar';
import { MediaUpload } from '@/components/dashboard/MediaUpload';
import { PostPreview } from '@/components/dashboard/PostPreview';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MediaAsset {
  id: string;
  url: string;
  type: string;
  assetId: string;
}

const CreatePostPage = () => {
  const [postContent, setPostContent] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaAsset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleContentGenerated = (content: string, convo: Message[]) => {
    setPostContent(content);
    setConversation(convo);
  };

  const handleScheduleSelect = (dateTime: Date | null) => {
    setScheduledDateTime(dateTime);
    setShowCalendar(false); // Close calendar after selection
  };

  const handleMediaUpload = (mediaAssets: MediaAsset[]) => {
    setUploadedMedia(mediaAssets);
  };

  const handleContentChange = (content: string) => {
    setPostContent(content);
  };

  const handleSavePost = async () => {
    if (!postContent.trim()) {
      alert('Please add some content to your post');
      return;
    }

    setIsSaving(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to create posts');
        setIsSaving(false);
        return;
      }

      const postData = {
        content: postContent,
        convo: conversation,
        mediaAssetIds: uploadedMedia.map(media => media.assetId),
        socials: ['linkedin'],
        ...(scheduledDateTime && { scheduledAt: scheduledDateTime.toISOString() })
      };

      const response = await fetch('http://localhost:3002/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.success) {
        alert(scheduledDateTime ? 'Post scheduled successfully!' : 'Post created successfully!');
        
        // Reset form
        setPostContent('');
        setConversation([]);
        setScheduledDateTime(null);
        setUploadedMedia([]);
        
      } else {
        alert(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
          
          {/* Top Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Calendar Button */}
            <Button
              onClick={() => setShowCalendar(true)}
              variant="outline"
              className="flex items-center space-x-2 border-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{scheduledDateTime ? 'Scheduled' : 'Schedule'}</span>
            </Button>

            {/* Social Platform Indicators */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Post to:</span>
              <div className="flex space-x-1">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">in</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Info */}
        {scheduledDateTime && (
          <div className="mt-2 text-sm text-blue-600 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scheduled for {scheduledDateTime.toLocaleString()}</span>
            <button 
              onClick={() => setScheduledDateTime(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side - AI Chat */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          <div className="flex-1 min-h-0">
            <AIChat onContentGenerated={handleContentGenerated} />
          </div>
        </div>

        {/* Right Side - Post Preview and Media Upload */}
        <div className="w-1/2 flex flex-col">
          {/* Post Preview - Top Half */}
          <div className="flex-1 min-h-0 border-b border-gray-200">
            <PostPreview
              content={postContent}
              onContentChange={handleContentChange}
              media={uploadedMedia}
              scheduledAt={scheduledDateTime}
              onSave={handleSavePost}
              isSaving={isSaving}
            />
          </div>

          {/* Media Upload - Bottom Half */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MediaUpload 
              onMediaUpload={handleMediaUpload}
              uploadedMedia={uploadedMedia}
            />
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Schedule Post</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <Calendar 
                onDateTimeSelect={handleScheduleSelect}
                selectedDateTime={scheduledDateTime}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostPage;
