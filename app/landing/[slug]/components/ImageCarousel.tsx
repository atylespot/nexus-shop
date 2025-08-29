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
  const isReview = variant === 'customer-reviews' || variant === 'reviews';
  const cardPadding = isReview ? 'p-3 md:p-6' : 'p-1 md:p-2';
  
  // Prepare an extended array to keep at least slidesPerView items visible
  const extendedImages = images.length >= slidesPerView
    ? [...images, ...images.slice(0, slidesPerView)]
    : [...images, ...images, ...images].slice(0, Math.max(images.length, slidesPerView) + slidesPerView);
  const totalSlides = extendedImages.length;

  useEffect(() => {
    if (extendedImages.length > slidesPerView) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = prev + 1;
          // Loop seamlessly
          if (next >= totalSlides - slidesPerView + 1) return 0;
          return next;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [extendedImages.length, slidesPerView, totalSlides]);

  return (
    <div className="relative overflow-hidden">
      {/* Sliding Carousel */}
      <div 
        className="flex transition-transform duration-1000 ease-in-out" 
        style={{ transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)` }}
      >
        {extendedImages.map((imageUrl: string, index: number) => (
          <div key={index} className={`flex-shrink-0 px-2 ${
            isReview ? 'w-full md:w-1/4' : 'w-full md:w-1/4'
          }`}>
            <div className={`backdrop-blur-sm rounded-xl ${cardPadding} border border-white/20 ${
              isReview
                ? 'bg-white/20 hover:bg-white/30 hover:shadow-lg hover:shadow-orange-500/25 cursor-pointer group overflow-hidden relative' 
                : 'bg-white/10'
            }`}>
              <img
                src={imageUrl}
                alt={variant === 'customer-reviews' || variant === 'reviews' ? `Customer Review ${index + 1}` : `Product ${index + 1}`}
                className={`w-full rounded-lg shadow-lg transition-transform duration-300 ${
                  isReview
                    ? 'h-48 md:h-56 object-contain bg-white/10 p-2 group-hover:scale-105'
                    : 'h-72 md:h-80 object-cover'
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
