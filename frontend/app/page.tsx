import React from 'react';
import { Navbar } from '@/components/ui/navbar';
import { HeroSection } from '@/components/ui/hero';

const page = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <HeroSection />
    </div>
  )
}

export default page
