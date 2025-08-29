"use client";
import { useEffect, useRef } from 'react';

export const useEngagementTracking = (pageName: string) => {
  const engagementTracked = useRef<Set<string>>(new Set());

  const trackEngagement = async (type: string, data?: any) => {
    const engagementKey = `${type}_${pageName}`;
    
    if (!engagementTracked.current.has(engagementKey)) {
      engagementTracked.current.add(engagementKey);
      
      // Track engagement event with Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Engagement', {
          engagement_type: type,
          content_type: 'page',
          content_name: pageName,
          event_source_url: window.location.href,
          ...data
        });
      }
    }
  };

  useEffect(() => {
    // Track page load engagement
    trackEngagement('page_load');

    // Track click engagement
    const handleClick = () => trackEngagement('click');
    document.addEventListener('click', handleClick);

    // Track form interaction
    const handleFormInteraction = () => trackEngagement('form_interaction');
    document.addEventListener('input', handleFormInteraction);
    document.addEventListener('change', handleFormInteraction);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('input', handleFormInteraction);
      document.removeEventListener('change', handleFormInteraction);
    };
  }, [pageName]);

  return { trackEngagement };
};
