"use client";
import { useEffect, useRef } from 'react';
import { generateEventId, trackEvent } from '@/lib/pixelTracking';

export const useTimeTracking = (pageName: string) => {
  const timeTracked = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const trackTime = async (seconds: number) => {
      if (!timeTracked.current.has(seconds)) {
        timeTracked.current.add(seconds);
        
        // Track TimeOnPage via unified tracker (client + server + dedup)
        const eventId = generateEventId();
        trackEvent('TimeOnPage', {
          content_name: `${pageName} - TimeOnPage ${seconds}s`,
          content_category: 'time_spent',
          content_type: 'time_spent',
          time_spent: seconds,
          value: 0,
          currency: 'BDT',
          num_items: 1
        }, { eventId, enableClientTracking: true, enableServerTracking: true, deduplicationWindow: 120000 });
      }
    };

    // Track time milestones (30s, 1m, 2m, 5m)
    const timeMilestones = [30, 60, 120, 300];
    
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      
      timeMilestones.forEach(milestone => {
        if (elapsed >= milestone) {
          trackTime(milestone);
        }
      });
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [pageName]);

  return null;
};
