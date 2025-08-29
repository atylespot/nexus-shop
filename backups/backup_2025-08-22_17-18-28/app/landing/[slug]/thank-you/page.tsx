'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, PhoneIcon, MapPinIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';

interface ThankYouPageProps {
  params: Promise<{ slug: string }>;
}

export default function ThankYouPage({ params }: ThankYouPageProps) {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    customerName: '',
    productName: '',
    totalAmount: 0
  });

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const customerName = searchParams.get('customerName');
    const productName = searchParams.get('productName');
    const totalAmount = searchParams.get('totalAmount');

    if (orderId && customerName && productName && totalAmount) {
      setOrderDetails({
        orderId,
        customerName: decodeURIComponent(customerName),
        productName: decodeURIComponent(productName),
        totalAmount: parseInt(totalAmount)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-6 px-3">
      <div className="max-w-2xl mx-auto">
        {/* Success Header with better background */}
        <div className="text-center mb-6 p-6 bg-white/90 rounded-2xl shadow-lg border border-white/50">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg">
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-pink-600 to-emerald-600 bg-clip-text text-transparent">
            ধন্যবাদ!
          </h1>
          <p className="text-base md:text-lg text-gray-700 mt-2">
            আপনার অর্ডার সফলভাবে জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।
          </p>
        </div>

        {/* Compact colorful card with all info */}
        <div className="rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-blue-200/50 backdrop-blur">
          {/* Top ribbon */}
          <div className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 text-white py-3 px-5">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-semibold flex items-center gap-2">
                📋 অর্ডার আইডি
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{animatedOrderId || '...'}</span>
              </span>
              <span className="text-sm md:text-base font-semibold">মোট: ৳{orderDetails.totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-indigo-200 shadow-sm">
              <p className="text-xs text-indigo-700 font-semibold">কাস্টমার</p>
              <p className="text-lg md:text-xl font-bold text-indigo-900 truncate">{orderDetails.customerName}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-pink-200 shadow-sm">
              <p className="text-xs text-pink-700 font-semibold">প্রোডাক্ট</p>
              <p className="text-base md:text-lg font-semibold text-pink-900 truncate">{orderDetails.productName}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200 shadow-sm">
              <p className="text-xs text-emerald-700 font-semibold">স্ট্যাটাস</p>
              <p className="text-base md:text-lg font-semibold text-emerald-900">Processing</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-200 shadow-sm">
              <p className="text-xs text-amber-700 font-semibold">ডেলিভারি</p>
              <p className="text-base md:text-lg font-semibold text-amber-900">২-৩ দিন</p>
            </div>
          </div>
          {/* Mini steps */}
          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-800 text-xs md:text-sm font-medium flex items-center justify-center gap-1 shadow-sm">
                <PhoneIcon className="w-4 h-4" /> যোগাযোগ
              </div>
              <div className="p-4 rounded-lg bg-green-100 text-green-800 text-xs md:text-sm font-medium flex items-center justify-center gap-1 shadow-sm">
                <MapPinIcon className="w-4 h-4" /> ঠিকানা যাচাই
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-800 text-xs md:text-sm font-medium flex items-center justify-center gap-1 shadow-sm">
                <TruckIcon className="w-4 h-4" /> ডেলিভারি
              </div>
            </div>
          </div>
        </div>

        {/* Remove big sections; keep page single-screen */}

        {/* Important Information */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 mb-6 border-l-4 border-orange-400 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            গুরুত্বপূর্ণ তথ্য
          </h2>
          <div className="space-y-2 text-gray-700 text-sm">
            <p className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>আপনার অর্ডার <strong>প্রসেসিং</strong> স্ট্যাটাসে রয়েছে</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>আমরা শীঘ্রই আপনার মোবাইল নম্বরে কল করব</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>অর্ডার স্ট্যাটাস জানতে আমাদের সাথে যোগাযোগ করুন</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>ক্যাশ অন ডেলিভারি পেমেন্ট গ্রহণ করা হবে</span>
            </p>
          </div>
        </div>

        {/* Compact actions */}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <Link href={'/'} className="px-5 py-3 rounded-xl text-white text-sm md:text-base font-semibold shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200">
            🏠 হোমে ফিরে যান
          </Link>
          <button onClick={() => window.print()} className="px-5 py-3 rounded-xl text-white text-sm md:text-base font-semibold shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200">
            🖨️ রসিদ প্রিন্ট
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-gray-400 text-xs">© ২০২৪ আপনার কোম্পানির নাম</div>
      </div>
    </div>
  );
}
