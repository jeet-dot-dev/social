'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PostPreviewProps {
  content: string;
  onContentChange: (content: string) => void;
  media: Array<{ id: string; url: string; type: string; assetId: string }>;
  scheduledAt?: Date | null;
  onSave: () => void;
  isSaving: boolean;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  content,
  onContentChange,
  media,
  scheduledAt,
  onSave,
  isSaving
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    onContentChange(editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const formatContent = (text: string) => {
    // Simple hashtag highlighting and link detection
    return text.split('\n').map((line, index) => (
      <div key={index} className="mb-1">
        {line.split(' ').map((word, wordIndex) => {
          if (word.startsWith('#')) {
            return (
              <span key={wordIndex} className="text-blue-600 font-medium">
                {word}{' '}
              </span>
            );
          }
          if (word.startsWith('http') || word.startsWith('www')) {
            return (
              <span key={wordIndex} className="text-blue-600 underline">
                {word}{' '}
              </span>
            );
          }
          return word + ' ';
        })}
      </div>
    ));
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Post Preview</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveEdit}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
              >
                Save
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn Post Mock - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Post Header (Mock LinkedIn) */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-xs">👤</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Your Name</p>
              <p className="text-xs text-gray-500">Job Title • 1st</p>
              <p className="text-xs text-gray-500">
                {scheduledAt ? 
                  `Scheduled for ${scheduledAt.toLocaleDateString()}` : 
                  'Now'
                } • 🌍
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-3">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your post content here..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                rows={4}
              />
            ) : content ? (
              <div className="text-gray-900 whitespace-pre-wrap text-sm">
                {formatContent(content)}
              </div>
            ) : (
              <div className="text-gray-500 italic text-sm">
                Your AI-generated content will appear here...
              </div>
            )}
          </div>

          {/* Media Preview - Compact */}
          {media.length > 0 && (
            <div className="mb-3">
              {media.length === 1 ? (
                // Single media
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  {media[0].type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={media[0].url} 
                      alt="Post media"
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <video 
                      src={media[0].url}
                      className="w-full h-32 object-cover"
                      controls
                    />
                  )}
                </div>
              ) : (
                // Multiple media - grid layout
                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden border border-gray-200">
                  {media.slice(0, 4).map((item, index) => (
                    <div key={item.id} className="relative">
                      {item.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.url} 
                          alt={`Media ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      ) : (
                        <video 
                          src={item.url}
                          className="w-full h-20 object-cover"
                          controls={false}
                        />
                      )}
                      
                      {/* Show +N more for additional media */}
                      {index === 3 && media.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            +{media.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LinkedIn Actions (Mock) */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex space-x-4">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 10m-5 10v-5a2 2 0 012-2h.095c.5 0 .905.405.905.905 0 .287-.025.57-.075.848L7 15m7-5H4.264a2 2 0 01-1.789-2.894l3.5-7A2 2 0 017.736 4h4.017c.163 0 .326.02.485.06L15 5m0 5v5" />
                </svg>
                <span>Like</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Comment</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        <Button
          onClick={onSave}
          disabled={!content.trim() || isSaving}
          className="w-full bg-black hover:bg-gray-800 text-white"
        >
          {isSaving ? 'Processing...' : 'Done'}
        </Button>
        
        {/* Post Info */}
        {content && (
          <div className="mt-3 flex justify-between text-xs text-gray-600">
            <span>{content.length} chars</span>
            <span>{media.length} media</span>
            <span>{scheduledAt ? `Scheduled for ${scheduledAt.toLocaleDateString()}` : 'Post immediately'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
