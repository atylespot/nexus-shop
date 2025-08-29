"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';
import { cachedApi, Category as DsCategory } from '@/lib/data-service';


interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load categories using cached data-service for speed
    const loadCategories = async () => {
      try {
        console.log('🔄 Loading categories from API...');
        const categoriesData = await cachedApi.getCategories();
        if (Array.isArray(categoriesData)) {
          console.log('📂 Categories loaded:', categoriesData.length);
          setCategories(categoriesData as unknown as Category[]);
          
          // Track PageView event
          
        } else {
          console.error('Failed to fetch categories: not an array');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Keep header mounted during loading to avoid layout shift */}
        <SharedHeader />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />

      {/* Categories Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h1>
          <p className="text-xl text-gray-600">
            Browse our products by category and find what you're looking for
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/categories/${category.slug}`}
                prefetch={false}
                onMouseEnter={() => {
                  try { (window as any).next?.router?.prefetch?.(`/categories/${category.slug}`); } catch {}
                }}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  {/* Category Image */}
                  <div className="relative h-48 bg-gray-100">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.log('Category image failed to load:', category.imageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          console.log('Category image loaded successfully:', category.imageUrl);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl text-gray-400">📁</span>
                      </div>
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-4 text-blue-600 font-medium group-hover:text-blue-700">
                      Browse Products →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* No Categories Message */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Categories Available
            </h3>
            <p className="text-gray-600 mb-6">
              No product categories have been created yet.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
