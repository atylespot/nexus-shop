"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SharedHeader from "@/components/SharedHeader";
import Footer from "@/components/Footer";
import { trackEvent } from '@/lib/pixels';

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
  // Removed secondary header filters per request

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/products');
        if (response.ok) {
          const productsData = await response.json();
          setProducts(productsData);
          
          // Track PageView event
          trackEvent('PageView', {
            event_source_url: window.location.href,
            content_type: 'page'
          });
        } else {
          console.error('Failed to fetch products');
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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Page heading section */}
      <section className="bg-white shadow-sm">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
              <p className="mt-2 text-gray-600">Discover our amazing collection of products</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Home
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative">
                      {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            console.log('Product image failed to load:', product.images[0]);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={(e) => {
                            console.log('Product image loaded successfully:', product.images[0]);
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-4xl text-gray-400">📦</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                      {product.salePrice && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                            SALE
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {product.categoryName}
                      </p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {product.salePrice ? (
                            <>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(product.salePrice, product.currency)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(product.regularPrice, product.currency)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.regularPrice, product.currency)}
                            </span>
                          )}
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </Link>
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
