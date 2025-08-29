"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BannerClient({ bannerSettings }: { bannerSettings: any }) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!bannerSettings?.autoSlide) return;
    const active = (bannerSettings?.banners || []).filter((b: any) => b.isActive);
    if (active.length <= 1) return;
    const id = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev === active.length - 1 ? 0 : prev + 1));
    }, bannerSettings?.slideInterval || 5000);
    return () => clearInterval(id);
  }, [bannerSettings?.autoSlide, bannerSettings?.slideInterval, bannerSettings?.banners]);

  const activeBanners = (bannerSettings?.banners || []).filter((b: any) => b.isActive);
  if (activeBanners.length === 0) return null;

  return (
    <section className="pt-0 pb-4">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
            {activeBanners.map((banner: any, index: number) => (
              <div
                key={banner.id}
                className={`transition-all duration-500 ease-in-out ${
                  index === currentBannerIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
              >
                <div 
                  className={`${banner.showOverlay === false ? '' : 'bg-gradient-to-r'} ${banner.backgroundColor} text-white p-8 md:p-16 rounded-2xl relative min-h-[300px] md:min-h-[440px]`}
                  style={{ 
                    color: banner.textColor,
                    background: banner.image
                      ? (banner.showOverlay === false
                          ? undefined
                          : `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3)), var(--tw-gradient-stops)`)
                      : undefined
                  }}
                >
                  {banner.image && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {banner.showOverlay !== false && (
                    <div className="absolute inset-0 rounded-2xl bg-black/20" />
                  )}

                  {banner.showOverlay !== false && (
                    <div className="relative z-10 text-center">
                      <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6">
                        {banner.title}
                      </h1>
                      <p className="text-lg md:text-2xl mb-6 md:mb-8 opacity-90">
                        {banner.subtitle}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                          href={banner.buttonLink}
                          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                          {banner.buttonText}
                        </Link>
                        {banner.secondaryButtonText && (
                          <Link
                            href={banner.secondaryButtonLink}
                            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                          >
                            {banner.secondaryButtonText}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {activeBanners.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


