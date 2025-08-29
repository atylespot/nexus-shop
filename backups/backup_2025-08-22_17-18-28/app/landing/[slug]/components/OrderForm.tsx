'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderFormProps {
  landing: {
    id: number;
    product: {
      id: number;
      name: string;
    };
    discountPrice?: string | null;
    regularPrice?: string | null;
    shippingAreas?: Array<{ area: string; charge: string }> | null;
    freeDelivery?: boolean | null;
  };
  productImageSrc?: string | null;
}

export default function OrderForm({ landing, productImageSrc }: OrderFormProps) {
  const router = useRouter();
  const [selectedDelivery, setSelectedDelivery] = useState('0'); // Default to first shipping area
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate delivery charge based on selection
  const getDeliveryCharge = () => {
    if (landing.freeDelivery) return 0;
    
    const shippingIndex = parseInt(selectedDelivery);
    if (landing.shippingAreas && landing.shippingAreas[shippingIndex]) {
      return parseInt(landing.shippingAreas[shippingIndex].charge);
    }
    
    return 0;
  };

  const productPrice = parseInt(landing.discountPrice || landing.regularPrice || '0');
  const deliveryCharge = getDeliveryCharge();
  const totalPrice = productPrice + deliveryCharge;

  // Validate Bangladesh phone number
  const validatePhoneNumber = (phone: string) => {
    // Bangladesh mobile number format: 01XXXXXXXXX (11 digits starting with 01)
    const phoneRegex = /^01[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = { name: '', phone: '', address: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'নাম দিতে হবে';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'মোবাইল নম্বর দিতে হবে';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'সঠিক বাংলাদেশের মোবাইল নম্বর দিন (01XXXXXXXXX)';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'ঠিকানা দিতে হবে';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        productId: landing.product.id,
        productName: landing.product.name,
        productPrice: productPrice,
        deliveryCharge: deliveryCharge,
        totalAmount: totalPrice,
        deliveryArea: landing.freeDelivery ? 'ফ্রি ডেলিভারি' : 
          (landing.shippingAreas && landing.shippingAreas[parseInt(selectedDelivery)]) ? 
          landing.shippingAreas[parseInt(selectedDelivery)].area : 'ঢাকার ভিতরে',
        landingPageId: landing.id
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to thank you page with order details
        const thankYouUrl = `/landing/${landing.id}/thank-you?orderId=${result.orderId}&customerName=${encodeURIComponent(formData.name)}&productName=${encodeURIComponent(landing.product.name)}&totalAmount=${totalPrice}`;
        router.push(thankYouUrl);
      } else {
        alert(`❌ অর্ডার জমা করতে সমস্যা হয়েছে:\n${result.error}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('❌ অর্ডার জমা করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Customer Information */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/30">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          👤 কাস্টমার ইনফরমেশন
        </h3>
        <form id="checkoutForm" onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div>
            <label className="block text-white font-semibold mb-2 text-lg">
              📝 আপনার নাম *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="আপনার পূর্ণ নাম লিখুন"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                errors.name 
                  ? 'border-red-400 bg-red-500/20' 
                  : 'border-white/30 bg-white/20 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/50'
              } text-white placeholder-white/70 focus:outline-none`}
              required
            />
            {errors.name && (
              <p className="text-red-300 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-white font-semibold mb-2 text-lg">
              📞 মোবাইল নম্বর *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="০১xxxxxxxxx"
              maxLength={11}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                errors.phone 
                  ? 'border-red-400 bg-red-500/20' 
                  : 'border-white/30 bg-white/20 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/50'
              } text-white placeholder-white/70 focus:outline-none`}
              required
            />
            {errors.phone && (
              <p className="text-red-300 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.phone}
              </p>
            )}
            <p className="text-white/70 text-xs mt-1">
              📱 ফরম্যাট: 01XXXXXXXXX (১১ ডিজিট)
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-white font-semibold mb-2 text-lg">
              🏠 সম্পূর্ণ ঠিকানা *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন (গ্রাম/মহল্লা, থানা, জেলা)"
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 resize-none ${
                errors.address 
                  ? 'border-red-400 bg-red-500/20' 
                  : 'border-white/30 bg-white/20 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/50'
              } text-white placeholder-white/70 focus:outline-none`}
              required
            ></textarea>
            {errors.address && (
              <p className="text-red-300 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.address}
              </p>
            )}
          </div>

          {/* Delivery Option */}
          <div>
            <label className="block text-white font-semibold mb-2 text-lg">
              🚚 ডেলিভারি অপশন
            </label>
            <div className="space-y-3">
              {landing.freeDelivery ? (
                <div className="bg-green-500/20 rounded-lg p-3 border border-green-300/50">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-300 text-lg">🎉</span>
                    <span className="text-white font-semibold">ডেলিভারি সম্পূর্ণ ফ্রি!</span>
                  </div>
                </div>
              ) : (
                <>
                  {landing.shippingAreas && Array.isArray(landing.shippingAreas) && landing.shippingAreas.map((shipping, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-all duration-300">
                      <input 
                        type="radio" 
                        name="delivery" 
                        value={index.toString()} 
                        checked={selectedDelivery === index.toString()}
                        onChange={(e) => setSelectedDelivery(e.target.value)}
                        className="text-yellow-400 focus:ring-yellow-300" 
                      />
                      <span className="text-white text-sm">
                        🏠 {shipping.area} - ৳{shipping.charge}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Submit button moved to right column */}
        </form>
      </div>

      {/* Right Column - Order Summary */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/30">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          📋 অর্ডার সামারি
        </h3>
        
        {/* Selected Product Display */}
        <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/50 mb-6">
          <h4 className="text-lg font-bold text-green-100 mb-3">
            🎯 সিলেক্টেড প্রোডাক্ট
          </h4>
          <div className="flex items-center space-x-4">
            {productImageSrc ? (
              <img
                src={productImageSrc}
                alt={landing.product.name}
                className="w-16 h-16 object-contain rounded-lg bg-white/10 p-2 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                🎧
              </div>
            )}
            <div>
              <h5 className="text-white font-semibold">{landing.product.name}</h5>
              <p className="text-green-100 text-sm">Regular Version</p>
              <p className="text-green-200 font-bold">৳{landing.discountPrice || landing.regularPrice || '0'}</p>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-white">
            <span>প্রোডাক্টের দাম:</span>
            <span className="font-semibold">৳{productPrice}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>ডেলিভারি চার্জ:</span>
            <span className="font-semibold">
              {landing.freeDelivery ? (
                <span className="text-green-300">ফ্রি</span>
              ) : (
                <span>৳{deliveryCharge}</span>
              )}
            </span>
          </div>
          <hr className="border-white/30" />
          <div className="flex justify-between text-lg font-bold text-green-200">
            <span>সর্বমোট:</span>
            <span>৳{totalPrice}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/50 mb-6">
          <h4 className="text-lg font-bold text-green-100 mb-3 text-center">
            💳 পেমেন্ট মেথড
          </h4>
          <div className="flex items-center justify-center space-x-3 bg-white/10 rounded-lg p-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">💵</span>
            </div>
            <span className="text-white font-semibold text-lg">ক্যাশ অন ডেলিভারি</span>
          </div>
          <p className="text-green-100 text-sm text-center mt-2">
            প্রোডাক্ট হাতে পেয়ে টাকা দিবেন - ১০০% নিরাপদ
          </p>
        </div>

        {/* Submit Button - placed under payment method in summary (right column) */}
        <button
          form="checkoutForm"
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-4 px-6 rounded-xl text-xl shadow-2xl transition-all duration-300 border-2 ${
            isSubmitting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black transform hover:scale-105 border-yellow-300/50'
          }`}
        >
          {isSubmitting ? '⏳ জমা হচ্ছে...' : '🎯 অর্ডার কনফার্ম করুন'}
        </button>

                  

          

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm">
            🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ ও গোপনীয়
          </p>
        </div>
      </div>
    </div>
  );
}
