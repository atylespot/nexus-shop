"use client";
import { useEffect } from 'react';

interface FacebookPixelTestProps {
  pixelId: string;
  testEventCode?: string;
}

export default function FacebookPixelTest({ pixelId, testEventCode }: FacebookPixelTestProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Facebook Pixel Code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    // Initialize Pixel
    fbq('init', pixelId);
    
    // Set test event code if provided
    if (testEventCode) {
      fbq('set', 'test_event_code', testEventCode);
    }

    // Track page view
    fbq('track', 'PageView');

    // Track custom events
    const trackCustomEvent = (eventName: string, parameters: any) => {
      fbq('track', eventName, parameters);
    };

    // Expose tracking function globally
    (window as any).fbq = fbq;
    (window as any).trackCustomEvent = trackCustomEvent;

    // Track scroll events
    let scrollTracked = new Set();
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      [25, 50, 75, 100].forEach(milestone => {
        if (scrollPercent >= milestone && !scrollTracked.has(milestone)) {
          scrollTracked.add(milestone);
          trackCustomEvent('Scroll', {
            scroll_depth: milestone,
            content_type: 'page',
            content_name: document.title
          });
        }
      });
    };

    // Track time on page
    let timeTracked = new Set();
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      [30, 60, 120, 300].forEach(milestone => {
        if (elapsed >= milestone && !timeTracked.has(milestone)) {
          timeTracked.add(milestone);
          trackCustomEvent('TimeOnPage', {
            time_spent: milestone,
            content_type: 'page',
            content_name: document.title
          });
        }
      });
    }, 1000);

    // Track engagement
    const handleClick = () => {
      trackCustomEvent('Engagement', {
        engagement_type: 'click',
        content_type: 'page',
        content_name: document.title
      });
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      clearInterval(timeInterval);
    };
  }, [pixelId, testEventCode]);

  return null;
}
