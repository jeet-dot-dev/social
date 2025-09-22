"use client";

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PostsPage() {
  const router = useRouter();

  return (
    
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Your Posts</h1>
          <Button
            onClick={() => router.push('/dashboard/create')}
            className="bg-[#126038] hover:bg-[#0d4a2a] text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No posts yet</p>
              <p className="text-gray-500">Create your first post to get started!</p>
              <Button
                onClick={() => router.push('/dashboard/create')}
                className="mt-4 bg-[#126038] hover:bg-[#0d4a2a] text-white"
              >
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
   
  );
}
