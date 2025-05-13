"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Use window.location for hard redirect when statically exported
    window.location.href = '/dashboard';
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="text-xl font-semibold">Redirecting to Dashboard...</div>
      <div className="mt-4">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          Click here if not redirected automatically
        </a>
      </div>
    </div>
  );
} 