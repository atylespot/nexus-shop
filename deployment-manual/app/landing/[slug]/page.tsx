import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { cache } from 'react';
import HeaderText from './components/HeaderText';
import ImageCarousel from './components/ImageCarousel';
import OrderForm from './components/OrderForm';
import CheckoutWithVariants from './components/CheckoutWithVariants';
import ViewCounter from './components/ViewCounter';
import PixelLandingTracker from './components/PixelLandingTracker';

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

export const revalidate = 180; // cache page HTML for a short time

const getLandingBySlug = cache(async (slug: string) => {
  return await db.landingPage.findUnique({
    where: { slug },
    include: {
      product: {
        include: {
          variations: { include: { size: true, color: true } }
        }
      }
    }
  });
});

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Fetch landing page data
    const landing = await getLandingBySlug(slug);

    // Debug logging for landing data
    // Minimal debug logging only if missing

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

    const rawVariations = (landing.product as any)?.variations?.map((v: any) => ({
      size: v.size?.name || '',
      color: v.color?.name || ''
    })) || [];
    const allowedVariations: Array<{ color: string; size: string }> = (() => {
      const vc: any = (landing as any).blocks?.variantConfig;
      if (vc && vc.mode === 'colors-sizes' && Array.isArray(vc.colors) && vc.colors.length > 0) {
        const out: Array<{ color: string; size: string }> = [];
        for (const c of vc.colors) {
          const colorName = c?.color || '';
          const sizes: string[] = Array.isArray(c?.sizes) ? c.sizes : [];
          for (const s of sizes) out.push({ color: colorName, size: s });
        }
        return out;
      }
      return rawVariations;
    })();

    return (
      <>
        <ViewCounter slug={slug} />
        <PixelLandingTracker title={landing.title} price={landing.discountPrice ? parseFloat(landing.discountPrice) : (landing.product?.salePrice || landing.product?.regularPrice || 1)} productId={landing.product?.id} currency={landing.product?.currency || 'BDT'} />
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

          <div className="relative z-10 px-6 pb-8 md:px-12 md:pb-12 text-center">
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
                className="text-lg md:text-xl mb-6 max-w-2xl mx-auto"
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
          <div className="py-8 px-6 bg-gradient-to-r from-gray-100 to-blue-100">
            <div className="max-w-[1200px] mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-xl bg-white p-4">
                <iframe
                  src={landing.videoUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title="Product Video"
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Features Section */}
        <div className="py-2 px-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
          <div className="max-w-[1200px] mx-auto">
            {/* কালারফুল ব্যাকগ্রাউন্ড বক্স - শিরোনাম এবং ১০টি বৈশিষ্ট্য সহ */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-center text-white mb-4">
                প্রোডাক্টটি কেন কিনবেন
              </h2>
              <p className="text-center text-blue-100 text-lg max-w-3xl mx-auto mb-8">
                আমাদের প্রোডাক্টের অসাধারণ বৈশিষ্ট্যগুলো দেখে নিশ্চয়ই বুঝতে পারবেন যে এটি কেন আপনার জন্য সেরা পছন্দ
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - 5 Boxes */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={`left-${index}`}
                      className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                        index === 1 ? 'bg-gradient-to-r from-blue-200 to-blue-300' :
                        index === 2 ? 'bg-gradient-to-r from-green-200 to-green-300' :
                        index === 3 ? 'bg-gradient-to-r from-purple-200 to-purple-300' :
                        index === 4 ? 'bg-gradient-to-r from-pink-200 to-pink-300' :
                        'bg-gradient-to-r from-indigo-200 to-indigo-300'
                      }`}
                      style={{
                        animation: `slideInLeft 0.6s ease-out ${index * 0.2}s both`
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          index === 1 ? 'bg-blue-600' :
                          index === 2 ? 'bg-green-600' :
                          index === 3 ? 'bg-purple-600' :
                          index === 4 ? 'bg-pink-600' :
                          'bg-indigo-600'
                        }`}>
                          {index}
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">
                          {index === 1 ? 'তারহীন প্রযুক্তি: কোন তারের ঝামেলা ছাড়া সহজে ব্যবহার করা যায়' :
                           index === 2 ? 'উচ্চ মানের সাউন্ড: উন্নত অডিও প্রযুক্তি দ্বারা সজ্জিত' :
                           index === 3 ? 'লম্বা ব্যাটারির জীবন: একবার চার্জে দীর্ঘ সময় ধরে ব্যবহারের সুবিধা' :
                           index === 4 ? 'স্বাচ্ছন্দ্যময় ডিজাইন: হালকা ও আরামদায়ক ডিজাইন' :
                           'সহজ সংযোগ: ব্লুটুথ প্রযুক্তির মাধ্যমে দ্রুত এবং সহজে সংযোগ'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column - 5 Boxes */}
                <div className="space-y-3">
                  {[6, 7, 8, 9, 10].map((index) => (
                    <div
                      key={`right-${index}`}
                      className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                        index === 6 ? 'bg-gradient-to-r from-yellow-200 to-yellow-300' :
                        index === 7 ? 'bg-gradient-to-r from-red-200 to-red-300' :
                        index === 8 ? 'bg-gradient-to-r from-teal-200 to-teal-300' :
                        index === 9 ? 'bg-gradient-to-r from-orange-200 to-orange-300' :
                        'bg-gradient-to-r from-cyan-200 to-cyan-300'
                      }`}
                      style={{
                        animation: `slideInRight 0.6s ease-out ${(index - 5) * 0.2}s both`
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          index === 6 ? 'bg-yellow-600' :
                          index === 7 ? 'bg-red-600' :
                          index === 8 ? 'bg-teal-600' :
                          index === 9 ? 'bg-orange-600' :
                          'bg-cyan-600'
                        }`}>
                          {index}
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">
                          {index === 6 ? 'বহনযোগ্যতা: কমপ্যাক্ট এবং লাইটওয়েট ডিজাইন' :
                           index === 7 ? 'ইনলাইন কন্ট্রোল: গান পরিবর্তন ও কল গ্রহণের সুবিধা' :
                           index === 8 ? 'কাস্টমাইজেবল ফিট: বিভিন্ন আকারের ইয়ার টিপস' :
                           index === 9 ? 'সাউন্ড আইসোলেশন: বাইরের শব্দ থেকে বিচ্ছিন্ন' :
                           'স্টাইলিশ লুক: আধুনিক এবং স্টাইলিশ ডিজাইন'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variant picker banner removed as per request */}

        {/* Special Offer Price */}
        {(landing.regularPrice || landing.discountPrice) && (
          <div className="py-2 px-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
            <div className="max-w-[1200px] mx-auto">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-center text-white mb-6">
                  বিশেষ অফার প্রাইস
                </h2>

                <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
                  {/* Left Side - Regular Price */}
                  {landing.regularPrice && (
                    <div className="text-2xl text-blue-100 text-center">
                      <span className="inline-block">রেগুলার প্রাইস: <span className="text-5xl font-bold line-through text-red-200">৳{landing.regularPrice}</span></span>
                    </div>
                  )}

                  {/* Center - Order Button */}
                  <div className="flex-shrink-0">
                    <a href="#checkout" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-full text-xl transition-colors shadow-lg transform hover:scale-105">
                      অর্ডার নাও!
                    </a>
                  </div>

                  {/* Right Side - Special Offer Price */}
                  {landing.discountPrice && (
                    <div className="text-2xl text-blue-100 text-center">
                      <span className="inline-block">বিশেষ অফার প্রাইস: <span className="text-5xl font-bold text-green-400 animate-pulse">৳{landing.discountPrice}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Gallery */}
        {landing.productImages && Array.isArray(landing.productImages) && landing.productImages.length > 0 && (
          <div className="py-2 px-6 bg-gradient-to-r from-green-100 via-yellow-100 to-orange-100">
            <div className="max-w-[1200px] mx-auto">
              <div className="bg-gradient-to-r from-green-600 via-yellow-600 to-orange-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <ImageCarousel
                    images={landing.productImages}
                    variant="product"
                    slidesPerView={4}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Features - AI Generated */}
        {landing.productFeatures && (
          <div className="py-2 px-6 bg-gradient-to-r from-indigo-100 via-blue-100 to-cyan-100">
            <div className="max-w-[1200px] mx-auto">
              <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-white mb-4">
                  প্রোডাক্টের ফিচার
                </h2>
                <p className="text-center text-blue-100 text-lg max-w-3xl mx-auto mb-8">
                  আমাদের প্রোডাক্টের বিশেষ বৈশিষ্ট্যগুলো দেখে নিশ্চয়ই বুঝতে পারবেন যে এটি কেন আপনার জন্য সেরা পছন্দ
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Parse and display real AI-generated features in separate boxes */}
                  {(() => {
                    try {
                      // Parse the productFeatures string - it might be JSON or plain text
                      let features: string[] = [];
                      
                      if (typeof landing.productFeatures === 'string') {
                        // Try to parse as JSON first
                        try {
                          const parsed = JSON.parse(landing.productFeatures);
                          if (Array.isArray(parsed)) {
                            features = parsed;
                          } else if (typeof parsed === 'object' && parsed.features) {
                            features = parsed.features;
                          } else {
                            // If it's a single string, try to split by common separators
                            const text = landing.productFeatures;
                            // Split by numbers followed by dots, or newlines, or semicolons
                            const splitFeatures = text.split(/(?:\d+\.|\\n|;|।)/).filter(f => f.trim().length > 0);
                            if (splitFeatures.length > 1) {
                              features = splitFeatures.map(f => f.trim()).filter(f => f.length > 10);
                            } else {
                              features = [text];
                            }
                          }
                        } catch {
                          // If JSON parsing fails, try to split the text
                          const text = landing.productFeatures;
                          const splitFeatures = text.split(/(?:\d+\.|\\n|;|।)/).filter(f => f.trim().length > 0);
                          if (splitFeatures.length > 1) {
                            features = splitFeatures.map(f => f.trim()).filter(f => f.length > 10);
                          } else {
                            features = [text];
                          }
                        }
                      }
                      
                      // Ensure we have exactly 6 features
                      while (features.length < 6) {
                        features.push(`ফিচার ${features.length + 1}`);
                      }
                      
                      // Take only first 6 features
                      const displayFeatures = features.slice(0, 6);
                      
                      return (
                        <>
                          {/* Left Column - 3 Features */}
                          <div className="space-y-3">
                            {displayFeatures.slice(0, 3).map((feature, index) => (
                              <div
                                key={`feature-left-${index}`}
                                className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                                  index === 0 ? 'bg-gradient-to-r from-indigo-200 to-indigo-300' :
                                  index === 1 ? 'bg-gradient-to-r from-blue-200 to-blue-300' :
                                  'bg-gradient-to-r from-cyan-200 to-cyan-300'
                                }`}
                                style={{
                                  animation: `slideInLeft 0.6s ease-out ${(index + 1) * 0.2}s both`
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                    index === 0 ? 'bg-indigo-600' :
                                    index === 1 ? 'bg-blue-600' :
                                    'bg-cyan-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <p className="text-gray-800 font-medium leading-relaxed">
                                    {feature.length > 100 ? `${feature.substring(0, 100)}...` : feature}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Right Column - 3 Features */}
                          <div className="space-y-3">
                            {displayFeatures.slice(3, 6).map((feature, index) => (
                              <div
                                key={`feature-right-${index}`}
                                className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                                  index === 0 ? 'bg-gradient-to-r from-purple-200 to-purple-300' :
                                  index === 1 ? 'bg-gradient-to-r from-pink-200 to-pink-300' :
                                  'bg-gradient-to-r from-teal-200 to-teal-300'
                                }`}
                                style={{
                                  animation: `slideInRight 0.6s ease-out ${(index + 1) * 0.2}s both`
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                    index === 0 ? 'bg-purple-600' :
                                    index === 1 ? 'bg-pink-600' :
                                    'bg-teal-600'
                                  }`}>
                                    {index + 4}
                                  </div>
                                  <p className="text-gray-800 font-medium leading-relaxed">
                                    {feature.length > 100 ? `${feature.substring(0, 100)}...` : feature}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    } catch (error) {
                      // Fallback to placeholder features if parsing fails
                      return (
                        <>
                          {/* Left Column - 3 Placeholder Features */}
                          <div className="space-y-3">
                            {[1, 2, 3].map((index) => (
                              <div
                                key={`placeholder-left-${index}`}
                                className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                                  index === 1 ? 'bg-gradient-to-r from-indigo-200 to-indigo-300' :
                                  index === 2 ? 'bg-gradient-to-r from-blue-200 to-blue-300' :
                                  'bg-gradient-to-r from-cyan-200 to-cyan-300'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                    index === 1 ? 'bg-indigo-600' :
                                    index === 2 ? 'bg-blue-600' :
                                    'bg-cyan-600'
                                  }`}>
                                    {index}
                                  </div>
                                  <p className="text-gray-800 font-medium leading-relaxed">
                                    ফিচার {index}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Right Column - 3 Placeholder Features */}
                          <div className="space-y-3">
                            {[4, 5, 6].map((index) => (
                              <div
                                key={`placeholder-right-${index}`}
                                className={`p-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ${
                                  index === 4 ? 'bg-gradient-to-r from-purple-200 to-purple-300' :
                                  index === 5 ? 'bg-gradient-to-r from-pink-200 to-pink-300' :
                                  'bg-gradient-to-r from-teal-200 to-teal-300'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                    index === 4 ? 'bg-purple-600' :
                                    index === 5 ? 'bg-pink-600' :
                                    'bg-teal-600'
                                  }`}>
                                    {index}
                                  </div>
                                  <p className="text-gray-800 font-medium leading-relaxed">
                                    ফিচার {index}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        {landing.customerReviews && Array.isArray(landing.customerReviews) && landing.customerReviews.length > 0 && (
          <div className="py-2 px-6 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100">
            <div className="max-w-[1200px] mx-auto">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-white mb-8">
                  কাস্টমার রিভিউ
                </h2>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <ImageCarousel
                    images={landing.customerReviews}
                    variant="reviews"
                    slidesPerView={4}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning/Notice Section */}
        <div className="py-2 px-6 bg-gradient-to-r from-red-100 via-orange-100 to-yellow-100">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">⚠️ সতর্কতা বার্তা</h3>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-700 mb-2">নকল প্রোডাক্ট থেকে সাবধান!</h4>
                      <p className="text-gray-700 leading-relaxed">
                        বাজারে অনেক নকল প্রোডাক্ট পাওয়া যায় যা দেখতে একদম আসল প্রোডাক্টের মত। 
                        <span className="font-semibold text-red-600">১০০-২০০ টাকার জন্য</span> নকল প্রোডাক্ট কিনে 
                        <span className="font-semibold text-red-600">প্রতারিত হবেন না</span>। 
                        নকল প্রোডাক্টে আপনার টাকা নষ্ট হবে এবং কোন গুণগত মান পাবেন না।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-orange-700 mb-2">কিভাবে চিনবেন?</h4>
                      <p className="text-gray-700 leading-relaxed">
                        নকল প্রোডাক্টে সাধারণত <span className="font-semibold">প্যাকেজিং খারাপ থাকে</span>, 
                        <span className="font-semibold">কোড স্ক্র্যাচ করে দেওয়া থাকে</span>, 
                        <span className="font-semibold">গ্যারান্টি কার্ড থাকে না</span>। 
                        সাবধান থাকুন এবং শুধুমাত্র <span className="font-semibold text-green-600">অরিজিনাল প্রোডাক্ট</span> কিনুন।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 shadow-lg text-center">
                <h4 className="text-2xl font-bold text-white mb-3">🎯 কেন আমাদের প্রোডাক্ট কিনবেন?</h4>
                <div className="grid md:grid-cols-2 gap-4 text-white">
                  <div className="text-left">
                    <p className="mb-2">✅ <span className="font-semibold">১০০% অরিজিনাল গ্যারান্টি</span></p>
                    <p className="mb-2">✅ <span className="font-semibold">সরাসরি ব্র্যান্ড থেকে</span></p>
                    <p className="mb-2">✅ <span className="font-semibold">ফুল ওয়ারেন্টি</span></p>
                  </div>
                  <div className="text-left">
                    <p className="mb-2">✅ <span className="font-semibold">সর্বোচ্চ গুণগত মান</span></p>
                    <p className="mb-2">✅ <span className="font-semibold">সহজ রিটার্ন পলিসি</span></p>
                    <p className="mb-2">✅ <span className="font-semibold">২৪/৭ কাস্টমার সাপোর্ট</span></p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/20 rounded-lg">
                  <p className="text-white font-medium">
                    <span className="text-yellow-200 font-bold">💡 স্মার্ট বিনিয়োগ:</span> 
                    নকল প্রোডাক্টে টাকা নষ্ট করার চেয়ে অরিজিনাল প্রোডাক্টে একটু বেশি টাকা খরচ করে 
                    <span className="font-bold text-yellow-200">দীর্ঘমেয়াদী সুবিধা</span> নিন!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection & Order Form Combined */}
        <div id="checkout" className="py-2 px-6 bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 shadow-2xl">
              {/* Product selection header removed per request - selection happens below */}

              {/* Order Form Section */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg">
                <h2 className="text-3xl font-bold text-center text-white mb-8">
                  অর্ডার কনফার্ম করতে ফর্মটি পূরণ করুন
                </h2>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 shadow-lg">
                  <CheckoutWithVariants landing={landing} productImageSrc={productImage} allowedVariations={allowedVariations} />
                </div>
              </div>
            </div>
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

            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
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
      </>
    );
  } catch (error) {
    console.error('Error in LandingPage:', error);
    notFound();
  }
}
