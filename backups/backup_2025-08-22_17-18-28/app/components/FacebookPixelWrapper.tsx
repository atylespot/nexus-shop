"use client";
import { useEffect, useState } from 'react';
import FacebookPixel from './FacebookPixel';

export default function FacebookPixelWrapper() {
  const [pixelId, setPixelId] = useState<string>('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Load pixel settings from database
    const loadPixelSettings = async () => {
      try {
        const response = await fetch('/api/settings/pixels');
        if (response.ok) {
          const settings = await response.json();
          setPixelId(settings?.fbPixelId || '');
          setEnabled(settings?.enabled || false);
        }
      } catch (error) {
        console.error('Failed to load pixel settings:', error);
      }
    };

    loadPixelSettings();
  }, []);

  // Only render pixel if enabled and pixelId exists
  if (!enabled || !pixelId) {
    return null;
  }

  return <FacebookPixel pixelId={pixelId} enabled={enabled} />;
}

