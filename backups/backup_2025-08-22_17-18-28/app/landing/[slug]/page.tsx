import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import HeaderText from './components/HeaderText';
import ImageCarousel from './components/ImageCarousel';
import OrderForm from './components/OrderForm';

interface Landing {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  productId: number;
  headerImage: string | null;
  videoUrl: string | null;
  productDescription: string | null;
  regularPrice: string | null;
  discountPrice: string | null;
  productImages: string[] | null;
  productFeatures: string | null;
  customerReviews: string[] | null;
  shippingAreas: Array<{ area: string; charge: string }>;
  freeDelivery: boolean;
  blocks: {
    ctaText?: string;
  } | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    aiDescription: string | null;
    buyPrice: number;
    regularPrice: number;
    salePrice: number | null;
    currency: string;
    sku: string | null;
    status: string;
    categoryId: number;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Fetch landing page data
    const landing = await db.landingPage.findUnique({
      where: { slug },
      include: { product: true },
    });

    if (!landing) {
      notFound();
    }

    // Fetch first product image from ProductImage table as canonical product photo
    let productImage: string | null = (landing.product?.image as string | null) || null;
    try {
      const firstImage: any = await (db as any).productImage?.findFirst?.({
        where: { productId: landing.productId },
        orderBy: { id: 'asc' }
      });
      if (!productImage && firstImage) {
        productImage = firstImage.url || firstImage.imageUrl || firstImage.path || null;
      }
    } catch (_) {
      // ignore if productImage table or fields differ
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header Section */}
        <div className="relative bg-white shadow-lg min-h-[400px] md:min-h-[500px] flex flex-col justify-end overflow-hidden">
          {landing.headerImage && (
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <img
                  src={landing.headerImage}
                  alt="Header Background"
                  className="w-full h-full object-cover"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 65%, 95% 75%, 90% 82%, 85% 87%, 80% 91%, 75% 94%, 70% 96%, 65% 98%, 60% 99%, 50% 100%, 40% 99%, 35% 98%, 30% 96%, 25% 94%, 20% 91%, 15% 87%, 10% 82%, 5% 75%, 0% 65%)',
                    WebkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 65%, 95% 75%, 90% 82%, 85% 87%, 80% 91%, 75% 94%, 70% 96%, 65% 98%, 60% 99%, 50% 100%, 40% 99%, 35% 98%, 30% 96%, 25% 94%, 20% 91%, 15% 87%, 10% 82%, 5% 75%, 0% 65%)'
                  }}
                />
              </div>
            </div>
          )}

          <div className="relative z-10 px-6 pb-8 md:px-12 md:pb-12">
            <HeaderText
              imageUrl={landing.headerImage}
              className="text-4xl md:text-6xl font-bold mb-4"
              tag="h1"
              landingId={landing.id}
            >
              {landing.title}
            </HeaderText>

            {landing.subtitle && (
              <HeaderText
                imageUrl={landing.headerImage}
                className="text-lg md:text-xl mb-6 max-w-2xl"
                tag="p"
              >
                {landing.subtitle}
              </HeaderText>
            )}

            {landing.blocks?.ctaText && (
              <a href="#checkout" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors shadow-lg">
                {landing.blocks.ctaText}
              </a>
            )}
          </div>
        </div>

        {/* Video Section */}
        {landing.videoUrl && (
          <div className="py-16 px-6 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                <iframe
                  src={landing.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Product Video"
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Description Section */}
        {landing.productDescription && (
          <div className="py-16 px-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                প্রোডাক্ট সম্পর্কে
              </h2>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left Column - Text */}
                <div className="space-y-6">
                  <div
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: landing.productDescription }}
                  />
                </div>

                {/* Right Column - Product Image */}
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={productImage || landing.headerImage || '/placeholder-product.jpg'}
                      alt={landing.product?.name || 'Product'}
                      className="w-full max-w-md h-auto rounded-lg shadow-2xl border-4 border-white"
                    />
                    <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                      অরিজিনাল প্রোডাক্ট
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Gallery */}
        {landing.productImages && landing.productImages.length > 0 && (
          <div className="py-12 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <ImageCarousel
                images={landing.productImages}
                variant="product"
                slidesPerView={3}
              />
            </div>
          </div>
        )}

        {/* Product Features Section */}
        {landing.productFeatures && (
          <div className="py-16 px-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                প্রোডাক্টের বৈশিষ্ট্য
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {landing.productFeatures.split('\n').filter((feature: string) => feature.trim()).map((feature: string, index: number) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-300"
                    style={{
                      animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium leading-relaxed">
                        {feature.trim()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        {landing.customerReviews && landing.customerReviews.length > 0 && (
          <div className="py-16 px-6 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                কাস্টমার রিভিউ
              </h2>
              <ImageCarousel
                images={landing.customerReviews}
                variant="reviews"
                slidesPerView={2}
              />
            </div>
          </div>
        )}

        {/* Warning/Notice Section */}
        <div className="py-8 px-6 bg-red-50 border-l-4 border-red-400">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">সতর্কতা!</h3>
                <p className="text-red-700">
                  নকল পণ্য থেকে সাবধান থাকুন। আমরা ১০০% অরিজিনাল পণ্যের গ্যারান্টি দিচ্ছি।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Offer Price */}
        {(landing.regularPrice || landing.discountPrice) && (
          <div className="py-12 px-6 bg-gradient-to-r from-orange-400 to-red-500">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                  বিশেষ অফার প্রাইস
                </h2>

                <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-6 md:space-y-0 md:space-x-8">
                  <div className="flex-1 space-y-4">
                    {landing.regularPrice && (
                      <div className="text-lg text-gray-600">
                        <span className="block">নিয়মিত দাম</span>
                        <span className="text-3xl font-bold line-through text-red-500">
                          ৳{landing.regularPrice}
                        </span>
                      </div>
                    )}

                    {landing.discountPrice && (
                      <div className="text-xl text-green-600">
                        <span className="block">বিশেষ অফার</span>
                        <span
                          className="text-4xl md:text-5xl font-bold text-green-600 animate-pulse"
                          style={{
                            background: 'linear-gradient(45deg, #10B981, #059669)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'priceGlow 2s ease-in-out infinite alternate'
                          }}
                        >
                          ৳{landing.discountPrice}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <a href="#checkout" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-colors shadow-lg transform hover:scale-105">
                      অর্ডার করুন!
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              পণ্য নির্বাচন
            </h2>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <img
                  src={productImage || landing.headerImage || '/placeholder-product.jpg'}
                  alt={landing.product?.name || 'Product'}
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {landing.product?.name || 'Product Name'}
                  </h3>
                  <p className="text-green-600 font-bold text-lg">
                    ৳{landing.discountPrice || landing.regularPrice || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form/Checkout */}
        <div id="checkout" className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              অর্ডার কনফার্ম করতে ফর্মটি পূরণ করুন
            </h2>
            <OrderForm
              landing={landing}
              productImageSrc={productImage}
            />
          </div>
        </div>

        {/* CSS Animation Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes priceGlow {
              from {
                text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
              }
              to {
                text-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6);
              }
            }
          `
        }} />
      </div>
    );
  } catch (error) {
    console.error('Error in LandingPage:', error);
    notFound();
  }
}
