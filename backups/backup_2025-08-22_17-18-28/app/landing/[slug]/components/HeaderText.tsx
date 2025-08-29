"use client";

import { useEffect, useMemo, useState } from "react";

interface HeaderTextProps {
  imageUrl: string | null;
  children: React.ReactNode;
  className?: string;
  tag?: "h1" | "p" | "div" | "span";
  landingId?: number; // Add landingId for view tracking
}

function getContrastColor(r: number, g: number, b: number): string {
  // Per WCAG relative luminance
  const srgb = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return luminance > 0.5 ? "#0b1220" : "#ffffff"; // dark text on light bg, else white on dark
}

export default function HeaderText({ imageUrl, children, className = "", tag = "div", landingId }: HeaderTextProps) {
  const [color, setColor] = useState<string>("#ffffff");

  // Track page view when component mounts
  useEffect(() => {
    if (landingId) {
      fetch('/api/landing/view', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landingId })
      }).catch(() => {});
    }
  }, [landingId]);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.max(16, Math.min(64, img.naturalWidth));
        canvas.height = Math.max(16, Math.min(64, img.naturalHeight));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Sample a band near the bottom center where text is placed
        const yStart = Math.floor(canvas.height * 0.6);
        const yEnd = canvas.height - 1;
        const xStart = Math.floor(canvas.width * 0.25);
        const xEnd = Math.floor(canvas.width * 0.75);
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = yStart; y <= yEnd; y++) {
          for (let x = xStart; x <= xEnd; x++) {
            const data = ctx.getImageData(x, y, 1, 1).data;
            r += data[0]; g += data[1]; b += data[2]; n++;
          }
        }
        if (n > 0) {
          const cr = Math.round(r / n), cg = Math.round(g / n), cb = Math.round(b / n);
          const best = getContrastColor(cr, cg, cb);
          if (!cancelled) setColor(best);
        }
      } catch { /* ignore */ }
    };
    return () => { cancelled = true; };
  }, [imageUrl]);

  const Tag: any = useMemo(() => tag, [tag]);
  return <Tag style={{ color }} className={className}>{children}</Tag>;
}
