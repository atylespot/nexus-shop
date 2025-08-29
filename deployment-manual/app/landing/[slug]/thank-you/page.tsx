'use client';

import { useEffect, useRef, useState } from 'react';
import { pixelEvents, generateEventId, refreshAdvancedMatching } from '@/lib/pixelTracking';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { CheckCircleIcon, PhoneIcon, MapPinIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';

interface ThankYouPageProps {
  params: Promise<{ slug: string }>;
}

export default function ThankYouPage({ params }: ThankYouPageProps) {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productName: '',
    totalAmount: 0,
    quantity: 1
  });

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const customerName = searchParams.get('customerName');
    const customerPhone = searchParams.get('customerPhone');
    const customerAddress = searchParams.get('customerAddress');
    const productName = searchParams.get('productName');
    const totalAmount = searchParams.get('totalAmount');
    const quantity = searchParams.get('quantity');
    const gender = searchParams.get('gender');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const dob = searchParams.get('dob');

    console.log('URL Parameters:', { orderId, customerName, customerPhone, customerAddress, productName, totalAmount, quantity });

    if (orderId && customerName && productName && totalAmount) {
      setOrderDetails({
        orderId,
        customerName: decodeURIComponent(customerName),
        customerPhone: customerPhone ? decodeURIComponent(customerPhone) : '',
        customerAddress: customerAddress ? decodeURIComponent(customerAddress) : '',
        productName: decodeURIComponent(productName),
        totalAmount: parseInt(totalAmount),
        quantity: quantity ? parseInt(quantity) : 1
      });
    }
  }, [searchParams]);

  // Animated counter for order ID
  const [animatedOrderId, setAnimatedOrderId] = useState('');
  
  useEffect(() => {
    if (orderDetails.orderId) {
      let currentId = '';
      const targetId = orderDetails.orderId;
      let index = 0;
      
      const timer = setInterval(() => {
        if (index < targetId.length) {
          currentId += targetId[index];
          setAnimatedOrderId(currentId);
          index++;
        } else {
          clearInterval(timer);
        }
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [orderDetails.orderId]);

  // PageView handled globally in PixelBootstrap to avoid duplicates

  // Purchase tracking (server + browser) - fire once
  const purchaseFiredRef = useRef(false);
  useEffect(() => {
    if (purchaseFiredRef.current) return;
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');
    const currency = searchParams.get('currency') || 'BDT';
    const productName = searchParams.get('productName');
    const totalAmount = searchParams.get('totalAmount');
    const quantity = searchParams.get('quantity');

    if (orderId && productId && productName && totalAmount) {
      try {
        try {
          // We may have phone in URL; persist and refresh advanced matching
          const phone = searchParams.get('customerPhone');
          if (phone) {
            localStorage.setItem('pixel_phone', decodeURIComponent(phone));
            refreshAdvancedMatching();
          }
          if (gender) localStorage.setItem('pixel_gender', gender);
          if (firstName) localStorage.setItem('pixel_first_name', decodeURIComponent(firstName));
          if (lastName) localStorage.setItem('pixel_last_name', decodeURIComponent(lastName));
          if (dob) localStorage.setItem('pixel_dob', decodeURIComponent(dob));
        } catch {}
        const eventId = generateEventId();
        pixelEvents.purchase({
          content_name: decodeURIComponent(productName),
          content_category: 'landing_purchase',
          content_ids: [productId],
          content_type: 'product',
          value: parseInt(totalAmount),
          currency,
          num_items: quantity ? parseInt(quantity) : 1,
          order_id: orderId
        }, {
          eventId,
          enableClientTracking: true,
          enableServerTracking: true,
          userData: {
            phone: orderDetails.customerPhone || undefined,
            external_id: orderId || undefined,
            country: 'BD',
            gender: (typeof window !== 'undefined' ? localStorage.getItem('pixel_gender') || undefined : undefined),
            first_name: (typeof window !== 'undefined' ? localStorage.getItem('pixel_first_name') || undefined : undefined),
            last_name: (typeof window !== 'undefined' ? localStorage.getItem('pixel_last_name') || undefined : undefined),
            dob: (typeof window !== 'undefined' ? localStorage.getItem('pixel_dob') || undefined : undefined)
          }
        });
        purchaseFiredRef.current = true;
      } catch {}
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Success Header with Floating Animation */}
        <div className="text-center mb-8 animate-float">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full mb-6 shadow-2xl animate-bounce">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent mb-4 animate-pulse">
            🎉 ধন্যবাদ!
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            আপনার অর্ডার সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।
          </p>
        </div>

        {/* Main Content Box with Colorful Background */}
        <div className="bg-gradient-to-br from-white/95 via-blue-50/95 to-purple-50/95 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-xl p-8 mb-8 transform hover:scale-[1.02] transition-all duration-500">
          {/* Order ID and Total Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">অর্ডার আইডি</p>
                  <p className="text-2xl font-bold font-mono">{animatedOrderId || '...'}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm font-medium">মোট অ্যামাউন্ট</p>
                <p className="text-3xl font-bold text-yellow-300">৳{orderDetails.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Info */}
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">👤</span>
                </div>
                <h3 className="text-lg font-bold text-blue-800">কাস্টমার</h3>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-2">{orderDetails.customerName}</p>
              {orderDetails.customerPhone && (
                <p className="text-sm text-blue-700 mb-1">📞 {orderDetails.customerPhone}</p>
              )}
              {orderDetails.customerAddress && (
                <p className="text-sm text-blue-700">🏠 {orderDetails.customerAddress}</p>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl p-6 border border-pink-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🎧</span>
                </div>
                <h3 className="text-lg font-bold text-pink-800">প্রোডাক্ট</h3>
              </div>
              <p className="text-lg font-semibold text-pink-900 leading-relaxed mb-2">{orderDetails.productName}</p>
              <p className="text-sm text-pink-700">পরিমাণ: {orderDetails.quantity} পিস</p>
            </div>

            {/* Order Status */}
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✅</span>
                </div>
                <h3 className="text-lg font-bold text-green-800">স্ট্যাটাস</h3>
              </div>
              <p className="text-xl font-bold text-green-900">Processing</p>
              <p className="text-sm text-green-700 mt-1">অর্ডার প্রসেস হচ্ছে</p>
            </div>

            {/* Delivery Info */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-6 border border-amber-200 shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🚚</span>
                </div>
                <h3 className="text-lg font-bold text-amber-800">ডেলিভারি</h3>
              </div>
              <p className="text-xl font-bold text-amber-900">২-৩ দিন</p>
              <p className="text-sm text-amber-700 mt-1">ফ্রি ডেলিভারি</p>
            </div>
          </div>

          {/* Process Steps */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">অর্ডার প্রসেস</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-md transform hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PhoneIcon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-blue-800">যোগাযোগ</p>
                <p className="text-xs text-blue-600 mt-1">আমরা কল করব</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md transform hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-green-800">ঠিকানা যাচাই</p>
                <p className="text-xs text-green-600 mt-1">ঠিকানা নিশ্চিত</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md transform hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TruckIcon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-purple-800">ডেলিভারি</p>
                <p className="text-xs text-purple-600 mt-1">২-৩ দিনে</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information Box */}
        <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 rounded-3xl p-8 mb-8 border border-orange-200 shadow-xl transform hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-orange-800">গুরুত্বপূর্ণ তথ্য</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-white/60 rounded-xl">
              <span className="text-orange-500 text-lg mt-1">•</span>
              <p className="text-orange-800 font-medium">আপনার অর্ডার <strong>প্রসেসিং</strong> স্ট্যাটাসে রয়েছে</p>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-white/60 rounded-xl">
              <span className="text-orange-500 text-lg mt-1">•</span>
              <p className="text-orange-800 font-medium">আমরা শীঘ্রই আপনার মোবাইল নম্বরে কল করব</p>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-white/60 rounded-xl">
              <span className="text-orange-500 text-lg mt-1">•</span>
              <p className="text-orange-800 font-medium">অর্ডার স্ট্যাটাস জানতে আমাদের সাথে যোগাযোগ করুন</p>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-white/60 rounded-xl">
              <span className="text-orange-500 text-lg mt-1">•</span>
              <p className="text-orange-800 font-medium">ক্যাশ অন ডেলিভারি পেমেন্ট গ্রহণ করা হবে</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <Link href={'/'} className="w-full md:w-auto px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-2 border-blue-400/50">
            🏠 হোমে ফিরে যান
          </Link>
          <button onClick={() => window.print()} className="w-full md:w-auto px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-2 border-emerald-400/50">
            🖨️ রসিদ প্রিন্ট
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <Footer />
        </div>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
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
          
          .animate-slideInUp {
            animation: slideInUp 0.6s ease-out both;
          }
        `
      }} />
    </div>
  );
}
