"use client";
import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  from?: "up" | "down" | "left" | "right" | "scale";
}

export default function Reveal({ children, className = "", delayMs = 0, from = "up" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delayMs);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delayMs]);

  const baseHidden = "opacity-0";
  const baseShown = "opacity-100";
  const dirHidden = {
    up: "translate-y-4",
    down: "-translate-y-4",
    left: "translate-x-4",
    right: "-translate-x-4",
    scale: "scale-95",
  }[from];
  const dirShown = {
    up: "translate-y-0",
    down: "translate-y-0",
    left: "translate-x-0",
    right: "translate-x-0",
    scale: "scale-100",
  }[from];

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? `${baseShown} ${dirShown}` : `${baseHidden} ${dirHidden}`} will-change-[transform,opacity] transition-all duration-700 ease-out`}
    >
      {children}
    </div>
  );
}


