'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { CheckCircleIcon, PhoneIcon, MapPinIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import SharedHeader from '../../components/SharedHeader';
import Footer from '../../components/Footer';
import { useFacebookPixelTracking } from '../hooks/useFacebookPixelTracking';
import { trackEvent, refreshAdvancedMatching } from '@/lib/pixelTracking';

function ThankYouPageContent() {
  const searchParams = useSearchParams();
  const { trackPurchase } = useFacebookPixelTracking('ThankYou');
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    orderNo: '',
    customerName: '',
    phone: '',
    address: '',
    city: '',
    country: 'BD',
    total: 0,
    currency: 'USD',
    items: [] as any[]
  });

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const orderNo = searchParams.get('orderNo');
    const customerName = searchParams.get('customerName');
    const phone = searchParams.get('phone');
    const address = searchParams.get('address');
    const total = searchParams.get('total');
    const currency = searchParams.get('currency');
    const itemsParam = searchParams.get('items');
    const city = searchParams.get('city');
    const country = searchParams.get('country') || 'BD';
    const gender = searchParams.get('gender');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const dob = searchParams.get('dob');

    console.log('URL Parameters:', { orderId, orderNo, customerName, phone, address, total, currency, itemsParam });

    let items = [];
    if (itemsParam) {
      try {
        items = JSON.parse(decodeURIComponent(itemsParam));
      } catch (e) {
        console.error('Error parsing items:', e);
      }
    }

    if (orderId && customerName && total) {
      setOrderDetails({
        orderId,
        orderNo: orderNo || '',
        customerName: decodeURIComponent(customerName),
        phone: phone ? decodeURIComponent(phone) : '',
        address: address ? decodeURIComponent(address) : '',
        city: city ? decodeURIComponent(city) : '',
        country,
        total: parseFloat(total),
        currency: currency || 'USD',
        items: items
      });
      try {
        if (phone) localStorage.setItem('pixel_phone', decodeURIComponent(phone));
        if (city) localStorage.setItem('pixel_city', decodeURIComponent(city));
        localStorage.setItem('pixel_country', country || 'BD');
        if (gender) localStorage.setItem('pixel_gender', gender);
        if (firstName) localStorage.setItem('pixel_first_name', decodeURIComponent(firstName));
        if (lastName) localStorage.setItem('pixel_last_name', decodeURIComponent(lastName));
        if (dob) localStorage.setItem('pixel_dob', decodeURIComponent(dob));
      } catch {}
      try { refreshAdvancedMatching(); } catch {}
    }
  }, [searchParams]);

  // Fire Purchase once when we have order details
  useEffect(() => {
    try {
      if (orderDetails.orderId && orderDetails.total > 0) {
        const contentIds = (orderDetails.items || []).map((it: any, idx: number) => `thankyou_${idx}`);

        // Local lock to prevent duplicate purchases for the same order
        const lockKey = `pixel_purchase_${orderDetails.orderId}`;
        const existing = typeof window !== 'undefined' ? window.localStorage.getItem(lockKey) : null;
        if (existing) return;
        if (typeof window !== 'undefined') window.localStorage.setItem(lockKey, '1');

        trackPurchase({
          content_name: 'Purchase',
          content_category: 'purchase',
          content_ids: contentIds.length ? contentIds : ['purchase'],
          content_type: 'order',
          value: orderDetails.total,
          currency: orderDetails.currency || 'BDT',
          num_items: (orderDetails.items || []).reduce((t: number, it: any) => t + (it.quantity || 1), 0) || 1,
          order_id: orderDetails.orderId
        }, {
          phone: orderDetails.phone || undefined,
          external_id: orderDetails.orderId || undefined,
          city: orderDetails.city || undefined,
          country: orderDetails.country || 'BD',
          gender: (typeof window !== 'undefined' ? localStorage.getItem('pixel_gender') || undefined : undefined),
          first_name: (typeof window !== 'undefined' ? localStorage.getItem('pixel_first_name') || undefined : undefined),
          last_name: (typeof window !== 'undefined' ? localStorage.getItem('pixel_last_name') || undefined : undefined),
          dob: (typeof window !== 'undefined' ? localStorage.getItem('pixel_dob') || undefined : undefined)
        });
        // Ensure a proper PageView with eventID + server call on Thank You page
        setTimeout(() => {
          try {
            if (!(window as any).__pageviewFired) {
              trackEvent('PageView', {
                content_name: 'Thank You',
                content_category: 'page'
              }, { enableClientTracking: true, enableServerTracking: true });
              (window as any).__pageviewFired = true;
            }
          } catch {}
        }, 300);
      }
    } catch {}
  }, [orderDetails, trackPurchase]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-0 pb-8 px-4 relative overflow-hidden">
      <SharedHeader />
      
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
                  <span className="text-2xl">📦</span>
                </div>
                <div className="text-left">
                  <p className="text-white/80 text-sm">অর্ডার নম্বর</p>
                  <p className="text-2xl font-bold font-mono">{animatedOrderId || orderDetails.orderId}</p>
                  {orderDetails.orderNo && (
                    <p className="text-white/80 text-sm">Order #: {orderDetails.orderNo}</p>
                  )}
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm">মোট মূল্য</p>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: orderDetails.currency
                  }).format(orderDetails.total)}
                </p>
              </div>
            </div>
          </div>

                     {/* Order Items */}
           {orderDetails.items && orderDetails.items.length > 0 && (
             <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200 mb-8">
               <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                 📦 অর্ডার আইটেম
               </h3>
               <div className="space-y-3">
                 {orderDetails.items.map((item: any, index: number) => (
                   <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3 border border-orange-200">
                     <div>
                       <p className="font-medium text-gray-800">{item.name}</p>
                       <p className="text-sm text-gray-600">কোয়ান্টিটি: {item.quantity}</p>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-orange-800">
                         {new Intl.NumberFormat('en-US', {
                           style: 'currency',
                           currency: orderDetails.currency
                         }).format(item.price * item.quantity)}
                       </p>
                       <p className="text-sm text-gray-600">
                         {new Intl.NumberFormat('en-US', {
                           style: 'currency',
                           currency: orderDetails.currency
                         }).format(item.price)} × {item.quantity}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* Customer Information */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <PhoneIcon className="w-5 h-5 mr-2" />
                গ্রাহক তথ্য
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">নাম</p>
                    <p className="font-medium text-blue-800">{orderDetails.customerName}</p>
                  </div>
                </div>
                {orderDetails.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📞</span>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">ফোন</p>
                      <p className="font-medium text-green-800">{orderDetails.phone}</p>
                    </div>
                  </div>
                )}
                {orderDetails.address && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📍</span>
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">ঠিকানা</p>
                      <p className="font-medium text-purple-800">{orderDetails.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <TruckIcon className="w-5 h-5 mr-2" />
                ডেলিভারি তথ্য
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📋</span>
                  </div>
                  <div>
                    <p className="text-sm text-orange-600">স্ট্যাটাস</p>
                    <p className="font-medium text-orange-800">প্রসেসিং</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⏰</span>
                  </div>
                  <div>
                    <p className="text-sm text-teal-600">সময়</p>
                    <p className="font-medium text-teal-800">২-৩ দিন</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">💳</span>
                  </div>
                  <div>
                    <p className="text-sm text-pink-600">পেমেন্ট</p>
                    <p className="font-medium text-pink-800">ক্যাশ অন ডেলিভারি</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              পরবর্তী ধাপগুলি
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg">1</span>
                </div>
                <p className="text-sm font-medium text-orange-800">অর্ডার কনফার্ম</p>
                <p className="text-xs text-orange-600">আমরা আপনার অর্ডার কনফার্ম করব</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg">2</span>
                </div>
                <p className="text-sm font-medium text-orange-800">ডেলিভারি</p>
                <p className="text-xs text-orange-600">২-৩ দিনের মধ্যে ডেলিভারি</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg">3</span>
                </div>
                <p className="text-sm font-medium text-orange-800">পেমেন্ট</p>
                <p className="text-xs text-orange-600">ডেলিভারির সময় পেমেন্ট</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
          >
            🛍️ আবার কেনাকাটা করুন
          </Link>
          <Link 
            href="/contact" 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
          >
            📞 যোগাযোগ করুন
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouPageContent />
    </Suspense>
  );
}
