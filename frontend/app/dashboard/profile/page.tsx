"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Username
              </label>
              <p className="text-white text-lg">{user.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <p className="text-white text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                User ID
              </label>
              <p className="text-white text-lg">#{user.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Account Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Posts</span>
              <span className="text-[#126038] font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Followers</span>
              <span className="text-[#126038] font-semibold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Following</span>
              <span className="text-[#126038] font-semibold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
