"use client";
import { useState, useEffect } from "react";
import { getHeaderSettings, HeaderSettings } from "@/lib/header-settings";
import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import { cachedApi, Product, Category } from "@/lib/data-service";
import SharedHeader from "../components/SharedHeader";
import Footer from "@/components/Footer";
import { trackEvent } from "@/lib/pixels";

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

interface BannerSettings {
  banners: Banner[];
  autoSlide: boolean;
  slideInterval: number;
  flashSaleBanner: {
    isActive: boolean;
    title: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    buttonText: string;
    buttonLink: string;
    image: string;
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, addToCartAndRedirect, cartCount } = useCart();
  
  // Banner settings state - Load from localStorage
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    banners: [
      {
        id: 1,
        title: "Welcome to Nexus Shop",
        subtitle: "Discover amazing products at unbeatable prices",
        image: "",
        buttonText: "Shop Now",
        buttonLink: "/products",
        secondaryButtonText: "Browse Categories",
        secondaryButtonLink: "/categories",
        backgroundColor: "from-blue-600 to-purple-600",
        textColor: "#ffffff",
        isActive: true
      }
    ],
    autoSlide: true,
    slideInterval: 5000,
    flashSaleBanner: {
      isActive: true,
      title: "🔥 FLASH SALE",
      subtitle: "Up to 70% OFF on selected items",
      backgroundColor: "from-red-500 to-orange-500",
      textColor: "#ffffff",
      buttonText: "Shop Now",
      buttonLink: "/flash-sale",
      image: ""
    }
  });
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Load and watch banner settings (no reloads)
  useEffect(() => {
    const applyBannerSettings = () => {
      const savedBannerSettings = localStorage.getItem('nexus-shop-banner-settings');
      if (savedBannerSettings) {
        try {
          const parsed = JSON.parse(savedBannerSettings);
          if (!parsed.flashSaleBanner) {
            parsed.flashSaleBanner = {
              isActive: false,
              title: "🔥 FLASH SALE",
              subtitle: "Up to 70% OFF on selected items",
              backgroundColor: "from-red-500 to-orange-500",
              textColor: "#ffffff",
              buttonText: "Shop Now",
              buttonLink: "/flash-sale",
              image: ""
            };
          }
          setBannerSettings(parsed);
          console.log('🎨 Banner settings applied:', parsed);
        } catch (error) {
          console.error('Error parsing banner settings:', error);
        }
      }
    };

    // Initial apply
    applyBannerSettings();

    // Listen for changes from Admin panel (other tab)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'nexus-shop-banner-settings' || e.key === 'nexus-shop-settings-last-update') {
        applyBannerSettings();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    try {
      trackEvent('PageView', {
        event_source_url: window.location.href,
        content_type: 'page'
      });
    } catch {}
  }, []);

  // Auto-slide banners
  useEffect(() => {
    if (!bannerSettings.autoSlide || bannerSettings.banners.filter(banner => banner.isActive).length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => 
        prev === bannerSettings.banners.filter(banner => banner.isActive).length - 1 ? 0 : prev + 1
      );
    }, bannerSettings.slideInterval);

    return () => clearInterval(interval);
  }, [bannerSettings.autoSlide, bannerSettings.slideInterval, bannerSettings.banners]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching data from API...');
        
        // Use optimized data service with caching
        const [productsData, categoriesData] = await Promise.all([
          cachedApi.getProducts(),
          cachedApi.getCategories()
        ]);
        
        console.log('📦 Products data:', productsData.length);
        setProducts(productsData);
        
        console.log('📂 Categories data:', categoriesData.length);
        setCategories(categoriesData);
        
        // Set loading to false after all data is fetched
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setProducts([]);
        setCategories([]);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debug: Log current settings state
  useEffect(() => {
    console.log('🎨 Current banner settings:', bannerSettings);
  }, [bannerSettings]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredProducts = filteredProducts.slice(0, 8);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Banner Skeleton */}
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            
            {/* Search Skeleton */}
            <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>
            
            {/* Categories Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            
            {/* Products Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Carousel */}
      {!isLoading && bannerSettings.banners.filter(banner => banner.isActive).length > 0 && (
        <section className="pt-0 pb-4">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Banner Display */}
              <div className="relative overflow-hidden rounded-2xl">
                {bannerSettings.banners.filter(banner => banner.isActive).map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`transition-all duration-500 ease-in-out ${
                      index === currentBannerIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                  >
                    <div 
                      className={`bg-gradient-to-r ${banner.backgroundColor} text-white p-16 rounded-2xl relative`}
                      style={{ 
                        color: banner.textColor,
                        background: banner.image ? `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3)), var(--tw-gradient-stops)` : undefined
                      }}
                    >
                      {/* Background Image */}
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
                      
                      {/* Content */}
                      <div className="relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                          {banner.title}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 opacity-90">
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {bannerSettings.banners.filter(banner => banner.isActive).length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBannerIndex(prev => 
                      prev === 0 ? bannerSettings.banners.filter(banner => banner.isActive).length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentBannerIndex(prev => 
                      prev === bannerSettings.banners.filter(banner => banner.isActive).length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Banner Indicators */}
              {bannerSettings.banners.filter(banner => banner.isActive).length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {bannerSettings.banners.filter(banner => banner.isActive).map((_, index) => (
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
      )}

      {/* Categories Section */}
      {!isLoading && categories.length > 0 && (
        <section className="py-4 bg-white">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Sliding Category Carousel */}
            <div className="relative">
              <div className="relative overflow-hidden">
                <div className="flex space-x-6 animate-scroll">
                  {/* First set of categories */}
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="group block flex-shrink-0 w-64 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      {/* Category Image */}
                      <div className="w-full h-48 bg-gray-100 overflow-hidden">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900 text-center group-hover:text-blue-600">{category.name}</h3>
                        <p className="text-sm text-gray-500 text-center mt-1">Explore products</p>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Duplicate set for seamless loop */}
                  {categories.map((category) => (
                    <Link
                      key={`${category.id}-duplicate`}
                      href={`/categories/${category.slug}`}
                      className="group block flex-shrink-0 w-64 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      {/* Category Image */}
                      <div className="w-full h-48 bg-gray-100 overflow-hidden">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900 text-center group-hover:text-blue-600">{category.name}</h3>
                        <p className="text-sm text-gray-500 text-center mt-1">Explore products</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Flash Sale Banner */}
      {bannerSettings.flashSaleBanner?.isActive && (
        <section className="py-4 bg-gray-50">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className={`rounded-lg p-8 text-center relative overflow-hidden ${
                bannerSettings.flashSaleBanner.image 
                  ? 'bg-cover bg-center bg-no-repeat' 
                  : `bg-gradient-to-r ${bannerSettings.flashSaleBanner.backgroundColor}`
              }`}
              style={bannerSettings.flashSaleBanner.image ? {
                backgroundImage: `url(${bannerSettings.flashSaleBanner.image})`
              } : {}}
            >
              {/* Dark overlay for better text readability when image is used */}
              {bannerSettings.flashSaleBanner.image && (
                <div className="absolute inset-0 bg-black/40"></div>
              )}
              
              {/* Content with relative positioning */}
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {bannerSettings.flashSaleBanner.title}
                </h2>
                <p className="text-lg text-white/90 mb-6">
                  {bannerSettings.flashSaleBanner.subtitle}
                </p>
                <Link
                  href={bannerSettings.flashSaleBanner.buttonLink}
                  className="inline-block px-8 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                >
                  {bannerSettings.flashSaleBanner.buttonText}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}



      {/* Featured Products Section */}
      {!isLoading && products.length > 0 && (
        <section className="py-4 bg-gray-50">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Featured Products</h2>
            {featuredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Featured Products Yet</h3>
                <p className="text-gray-500">Check back soon for amazing products!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                      <div className="relative">
                        {/* Product Image - Clickable */}
                        <Link href={`/products/${product.slug}`} className="block">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-48 object-contain bg-white p-2 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <span className="text-4xl text-gray-400">📦</span>
                            </div>
                          )}
                        </Link>
                        
                        {/* Heart Icon */}
                        <div className="absolute top-2 right-2">
                          <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors">
                            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-3 text-center">
                        {/* Product Name - Clickable */}
                        <Link href={`/products/${product.slug}`} className="block">
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Category */}
                        <p className="text-sm text-gray-500">
                          {product.categoryName}
                        </p>

                        {/* Price Section */}
                        <div className="space-y-1">
                          {/* Regular Price */}
                          <div className="text-gray-500 line-through text-sm">
                            {formatPrice(product.regularPrice, product.currency)}
                          </div>
                          
                          {/* Sale Price */}
                          <div className="text-xl font-bold text-red-600">
                            {formatPrice(product.salePrice || product.regularPrice, product.currency)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 justify-center">
                          {/* Add to Cart Button */}
                          <button 
                            onClick={() => {
                              addToCart(product);
                            }}
                            className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer"
                            type="button"
                          >
                            Add to Cart
                          </button>
                          
                          {/* Buy Now Button */}
                          <button 
                            onClick={async () => {
                              try {
                                await addToCartAndRedirect(product, '/checkout');
                              } catch (error) {
                                console.error('Error adding to cart and redirecting:', error);
                              }
                            }}
                            className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link
                    href="/products"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    View All Products
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
