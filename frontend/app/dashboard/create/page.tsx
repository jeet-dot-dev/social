"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically make an API call to create the post
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Post created successfully!");
      setFormData({ title: "", content: "" });
      router.push("/dashboard/posts");
    } catch (error) {
      toast.error("Failed to create post");
      console.error("Create post error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Create New Post</h1>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Enter post title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[#126038]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">
                Content
              </Label>
              <Textarea
                id="content"
                name="content"
                placeholder="What's on your mind?"
                value={formData.content}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                rows={8}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[#126038] resize-none"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#126038] hover:bg-[#0d4a2a] text-white"
              >
                {isLoading ? "Creating..." : "Create Post"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/posts")}
                disabled={isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
