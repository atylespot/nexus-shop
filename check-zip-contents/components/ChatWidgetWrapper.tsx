"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatWidget from './ChatWidget';

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false); // Start with false, will be updated in useEffect
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if current page is admin page
    const isAdminPage = pathname?.startsWith('/admin') || false;
    
    // Debug logging
    console.log('🔍 ChatWidgetWrapper Debug:', { 
      pathname, 
      isAdminPage,
      shouldRender: !isAdminPage
    });

    // Set render state - hide only on admin pages
    setShouldRender(!isAdminPage);
  }, [pathname]);

  // Immediate check for initial render
  useEffect(() => {
    if (pathname) {
      const isAdminPage = pathname.startsWith('/admin');
      setShouldRender(!isAdminPage);
      console.log('🚀 Initial path check:', { pathname, isAdminPage, shouldRender: !isAdminPage });
    }
  }, [pathname]);

  // Don't render until mounted
  if (!isMounted) {
    return null;
  }

  // Don't render on admin pages
  if (!shouldRender) {
    console.log('❌ Admin page detected, hiding ChatWidget');
    return null;
  }

  console.log('✅ Customer page detected, showing ChatWidget');
  return <ChatWidget />;
}
