"use client";

import { useEffect } from 'react';

interface ViewCounterProps {
  slug: string;
}

export default function ViewCounter({ slug }: ViewCounterProps) {
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await fetch('/api/landing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug,
            action: 'increment-view'
          })
        });
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    // Increment view count when component mounts
    incrementViewCount();
  }, [slug]);

  // This component doesn't render anything visible
  return null;
}
