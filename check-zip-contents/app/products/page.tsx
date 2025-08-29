"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SharedHeader from "@/components/SharedHeader";
import Footer from "@/components/Footer";

import { formatPrice, onCurrencyChange, getCurrentCurrency } from "@/lib/currency";
import { cachedApi } from "@/lib/data-service";

interface Product {
  id: string;
  name: string;
  categoryName: string;
  regularPrice: number;
  salePrice?: number;
  currency: string;
  images: string[];
  slug: string;
  description: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrentCurrency] = useState<string>('BDT');
  // Removed secondary header filters per request

  // Load current currency and listen for changes
  useEffect(() => {
    // Set initial currency
    setCurrentCurrency(getCurrentCurrency());
    
    // Listen for currency changes
    const cleanup = onCurrencyChange((newCurrency) => {
      setCurrentCurrency(newCurrency);
    });
    
    return cleanup;
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const productsData = await cachedApi.getProducts();
        if (Array.isArray(productsData)) {
          console.log('Products loaded (cached):', productsData.length);
          setProducts(productsData as any);
        } else {
          console.error('Failed to load products: not an array');
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter and sort products
  const filteredProducts = products; // show all; filtering controls removed

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Remove local formatPrice function as we're using the global one

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Page heading section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🛍️ All Products</h1>
              <p className="text-lg text-gray-600">Discover our amazing collection of premium products</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary filters removed as per request */}

      {/* Products Grid */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                  {/* Clickable Product Image and Name Section */}
                  <Link href={`/products/${product.slug}`} className="block cursor-pointer">
                    <div className="relative">
                      {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? (
                        <div className="relative overflow-hidden">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-64 object-contain bg-gray-100 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('Product image failed to load:', product.images[0]);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show placeholder div instead
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-64 bg-gray-200 flex items-center justify-center">
                                    <span class="text-4xl text-gray-400">📦</span>
                                  </div>
                                `;
                              }
                            }}
                            onLoad={(e) => {
                              console.log('Product image loaded successfully:', product.images[0]);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors duration-300">
                          <span className="text-4xl text-gray-400 group-hover:text-gray-500 transition-colors duration-300">📦</span>
                        </div>
                      )}
                      
                      {/* Sale Badge - Left Top */}
                      {product.salePrice && product.salePrice < product.regularPrice && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                          SALE
                        </div>
                      )}
                      
                      {/* Discount Percentage - Right Top */}
                      {product.salePrice && product.salePrice < product.regularPrice && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                          {Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)}% OFF
                        </div>
                      )}
                      
                      {/* Wishlist Button - Bottom Right */}
                      <div className="absolute bottom-2 right-2">
                        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors">
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Clickable Product Name */}
                    <div className="p-4 pb-2">
                      <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2 text-lg text-center group-hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                        {product.name}
                      </h3>
                    </div>
                  </Link>
                  
                  {/* Price Section - Organized and Centered */}
                  <div className="px-4 mb-4 text-center">
                    {product.salePrice ? (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(product.regularPrice, currentCurrency)}
                        </div>
                        <div className="text-xl font-bold text-red-600">
                          {formatPrice(product.salePrice, currentCurrency)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(product.regularPrice, currentCurrency)}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="px-4 pb-4">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/products/${product.slug}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        Buy Now
                      </Link>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
