# API Testing Guide

## Backend Routes Available

### Post Management
- **POST** `/api/posts/create` - Create a new post
- **GET** `/api/posts` - Get user's posts (with pagination)
- **GET** `/api/posts/:id` - Get specific post
- **PUT** `/api/posts/:id` - Update post
- **DELETE** `/api/posts/:id` - Delete post

### Media Management  
- **POST** `/api/media/upload` - Upload media files
- **GET** `/api/media/assets` - Get user's media assets
- **GET** `/api/media/assets/:id` - Get specific media asset
- **DELETE** `/api/media/assets/:id` - Delete media asset
- **POST** `/api/media/prepare-linkedin` - Prepare LinkedIn payload

## Example API Calls

### 1. Upload Media
```bash
curl -X POST http://localhost:3002/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "media=@image1.jpg" \
  -F "media=@video1.mp4"
```

Response:
```json
{
  "success": true,
  "message": "Successfully uploaded 2 file(s)",
  "data": {
    "uploadedFiles": [
      {
        "id": "uuid-1",
        "url": "https://r2-url/images/uuid-1.jpg",
        "type": "IMAGE",
        "fileName": "image1.jpg",
        "size": 1024000
      }
    ],
    "totalUploaded": 2,
    "linkedinReady": true
  }
}
```

### 2. Create Post
```bash
curl -X POST http://localhost:3002/api/posts/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this amazing post! #linkedin #growth",
    "mediaAssetIds": ["uuid-1", "uuid-2"],
    "socials": ["linkedin"],
    "scheduledAt": "2025-09-24T10:00:00.000Z"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "id": "post-uuid",
      "content": "Check out this amazing post! #linkedin #growth",
      "scheduledAt": "2025-09-24T10:00:00.000Z",
      "mediaAssets": [...],
      "isPosted": false
    },
    "isScheduled": true,
    "mediaCount": 2
  }
}
```

### 3. Get User Posts
```bash
curl -X GET "http://localhost:3002/api/posts?page=1&limit=10&status=draft" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Integration

The frontend components are fully integrated:

1. **AIChat** - Generates dummy content (ready for AI integration)
2. **Calendar** - Handles post scheduling
3. **MediaUpload** - Uploads files to R2 storage
4. **PostPreview** - Shows LinkedIn-like preview with edit functionality
5. **Main Page** - Orchestrates all components and handles form submission

## Environment Variables

Make sure your backend `.env` file includes:
```env
# Database
DATABASE_URL=your_postgresql_url

# JWT
JWT_SECRET=your_jwt_secret

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=social-media-uploads
```

## Frontend Features

- ✅ AI content generation (dummy responses)
- ✅ Real-time post preview
- ✅ Media upload with progress tracking
- ✅ Calendar scheduling
- ✅ Post content editing
- ✅ Form validation
- ✅ API integration for post creation
- ✅ Black and white UI design
- ✅ Responsive layout

## Next Steps for AI Integration

Replace the dummy AI responses in `AIChat.tsx`:

```typescript
// Replace getDummyResponse function with actual AI API call
const getAIResponse = async (userInput: string): Promise<string> => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userInput })
  });
  
  const data = await response.json();
  return data.content;
};
```
