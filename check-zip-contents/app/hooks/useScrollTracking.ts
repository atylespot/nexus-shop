"use client";
import { useEffect, useRef } from 'react';
import { generateEventId, trackEvent } from '@/lib/pixelTracking';

export const useScrollTracking = (pageName: string) => {
  const scrollTracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = async () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track scroll milestones (25%, 50%, 75%, 100%)
      const milestones = [25, 50, 75, 100];
      
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !scrollTracked.current.has(milestone)) {
          scrollTracked.current.add(milestone);
          
          // Track Scroll via unified tracker (client + server + dedup)
          const eventId = generateEventId();
          trackEvent('Scroll', {
            content_name: `${pageName} - Scroll ${milestone}%`,
            content_category: 'scroll',
            content_type: 'scroll',
            scroll_depth: milestone,
            value: 0,
            currency: 'BDT',
            num_items: 1
          }, { eventId, enableClientTracking: true, enableServerTracking: true, deduplicationWindow: 60000 });
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageName]);

  return null;
};
