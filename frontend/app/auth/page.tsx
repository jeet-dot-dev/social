"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";

interface AuthFormData {
  username?: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

const AuthPage = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    username: "",
    email: "",
    password: "",
  });

  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isSignIn ? "/api/v1/auth/signin" : "/api/v1/auth/signup";
      const payload = isSignIn 
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      const response = await axios.post<AuthResponse>(
        `http://localhost:3002${endpoint}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.token) {
        // Use auth context to login
        login(response.data.token, response.data.user!);
        
        toast.success(response.data.message);
        
        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
        });
      } else {
        toast.error(response.data.message || "Authentication failed");
      }
    } catch (error: unknown) {
      let errorMessage = "An error occurred";
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            {isSignIn ? "Sign In" : "Sign Up"}
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            {isSignIn 
              ? "Enter your credentials to access your account" 
              : "Create a new account to get started"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username || ""}
                  onChange={handleInputChange}
                  required={!isSignIn}
                  disabled={isLoading}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[#126038]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[#126038]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                minLength={5}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-[#126038]"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#126038] hover:bg-[#0d4a2a] text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (isSignIn ? "Sign In" : "Sign Up")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-medium text-[#126038] hover:text-[#0d4a2a] focus:outline-none focus:underline transition ease-in-out duration-150"
                disabled={isLoading}
              >
                {isSignIn ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
