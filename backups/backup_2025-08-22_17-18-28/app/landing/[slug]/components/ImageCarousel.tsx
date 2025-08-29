'use client';

import { useState, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  variant?: 'product' | 'customer-reviews' | 'reviews';
  slidesPerView?: number;
}

export default function ImageCarousel({ 
  images, 
  variant = 'product', 
  slidesPerView: propSlidesPerView 
}: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesPerView = propSlidesPerView || (variant === 'customer-reviews' || variant === 'reviews' ? 4 : 3);
  
  // Create a circular array by duplicating images to ensure smooth infinite scrolling
  const extendedImages = [...images, ...images.slice(0, slidesPerView)];
  const totalSlides = images.length;

  useEffect(() => {
    if (totalSlides > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = prev + 1;
          // Reset to beginning when reaching the end of original images
          if (nextSlide >= totalSlides) {
            return 0;
          }
          return nextSlide;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [totalSlides]);

  return (
    <div className="relative overflow-hidden">
      {/* Sliding Carousel */}
      <div 
        className="flex transition-transform duration-1000 ease-in-out" 
        style={{
          transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)`
        }}
      >
        {extendedImages.map((imageUrl: string, index: number) => (
          <div key={index} className={`flex-shrink-0 px-2 ${
            variant === 'customer-reviews' || variant === 'reviews'
              ? 'w-full md:w-1/4' // Mobile: 1 per view, Desktop: 4 per view
              : 'w-full md:w-1/3' // Mobile: 1 per view, Desktop: 3 per view
          }`}>
            <div className={`backdrop-blur-sm rounded-xl p-3 md:p-6 border border-white/20 ${
              variant === 'customer-reviews' || variant === 'reviews'
                ? 'bg-white/20 hover:bg-white/30 hover:shadow-lg hover:shadow-orange-500/25 cursor-pointer group overflow-hidden relative' 
                : 'bg-white/10'
            }`}>
              <img
                src={imageUrl}
                alt={variant === 'customer-reviews' || variant === 'reviews' ? `Customer Review ${index + 1}` : `Product ${index + 1}`}
                className={`w-full rounded-lg shadow-lg transition-transform duration-300 ${
                  variant === 'customer-reviews' || variant === 'reviews'
                    ? 'h-48 md:h-56 object-contain bg-white/10 p-2 group-hover:scale-105' // Increased height for better mobile view
                    : 'h-64 md:h-80 object-contain'
                }`}
              />
              {(variant === 'customer-reviews' || variant === 'reviews') && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
