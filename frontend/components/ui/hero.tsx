"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const HeroSection = () => {
  const router = useRouter();

  return (
    <section className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
          Connect &
          <br />
          <span className="text-[#126038]">Share</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join our community and start sharing your thoughts, ideas, and moments with friends around the world.
        </p>
        
        <Button
          onClick={() => router.push('/dashboard/profile')}
          className="bg-[#126038] hover:bg-[#0d4a2a] text-white text-lg px-8 py-4 h-auto font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Get Started
        </Button>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">Connect</h3>
            <p className="text-gray-400">
              Build meaningful connections with people who share your interests and passions.
            </p>
          </div>
          
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">Share</h3>
            <p className="text-gray-400">
              Share your stories, photos, and thoughts with your network instantly.
            </p>
          </div>
          
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">Discover</h3>
            <p className="text-gray-400">
              Explore new content and discover amazing creators from around the globe.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
