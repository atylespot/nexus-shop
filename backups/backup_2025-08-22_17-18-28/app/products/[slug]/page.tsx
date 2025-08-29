"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';
import { cachedApi } from '@/lib/data-service';
import { trackEvent } from '@/lib/pixels';
import { useCart } from '../../../contexts/CartContext';
import WhatsAppPopup from '../../../components/WhatsAppPopup';
import { usePixelEvents } from '@/hooks/usePixelEvents';

interface Product {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  regularPrice: number;
  salePrice?: number;
  currency: string;
  images: string[];
  description?: string;
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { addToCart, addToCartAndRedirect } = useCart();
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        console.log('🔄 Loading product from API:', resolvedParams.slug);
        // Try cache first for instant load
        let currentProduct: any | null = null;
        try {
          const all = await cachedApi.getProducts();
          currentProduct = all.find((p:any)=>p.slug === resolvedParams.slug) || null;
        } catch {}

        if (!currentProduct) {
          // Fallback: fetch single product
          const response = await fetch(`/api/products/${resolvedParams.slug}`);
          if (!response.ok) throw new Error('Failed to fetch product');
          currentProduct = await response.json();
        }

        console.log('📦 Product loaded:', currentProduct);
        setProduct(currentProduct);
        // Track ViewContent event (client-side + server-side)
        try { 
          trackEvent('ViewContent', { 
            value: currentProduct.salePrice || currentProduct.regularPrice, 
            currency: currentProduct.currency, 
            content_ids: [currentProduct.id], 
            content_type: 'product', 
            num_items: 1,
            content_name: currentProduct.name,
            content_category: currentProduct.categoryName,
            event_source_url: window.location.href
          }); 
          
          // Also fire client-side event
          trackViewContent(
            currentProduct.id, 
            currentProduct.name, 
            currentProduct.salePrice || currentProduct.regularPrice
          );
        } catch {}

        // Related products from cached list if possible
        let allProducts: any[] = [];
        try {
          allProducts = await cachedApi.getProducts();
        } catch {
          const allProductsResponse = await fetch('/api/products');
          allProducts = allProductsResponse.ok ? await allProductsResponse.json() : [];
        }

        const related = allProducts
          .filter((prod: any) => prod.categoryName === currentProduct.categoryName && prod.id !== currentProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
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
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Product Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist.
            </p>
            <Link
              href="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <Link href="/categories" className="text-gray-700 hover:text-blue-600 ml-1 md:ml-2">
                  Categories
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-500 ml-1 md:ml-2">{product.categoryName}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Product Images & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg h-[360px] md:h-[420px] lg:h-[460px]">
              {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-contain p-4 transform transition-transform duration-300 ease-out ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'} md:hover:scale-125`}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onClick={() => setIsZoomed((z) => !z)}
                  onTouchStart={() => setIsZoomed((z) => !z)}
                  onError={(e) => {
                    console.log('Main product image failed to load:', product.images[selectedImage]);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    console.log('Main product image loaded successfully:', product.images[selectedImage]);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-6xl text-gray-400">📦</span>
                </div>
              )}
            </div>

            {/* Product Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Gallery</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => {
                          console.log('Thumbnail image failed to load:', image);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          console.log('Thumbnail image loaded successfully:', image);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Details Tabs */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'description', name: 'Description' },
                    { id: 'rating', name: 'Rating & Reviews' },
                    { id: 'specifications', name: 'Specifications' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'description' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Description</h3>
                    {product.description ? (
                      <p className="text-gray-600 leading-relaxed">{product.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description available for this product.</p>
                    )}
                  </div>
                )}

                {activeTab === 'rating' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating & Reviews</h3>
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">⭐</div>
                      <p className="text-gray-500">No reviews yet</p>
                      <p className="text-sm text-gray-400">Be the first to review this product!</p>
                    </div>
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Specifications</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Product ID</span>
                        <span className="font-medium">{product.id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">SKU</span>
                        <span className="font-medium">{product.slug}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium">{product.categoryName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Regular Price</span>
                        <span className="font-medium">{formatPrice(product.regularPrice, product.currency)}</span>
                      </div>
                      {product.salePrice && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Sale Price</span>
                          <span className="font-medium text-red-600">{formatPrice(product.salePrice, product.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Product Info & Related Products */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <p className="text-gray-600">Category: {product.categoryName}</p>
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    {formatPrice(product.salePrice || product.regularPrice, product.currency)}
                  </div>
                  {product.salePrice && (
                    <div className="text-lg text-gray-500 line-through">
                      {formatPrice(product.regularPrice, product.currency)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await addToCartAndRedirect(product, '/checkout');
                      } catch (error) {
                        console.error('Error adding to cart and redirecting:', error);
                      }
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    Buy Now
                  </button>
                </div>
                
                {/* WhatsApp Button */}
                <div className="pt-3">
                  <button 
                    onClick={() => setShowWhatsAppPopup(true)}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Products</h3>
                <div className="space-y-4">
                  {relatedProducts.map((relatedProduct) => (
                    <Link 
                      key={relatedProduct.id} 
                      href={`/products/${relatedProduct.slug}`}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {relatedProduct.images && Array.isArray(relatedProduct.images) && relatedProduct.images.length > 0 && relatedProduct.images[0] ? (
                          <img
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Related product image failed to load:', relatedProduct.images[0]);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={(e) => {
                              console.log('Related product image loaded successfully:', relatedProduct.images[0]);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xl text-gray-400">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {relatedProduct.name}
                        </h4>
                        <p className="text-sm text-red-600 font-semibold">
                          {formatPrice(relatedProduct.salePrice || relatedProduct.regularPrice, relatedProduct.currency)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link
            href="/categories"
            className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            ← Back to Categories
          </Link>
        </div>
      </div>
      
      {/* WhatsApp Popup */}
      <WhatsAppPopup
        isOpen={showWhatsAppPopup}
        onClose={() => setShowWhatsAppPopup(false)}
        productName={product.name}
        productPrice={formatPrice(product.salePrice || product.regularPrice, product.currency)}
      />
      <Footer />
    </div>
  );
}
