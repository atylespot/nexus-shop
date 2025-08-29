'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pixelEvents, generateEventId } from '@/lib/pixelTracking';
import { useJourneyLogger } from '@/lib/journeyClient';

interface OrderFormProps {
  landing: {
    id: number;
    product: {
      id: number;
      name: string;
    };
    product?: {
      variations?: Array<{ size?: { name?: string }; color?: { name?: string }; quantity?: number; price?: number; imageUrl?: string }>
    };
    discountPrice?: string | null;
    regularPrice?: string | null;
    shippingAreas?: Array<{ area: string; charge: string }> | null;
    freeDelivery?: boolean | null;
    blocks?: { ctaText?: string; variantConfig?: { mode?: string; colors?: Array<{ color: string; sizes: string[] }> } } | null;
  };
  productImageSrc?: string | null;
  allowedVariations?: Array<{ color: string; size: string }>;
  preselectedColor?: string;
  preselectedSize?: string;
}

export default function OrderForm({ landing, productImageSrc, allowedVariations: allowedFromServer, preselectedColor, preselectedSize }: OrderFormProps) {
  const router = useRouter();
  const icFiredRef = useRef(false);
  
  // Debug logging for landing data
  console.log('=== ORDERFORM COMPONENT RENDERED ===');
  console.log('Landing data received:', landing);
  console.log('Landing ID:', landing?.id);
  console.log('Landing Product:', landing?.product);
  console.log('Product Name:', landing?.product?.name);
  console.log('Product Image Src:', productImageSrc);
  
  const [selectedDelivery, setSelectedDelivery] = useState('0'); // Default to first shipping area
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    quantity: '1' // Added quantity state
  });
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [selectedColor, setSelectedColor] = useState(preselectedColor || '');
  const [selectedSize, setSelectedSize] = useState(preselectedSize || '');
  const allVariations = (landing as any)?.product?.variations || [];
  const vc = landing.blocks?.variantConfig;
  const allowedColorSizePairs: Array<{ color: string; size: string }> = (() => {
    if (Array.isArray(allowedFromServer) && allowedFromServer.length > 0) {
      return allowedFromServer;
    }
    if (vc && vc.mode === 'colors-sizes' && Array.isArray(vc.colors) && vc.colors.length > 0) {
      const out: Array<{ color: string; size: string }> = [];
      for (const c of vc.colors) {
        const colorName = c?.color || '';
        const sizes: string[] = Array.isArray(c?.sizes) ? c.sizes : [];
        for (const s of sizes) out.push({ color: colorName, size: s });
      }
      return out;
    }
    return allVariations
      .map((v: any) => ({ color: v?.color?.name || '', size: v?.size?.name || '' }))
      .filter(p => p.color || p.size);
  })();

  const colorOptions = Array.from(new Set(allowedColorSizePairs.map(p => p.color).filter(Boolean)));
  const sizeOptionsForColor = selectedColor ? Array.from(new Set(allowedColorSizePairs.filter(p => p.color === selectedColor).map(p => p.size).filter(Boolean))) : [];

  // Auto-select single option
  useEffect(() => {
    if (colorOptions.length === 1) setSelectedColor(prev => prev || colorOptions[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorOptions.join('|')]);

  useEffect(() => {
    if (selectedColor && sizeOptionsForColor.length === 1) setSelectedSize(prev => prev || sizeOptionsForColor[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, sizeOptionsForColor.join('|')]);

  // Sync with preselected values from parent (image-based selector)
  useEffect(() => { if (preselectedColor) setSelectedColor(preselectedColor); }, [preselectedColor]);
  useEffect(() => { if (preselectedSize) setSelectedSize(preselectedSize); }, [preselectedSize]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonTouched, setIsButtonTouched] = useState(false);
  const journey = useJourneyLogger({ source: 'landing_page', pageType: 'landing_checkout', defaultProduct: { id: landing?.product?.id, name: landing?.product?.name, image: productImageSrc || undefined }, landing: { id: landing?.id } });
  
  // Ensure a view event is logged immediately when the landing page loads
  useEffect(() => {
    try {
      journey.logView({
        productId: landing?.product?.id,
        productName: landing?.product?.name,
        productImage: productImageSrc || undefined
      }, 0);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landing?.id]);

  // Offer modal (landing scope)
  useEffect(() => {
    let timer: any;
    (async () => {
      try {
        const res = await fetch(`/api/customer-info/offer?scope=landing_page&landingPageId=${landing?.id || ''}`);
        if (res.ok) {
          const list = await res.json();
          const o = Array.isArray(list) ? list.find((x: any) => x.enabled) : null;
          if (o) {
            const delayMs = Math.max(0, Math.min(3600, Number(o.delaySeconds ?? 10))) * 1000;
            timer = setTimeout(() => {
              alert(`${o.title || 'Special Offer'}\n${o.message || ''}`);
            }, delayMs);
          }
        }
      } catch {}
    })();
    return () => { if (timer) clearTimeout(timer); };
  }, [landing?.id]);
  
  // Calculate delivery charge based on selection
  const getDeliveryCharge = () => {
    if (landing.freeDelivery) return 0;
    
    const shippingIndex = parseInt(selectedDelivery);
    if (landing.shippingAreas && Array.isArray(landing.shippingAreas) && landing.shippingAreas[shippingIndex]) {
      return parseInt(landing.shippingAreas[shippingIndex].charge);
    }
    
    return 0;
  };

  const productPrice = parseInt(landing.discountPrice || landing.regularPrice || '0');
  const matchedVariation: any = allVariations.find((v: any) => (
    (v?.color?.name || '') === (selectedColor || '') && (v?.size?.name || '') === (selectedSize || '')
  ));
  const currentUnitPrice = (matchedVariation && matchedVariation.price != null)
    ? Number(matchedVariation.price)
    : productPrice;
  const deliveryCharge = getDeliveryCharge();
  const quantity = parseInt(formData.quantity || '1');
  const totalPrice = (productPrice * quantity) + deliveryCharge;

  // Fire InitiateCheckout once when the form is shown
  useEffect(() => {
    if (icFiredRef.current) return;
    try {
      const eventId = generateEventId();
      pixelEvents.initiateCheckout({
        content_name: landing.product.name,
        content_category: 'landing_checkout',
        content_ids: [landing.product.id],
        content_type: 'product',
        value: totalPrice,
        currency: 'BDT',
        num_items: quantity
      }, {
        eventId,
        enableClientTracking: true,
        enableServerTracking: true
      });
      icFiredRef.current = true;
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire AddToCart when quantity increased (pre-checkout intent)
  useEffect(() => {
    try {
      const eventId = generateEventId();
      pixelEvents.addToCart({
        content_name: landing.product.name,
        content_category: 'product',
        content_ids: [landing.product.id],
        content_type: 'product',
        value: currentUnitPrice * quantity,
        currency: 'BDT',
        num_items: quantity
      }, {
        eventId,
        enableClientTracking: true,
        enableServerTracking: true,
        deduplicationWindow: 15000
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  // Auto log: reached landing checkout form
  useEffect(() => { journey.logCheckoutForm({
    productId: landing?.product?.id,
    productName: landing?.product?.name,
    productImage: productImageSrc || undefined
  }); }, []);

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
    // log partials as checkout_filled
    if (['name','phone','address'].includes(field)) {
      journey.logCheckoutFilled({
        customerName: field === 'name' ? value : formData.name,
        fullName: field === 'name' ? value : formData.name,
        // send phone immediately on every keystroke to not miss it
        phone: field === 'phone' ? value : formData.phone,
        address: field === 'address' ? value : formData.address,
        productName: landing?.product?.name,
        productId: landing?.product?.id,
        productImage: productImageSrc || undefined,
      }, 0); // no debounce so phone is captured reliably
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
    const baseValid = !Object.values(newErrors).some(error => error);
    const vc = landing.blocks?.variantConfig;
    if (vc && vc.mode === 'colors-sizes') {
      if (!selectedColor || !selectedSize) return false;
    }
    return baseValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Before submit, fire AddToCart one more time to capture last state
    try {
      const eventId = generateEventId();
      pixelEvents.addToCart({
        content_name: landing.product.name,
        content_category: 'product',
        content_ids: [landing.product.id],
        content_type: 'product',
        value: currentUnitPrice * quantity,
        currency: 'BDT',
        num_items: quantity
      }, { eventId, enableClientTracking: true, enableServerTracking: true, deduplicationWindow: 15000 });
    } catch {}
    
    setIsSubmitting(true);
    
    try {
      const vc = landing.blocks?.variantConfig;
      const orderData = {
        orderType: 'landing_page', // Specify this is a landing page order
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        productId: vc && vc.mode === 'colors-sizes' && selectedColor && selectedSize ? `${landing.product.id}_${selectedSize}_${selectedColor}` : landing.product.id,
        productName: vc && vc.mode === 'colors-sizes' && selectedColor && selectedSize ? `${landing.product.name} - ${selectedSize} - ${selectedColor}` : landing.product.name,
        productPrice: productPrice,
        deliveryCharge: deliveryCharge,
        totalAmount: totalPrice,
        quantity: quantity, // Include quantity in order data
        deliveryArea: landing.freeDelivery ? 'ফ্রি ডেলিভারি' : 
          (landing.shippingAreas && Array.isArray(landing.shippingAreas) && landing.shippingAreas[parseInt(selectedDelivery)]) ? 
          landing.shippingAreas[parseInt(selectedDelivery)].area : 'ঢাকার ভিতরে',
        landingPageId: landing.id,
        paymentMethod: (landing as any)?.blocks?.paymentMethod || 'cash_on_delivery'
      };

      console.log('Submitting order data:', orderData);
      console.log('Form data:', formData);
      console.log('Landing data:', landing);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        // Debug logging for URL creation
        console.log('=== CREATING THANK YOU URL ===');
        console.log('Landing ID:', landing.id);
        console.log('Landing Product:', landing.product);
        console.log('Product Name:', landing.product?.name);
        console.log('Form Data:', formData);
        console.log('Total Price:', totalPrice);
        console.log('Quantity:', quantity);
        
        // Redirect to thank you page with order details
        // Persist phone/city/country for advanced matching
        try {
          if (formData.phone) localStorage.setItem('pixel_phone', formData.phone);
          localStorage.setItem('pixel_country', 'BD');
        } catch {}

        const displayName = vc && vc.mode === 'colors-sizes' && selectedColor && selectedSize ? `${landing.product.name} - ${selectedSize} - ${selectedColor}` : (landing.product?.name || 'Unknown Product');
        const productIdParam = vc && vc.mode === 'colors-sizes' && selectedColor && selectedSize ? `${landing.product.id}_${selectedSize}_${selectedColor}` : String(landing.product.id);
        const thankYouUrl = `/landing/${landing.id}/thank-you?orderId=${result.orderId}&customerName=${encodeURIComponent(formData.name)}&customerPhone=${encodeURIComponent(formData.phone)}&customerAddress=${encodeURIComponent(formData.address)}&productName=${encodeURIComponent(displayName)}&totalAmount=${totalPrice}&quantity=${quantity}&productId=${encodeURIComponent(productIdParam)}&currency=BDT`;
        console.log('Redirecting to thank you page with URL:', thankYouUrl);
        router.push(thankYouUrl);
      } else {
        alert(`❌ অর্ডার জমা করতে সমস্যা হয়েছে:\n${result.error}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('❌ অর্ডার জমা করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
      setIsButtonTouched(false); // Reset button state
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Customer Information */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/30 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          👤 কাস্টমার ইনফরমেশন
        </h3>
        <form id="checkoutForm" onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div className="input-group">
            <label className="block text-gray-700 font-semibold mb-2 text-lg flex items-center space-x-2 group">
              <div className="icon-circle w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform group-hover:scale-110 transition-all duration-300">
                📝
              </div>
              <span className="group-hover:text-blue-600 transition-colors duration-300">আপনার নাম *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="আপনার পূর্ণ নাম লিখুন"
                className={`input-field relative w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                  errors.name 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 hover:border-blue-400'
                } text-gray-800 placeholder-gray-500 focus:outline-none transform hover:scale-[1.02] focus:scale-[1.02]`}
                required
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="input-group">
            <label className="block text-gray-700 font-semibold mb-2 text-lg flex items-center space-x-2 group">
              <div className="icon-circle w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform group-hover:scale-110 transition-all duration-300">
                📞
              </div>
              <span className="group-hover:text-green-600 transition-colors duration-300">মোবাইল নম্বর *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="০১xxxxxxxxx"
                maxLength={11}
                className={`input-field relative w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                  errors.phone 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-green-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/50 hover:border-green-400'
                } text-gray-800 placeholder-gray-500 focus:outline-none transform hover:scale-[1.02] focus:scale-[1.02]`}
                required
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.phone}
              </p>
            )}
            <p className="text-gray-600 text-xs mt-1">
              📱 ফরম্যাট: 01XXXXXXXXX (১১ ডিজিট)
            </p>
          </div>

          {/* Address */}
          <div className="input-group">
            <label className="block text-gray-700 font-semibold mb-2 text-lg flex items-center space-x-2 group">
              <div className="icon-circle w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform group-hover:scale-110 transition-all duration-300">
                🏠
              </div>
              <span className="group-hover:text-purple-600 transition-colors duration-300">সম্পূর্ণ ঠিকানা *</span>
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন (গ্রাম/মহল্লা, থানা, জেলা)"
                rows={3}
                className={`input-field relative w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 resize-none ${
                  errors.address 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-purple-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 hover:border-purple-400'
                } text-gray-800 placeholder-gray-500 focus:outline-none transform hover:scale-[1.02] focus:scale-[1.02]`}
                required
              ></textarea>
            </div>
            {errors.address && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.address}
              </p>
            )}
          </div>

          {/* Delivery Option */}
          <div className="input-group">
            <label className="block text-gray-700 font-semibold mb-2 text-lg flex items-center space-x-2 group">
              <div className="icon-circle w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform group-hover:scale-110 transition-all duration-300">
                🚚
              </div>
              <span className="group-hover:text-orange-600 transition-colors duration-300">ডেলিভারি অপশন</span>
            </label>
            <div className="space-y-3">
              {landing.freeDelivery ? (
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-600 text-lg">🎉</span>
                    <span className="text-green-800 font-semibold">ডেলিভারি সম্পূর্ণ ফ্রি!</span>
                  </div>
                </div>
              ) : (
                <>
                  {landing.shippingAreas && Array.isArray(landing.shippingAreas) && landing.shippingAreas.map((shipping, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-all duration-300">
                      <input 
                        type="radio" 
                        name="delivery" 
                        value={index.toString()} 
                        checked={selectedDelivery === index.toString()}
                        onChange={(e) => setSelectedDelivery(e.target.value)}
                        className="text-blue-500 focus:ring-blue-300" 
                      />
                      <span className="text-gray-700 text-sm">
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
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/30 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          📋 অর্ডার সামারি
        </h3>
        
        {/* Variations Picker removed (selection is handled above) */}

        {/* Selected Product Display */}
        <div className="bg-green-100 rounded-lg p-4 border border-green-300 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {productImageSrc ? (
                <img
                  src={productImageSrc}
                  alt={landing.product.name}
                  className="w-16 h-16 object-contain rounded-lg bg-white p-2 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                  🎧
                </div>
              )}
              <div>
                <h5 className="text-gray-800 font-semibold">{landing.product.name}</h5>
                {(selectedColor || selectedSize) && (
                  <p className="text-sm text-gray-600">Variation: {selectedColor || '—'}{selectedSize ? ` / ${selectedSize}` : ''}</p>
                )}
                <p className="text-green-600 font-bold">৳{currentUnitPrice}</p>
              </div>
            </div>
            
            {/* Product Quantity Counter */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  const currentQuantity = parseInt(formData.quantity || '1');
                  if (currentQuantity > 1) {
                    setFormData(prev => ({ ...prev, quantity: (currentQuantity - 1).toString() }));
                  }
                }}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg"
              >
                -
              </button>
              
              <span className="text-2xl font-bold text-gray-800 min-w-[2rem] text-center">
                {formData.quantity || '1'}
              </span>
              
              <button
                type="button"
                onClick={() => {
                  const currentQuantity = parseInt(formData.quantity || '1');
                  setFormData(prev => ({ ...prev, quantity: (currentQuantity + 1).toString() }));
                }}
                className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-gray-700">
            <span>প্রোডাক্টের দাম ({quantity} পিস):</span>
            <span className="font-semibold">৳{currentUnitPrice * quantity}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>ডেলিভারি চার্জ:</span>
            <span className="font-semibold">
              {landing.freeDelivery ? (
                <span className="text-green-600">ফ্রি</span>
              ) : (
                <span>৳{deliveryCharge}</span>
              )}
            </span>
          </div>
          <hr className="border-gray-300" />
          <div className="flex justify-between text-lg font-bold text-green-600">
            <span>সর্বমোট:</span>
            <span>৳{totalPrice}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-green-100 rounded-lg p-4 border border-green-300 mb-6">
          <h4 className="text-lg font-bold text-green-800 mb-3 text-center">💳 পেমেন্ট মেথড</h4>
          {(() => {
            const pm = (landing as any)?.blocks?.paymentMethod || 'cash_on_delivery';
            const labelMap: Record<string, string> = {
              cash_on_delivery: 'ক্যাশ অন ডেলিভারি',
              mobile_banking: 'মোবাইল ব্যাংকিং (বিকাশ/নগদ)',
              bank_transfer: 'ব্যাংক ট্রান্সফার',
              online_payment: 'অনলাইন পেমেন্ট'
            };
            const subtitleMap: Record<string, string> = {
              cash_on_delivery: 'প্রোডাক্ট হাতে পেয়ে টাকা দিবেন - ১০০% নিরাপদ',
              mobile_banking: 'অর্ডার কনফার্মের পর বিকাশ/নগদ নম্বরে পেমেন্ট করুন',
              bank_transfer: 'অর্ডার কনফার্মের পর ব্যাংকে ট্রান্সফার করুন',
              online_payment: 'নিরাপদ অনলাইন পেমেন্ট গেটওয়ে'
            };
            return (
              <>
                <div className="flex items-center justify-center space-x-3 bg-white rounded-lg p-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">💵</span>
                  </div>
                  <span className="text-gray-800 font-semibold text-lg">{labelMap[pm] || labelMap.cash_on_delivery}</span>
                </div>
                <p className="text-green-700 text-sm text-center mt-2">{subtitleMap[pm] || subtitleMap.cash_on_delivery}</p>
              </>
            );
          })()}
        </div>

        {/* Submit Button - placed under payment method in summary (right column) */}
        <button
          form="checkoutForm"
          type="submit"
          disabled={isSubmitting}
          onMouseDown={() => setIsButtonTouched(true)}
          onTouchStart={() => setIsButtonTouched(true)}
          onFocus={() => setIsButtonTouched(true)}
          className={`submit-button w-full font-bold py-4 px-6 rounded-xl text-xl shadow-2xl transition-all duration-300 border-2 transform hover:scale-105 focus:scale-105 active:scale-95 ${
            isSubmitting
              ? 'bg-gray-500 cursor-not-allowed'
              : isButtonTouched
                ? 'green'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-green-500 hover:to-green-600 focus:from-green-500 focus:to-green-600 active:from-green-600 active:to-green-700 text-black hover:text-white focus:text-white active:text-white border-yellow-300/50 hover:border-green-300/50 focus:border-green-300/50 active:border-green-400/50'
          }`}
        >
          {isSubmitting ? '⏳ জমা হচ্ছে...' : '🎯 অর্ডার কনফার্ম করুন'}
        </button>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ ও গোপনীয়
          </p>
        </div>
      </div>
    </div>
  );
}

        {/* CSS Animations for Scrolling Effects */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            @keyframes slideInFromLeft {
              from {
                opacity: 0;
                transform: translateX(-30px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            @keyframes slideInFromRight {
              from {
                opacity: 0;
                transform: translateX(30px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            .input-group {
              animation: slideInFromLeft 0.6s ease-out both;
            }
            
            .input-group:nth-child(2) {
              animation-delay: 0.1s;
            }
            
            .input-group:nth-child(3) {
              animation-delay: 0.2s;
            }
            
            .input-group:nth-child(4) {
              animation-delay: 0.3s;
            }
            
            .icon-circle {
              animation: float 3s ease-in-out infinite;
            }
            
            .icon-circle:hover {
              animation: pulse 0.6s ease-in-out;
            }
            
            .input-field {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .input-field:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .input-field:focus {
              transform: translateY(-3px);
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
            }
            
            .submit-button {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
            }
            
            .submit-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s;
            }
            
            .submit-button:hover::before {
              left: 100%;
            }
            
            .submit-button:active {
              transform: scale(0.95);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .submit-button:focus {
              outline: none;
              box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.5);
            }
            
            .submit-button.green {
              background: linear-gradient(135deg, #10b981, #059669) !important;
              color: white !important;
              border-color: #10b981 !important;
            }
            
            .submit-button.green:hover {
              background: linear-gradient(135deg, #059669, #047857) !important;
              transform: translateY(-2px);
              box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
            }
          `
        }} />
