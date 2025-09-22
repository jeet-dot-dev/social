"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export const Navbar = () => {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      router.push('/auth');
    }
  };

  return (
    <nav className="w-full px-6 py-4 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo/Brand */}
        <Link href="/" className="flex items-center">
          <h1 className="text-2xl font-bold text-white">
            Social
          </h1>
        </Link>

        {/* Right side - Auth buttons */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-300">Hello, {user?.username}</span>
              <Button
                onClick={() => router.push('/dashboard/profile')}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                Dashboard
              </Button>
              <Button
                onClick={handleAuthAction}
                className="bg-[#126038] hover:bg-[#0d4a2a] text-white transition-all duration-300"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/auth')}
                className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/auth')}
                className="bg-[#126038] hover:bg-[#0d4a2a] text-white transition-all duration-300"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
