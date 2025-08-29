"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SharedHeader from "@/components/SharedHeader";
import Footer from "@/components/Footer";
import { useFacebookPixelTracking } from "@/app/hooks/useFacebookPixelTracking";

import { formatPrice, getCurrentCurrency } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useJourneyLogger } from "@/lib/journeyClient";
import { cachedApi } from "@/lib/data-service";

interface ProductVariation {
  id: string;
  sizeId?: number;
  colorId?: number;
  quantity: number;
  price?: number;
  imageUrl?: string;
  sku?: string;
  size?: {
    id: number;
    name: string;
  };
  color?: {
    id: number;
    name: string;
    hexCode: string;
  };
}

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
  sku?: string;
  variations?: ProductVariation[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  
  // Facebook Pixel Tracking Hook
  const { trackViewContent, trackAddToCart, trackInitiateCheckout } = useFacebookPixelTracking('Product Detail');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCurrency, setCurrentCurrency] = useState<string>('BDT');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const journey = useJourneyLogger({ source: 'website', pageType: 'product' });

  useEffect(() => {
    setCurrentCurrency(getCurrentCurrency());
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        const productData = await cachedApi.getBySlug ? await (cachedApi as any).getBySlug(slug) : await (await fetch(`/api/products/${slug}`)).json();
        if (productData) {
          setProduct(productData);
          // Auto log product view with product info for table image/name
          const firstImage = (productData.images && productData.images.length > 0) ? productData.images[0] : undefined;
          journey.logView({
            productId: productData.id,
            productName: productData.name,
            productImage: firstImage
          });
          
          // Track ViewContent event when product loads (dedup in hook by product id)
          trackViewContent({
            content_name: productData.name,
            content_category: productData.categoryName,
            content_ids: [productData.id],
            content_type: 'product',
            value: productData.salePrice || productData.regularPrice,
            currency: productData.currency || 'BDT',
            num_items: 1
          });

          // Load related products
          loadRelatedProducts((productData as any).categoryId, productData.id);
        } else {
          console.error('Failed to fetch product');
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadRelatedProducts = async (categoryId: string, currentProductId: string) => {
    try {
      // First try to get products from same category
      let relatedData: any[] | null = null;
      try {
        const all = await cachedApi.getProducts();
        relatedData = (all as any[]).filter(p => String((p as any).categoryId) === String(categoryId));
      } catch {}
      if (Array.isArray(relatedData)) {
        const filtered = relatedData.filter((p: Product) => p.id !== currentProductId).slice(0, 4);
        
        if (filtered.length > 0) {
          setRelatedProducts(filtered);
          return;
        }
      }
      
      // If no related products, get any random products
      try {
        const allData = await cachedApi.getProducts();
        const filtered = allData.filter((p: Product) => p.id !== currentProductId).slice(0, 4);
        setRelatedProducts(filtered);
      } catch {}
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  // Update selected variation when size or color changes
  useEffect(() => {
    if (product?.variations && (selectedSize || selectedColor)) {
      const variation = product.variations.find(v => 
        (!selectedSize || v.size?.name === selectedSize) &&
        (!selectedColor || v.color?.name === selectedColor)
      );
      setSelectedVariation(variation || null);
    }
  }, [selectedSize, selectedColor, product]);

  // Get available sizes (filtered by selected color when provided)
  const availableSizes = product?.variations
    ?.filter(v => v.size && (!selectedColor || (v.color && v.color.name === selectedColor)))
    ?.map(v => v.size!)
    ?.filter((size, index, self) => self.findIndex(s => s.id === size.id) === index)
    || [];

  // Get available colors (optionally could filter by selected size; we keep all but disable those without stock)
  const availableColors = product?.variations
    ?.filter(v => v.color)
    ?.map(v => v.color!)
    ?.filter((color, index, self) => self.findIndex(c => c.id === color.id) === index)
    || [];

  // Helpers to determine availability for UI enabling
  const isColorEnabled = (colorName: string) => {
    if (!product?.variations) return false;
    return product.variations.some(v =>
      (v.color?.name === colorName) &&
      (!selectedSize || v.size?.name === selectedSize) &&
      v.quantity > 0
    );
  };

  const isSizeEnabled = (sizeName: string) => {
    if (!product?.variations) return false;
    return product.variations.some(v =>
      (v.size?.name === sizeName) &&
      (!selectedColor || v.color?.name === selectedColor) &&
      v.quantity > 0
    );
  };

  // Get current price (variation price or product price)
  const getCurrentPrice = () => {
    if (selectedVariation?.price) {
      return selectedVariation.price;
    }
    return product?.salePrice || product?.regularPrice || 0;
  };

  // Get current image (variation image or product images)
  const getCurrentImages = () => {
    if (selectedVariation?.imageUrl) {
      return [selectedVariation.imageUrl, ...(product?.images || [])];
    }
    return product?.images || [];
  };

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: `${product.id}_${selectedSize || 'no-size'}_${selectedColor || 'no-color'}`,
      name: `${product.name}${selectedSize ? ` - ${selectedSize}` : ''}${selectedColor ? ` - ${selectedColor}` : ''}`,
      slug: product.slug,
      regularPrice: getCurrentPrice(),
      salePrice: product.salePrice,
      price: getCurrentPrice(),
      currency: currentCurrency,
      images: getCurrentImages(),
      image: getCurrentImages()[0] || '',
      quantity,
      selectedSize,
      selectedColor,
      variationId: selectedVariation?.id,
      categoryName: product.categoryName
    };

    // Use cart context to add item
    addToCart(cartItem);
    
    // Track AddToCart event with stronger deduplication
    trackAddToCart({
      content_name: product.name,
      content_category: product.categoryName,
      content_ids: [product.id],
      content_type: 'product',
      value: getCurrentPrice(),
      currency: currentCurrency,
      num_items: quantity
    });
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Add to cart first
    handleAddToCart();
    
    // Redirect to checkout (InitiateCheckout will be tracked on checkout page)
    router.push('/checkout/form');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
            <p className="mt-4 text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImages = getCurrentImages();

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Product Gallery & Tabs */}
          <div className="xl:col-span-2 space-y-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div 
                className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-white shadow-sm md:shadow-md relative cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={() => setIsImageZoomed(true)}
              >
                {currentImages.length > 0 ? (
                  <img
                    src={currentImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-6xl text-gray-400">📦</span>
                  </div>
                )}
                
                {/* Zoom Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white rounded-full p-3 shadow-lg">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                
                {/* Discount Badge */}
                {product.salePrice && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-lg">
                      {Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)}% OFF
                    </div>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {currentImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {currentImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Tabs Section */}
            <div className="bg-white rounded-lg shadow-md">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'description'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Product Description
                  </button>
                  <button
                    onClick={() => setActiveTab('specifications')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'specifications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews & Ratings
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Product Description</h3>
                    {product.description ? (
                      <div className="text-gray-700 space-y-3">
                        {product.description.split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No description available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-600">Product Name</span>
                          <span className="text-gray-900">{product.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-600">Category</span>
                          <span className="text-gray-900">{product.categoryName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-600">SKU</span>
                          <span className="text-gray-900">{product.sku || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-600">Regular Price</span>
                          <span className="text-gray-900">{formatPrice(product.regularPrice, currentCurrency)}</span>
                        </div>
                        {product.salePrice && (
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-600">Sale Price</span>
                            <span className="text-red-600 font-bold">{formatPrice(product.salePrice, currentCurrency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-600">Currency</span>
                          <span className="text-gray-900">{currentCurrency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews & Ratings</h3>
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">⭐</div>
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                      <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Write a Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Product Info & Related Products */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="space-y-2">
              {product.salePrice ? (
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(getCurrentPrice(), currentCurrency)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.regularPrice, currentCurrency)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(getCurrentPrice(), currentCurrency)}
                </span>
              )}
            </div>

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => { setSelectedColor(color.name); setSelectedSize(''); }}
                      disabled={!isColorEnabled(color.name)}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
                        selectedColor === color.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isColorEnabled(color.name) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      ></div>
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Size</h3>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.name)}
                      disabled={!isSizeEnabled(size.name)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        selectedSize === size.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!isSizeEnabled(size.name) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Status */}
            {selectedVariation && (
              <div className="text-sm">
                {selectedVariation.quantity > 0 ? (
                  <span className="text-green-600">✓ In Stock ({selectedVariation.quantity} available)</span>
                ) : (
                  <span className="text-red-600">✗ Out of Stock</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    (availableSizes.length > 0 && !selectedSize) ||
                    (availableColors.length > 0 && !selectedColor) ||
                    (selectedVariation && selectedVariation.quantity === 0) || false
                  }
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={
                    (availableSizes.length > 0 && !selectedSize) ||
                    (availableColors.length > 0 && !selectedColor) ||
                    (selectedVariation && selectedVariation.quantity === 0) || false
                  }
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Buy Now
                </button>
              </div>
              
              {((availableSizes.length > 0 && !selectedSize) || (availableColors.length > 0 && !selectedColor)) && (
                <p className="text-sm text-red-600 text-center">
                  Please select {!selectedSize && availableSizes.length > 0 ? 'size' : ''} 
                  {!selectedSize && !selectedColor && availableSizes.length > 0 && availableColors.length > 0 ? ' and ' : ''}
                  {!selectedColor && availableColors.length > 0 ? 'color' : ''}
                </p>
              )}

              {/* WhatsApp Contact */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <span className="font-medium text-green-800">WhatsApp Order</span>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  {product.name}
                </p>
                <a
                  href={`https://wa.me/8801234567890?text=Hi, I want to order ${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Order via WhatsApp
                </a>
              </div>
            </div>

            {/* Related Products Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
              <div className="space-y-4">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <img
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {relatedProduct.salePrice ? (
                            <>
                              <span className="text-sm font-bold text-red-600">
                                {formatPrice(relatedProduct.salePrice, currentCurrency)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(relatedProduct.regularPrice, currentCurrency)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(relatedProduct.regularPrice, currentCurrency)}
                            </span>
                          )}
                        </div>
                        <a
                          href={`/products/${relatedProduct.slug}`}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                        >
                          View Product →
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">📦</span>
                    </div>
                    <p className="text-gray-500 text-sm">Loading products...</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-3 flex gap-2 md:hidden">
        <button onClick={handleAddToCart} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium">Add to Cart</button>
        <button onClick={handleBuyNow} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium">Buy Now</button>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && currentImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-full animate-slide-up">
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={currentImages[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}