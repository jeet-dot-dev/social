"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page by default
    router.replace('/dashboard/profile');
  }, [router]);

  return null;
}