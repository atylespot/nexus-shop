"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';
import { useCart } from '../../../contexts/CartContext';
import { trackEvent } from '@/lib/pixels';

interface Product {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  regularPrice: number;
  salePrice?: number;
  currency: string;
  images: string[];
}

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // Unwrap params promise for Next.js 15
  const resolvedParams = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadCategoryProducts = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/categories/${resolvedParams.slug}`);
        if (response.ok) {
          const data = await response.json();
          setCategoryName(data.category?.name || '');
          setProducts(data.products);
          
          // Track PageView event
          trackEvent('PageView', {
            event_source_url: window.location.href,
            content_type: 'page',
            content_category: data.category?.name
          });
        } else {
          console.error('Failed to fetch category products');
        }
      } catch (error) {
        console.error('Error loading category products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryProducts();
  }, [resolvedParams.slug]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header Component */}
      <SharedHeader />

      {/* Category Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryName}
          </h1>
                     <p className="text-gray-600">
             {products.length > 0 
               ? `${products.length} product${products.length === 1 ? '' : 's'} found`
               : 'No products in this category yet'
             }
           </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {products.map((product) => (
                 <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                   <div className="relative">
                     {/* Product Image - Clickable */}
                     <Link href={`/products/${product.slug}`} className="block">
                       {product.images && product.images.length > 0 ? (
                         <img
                           src={product.images[0]}
                           alt={product.name}
                           className="w-full h-48 object-contain bg-gray-50 p-2 cursor-pointer hover:opacity-90 transition-opacity"
                         />
                       ) : (
                         <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
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
                         onClick={() => addToCart(product)}
                         className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                       >
                         Add to Cart
                       </button>
                       
                       {/* Buy Now Button */}
                       <Link 
                         href="/checkout"
                         className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center"
                       >
                         Buy Now
                       </Link>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Categories Button */}
            <div className="text-center mt-12">
              <Link
                href="/categories"
                className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                ← Back to Categories
              </Link>
            </div>
          </>
        ) : (
          /* No Products Message */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600 mb-6">
              This category doesn't have any products yet. Check back later!
            </p>
            <Link
              href="/categories"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Other Categories
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
