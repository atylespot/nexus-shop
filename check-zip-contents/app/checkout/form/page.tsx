"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../contexts/CartContext';
import SharedHeader from '../../../components/SharedHeader';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { useFacebookPixelTracking } from '../../hooks/useFacebookPixelTracking';
import './globals.css';
import { useJourneyLogger } from '@/lib/journeyClient';


function CheckoutFormPageContent() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  
  // Facebook Pixel Tracking Hook
  const { trackInitiateCheckout, trackPurchase } = useFacebookPixelTracking('Checkout');
  const icFiredRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    area: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const journey = useJourneyLogger({ source: 'website', pageType: 'checkout' });
  const [copied, setCopied] = useState<string | null>(null);
  
  // Admin settings states
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  // Customer Info settings (retention/offer)
  const [ciSettings, setCiSettings] = useState<any>(null);
  const [offerVisible, setOfferVisible] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('nexus-shop-cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalCartItems(parsed);

          } else {
            setLocalCartItems([]);
          }
        } else {
          setLocalCartItems([]);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setLocalCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Load admin settings
  useEffect(() => {
    const loadAdminSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          console.log('Admin settings loaded:', data);
          
          // Set shipping settings
          if (data.shipping) {
            setShippingSettings(data.shipping);
            
            // Calculate shipping cost based on settings
            const totalAmount = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            if (data.shipping.freeDelivery?.enabled) {
              if (data.shipping.freeDelivery.threshold === 0 || totalAmount >= data.shipping.freeDelivery.threshold) {
                setShippingCost(0);
              } else {
                setShippingCost(data.shipping.defaultShippingCost || 0);
              }
            } else {
              setShippingCost(data.shipping.defaultShippingCost || 0);
            }
          }
          
          // Set payment settings
          if (data.payment) {
            setPaymentSettings(data.payment);
            
            // Auto-select default payment method (respects master mobile banking toggle if present)
            const mb = data.payment.mobileBanking || {};
            const mbEnabled = typeof mb.enabled === 'boolean' ? mb.enabled : true;
            const hasBkash = mbEnabled && (mb.bkash || data.payment.mobileBankingDetails?.bkash?.enabled);
            const hasNagad = mbEnabled && (mb.nagad || data.payment.mobileBankingDetails?.nagad?.enabled);
            const hasRocket = mbEnabled && (mb.rocket || data.payment.mobileBankingDetails?.rocket?.enabled);
            const hasSSL = data.payment.online?.ssl?.enabled;

            if (data.payment.cod?.enabled) {
              setPaymentMethod('cash_on_delivery');
            } else if (hasSSL) {
              setPaymentMethod('online_payment');
            } else if (hasBkash) {
              setPaymentMethod('bkash');
            } else if (hasNagad) {
              setPaymentMethod('nagad');
            } else if (hasRocket) {
              setPaymentMethod('rocket');
            } else if (data.payment.bankTransfer?.enabled) {
              setPaymentMethod('bank_transfer');
            }
          }
        } else {
          console.error('Failed to load admin settings');
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
      }
    };

    if (localCartItems.length > 0) {
      loadAdminSettings();
    }
  }, [localCartItems]);

  // Helpers for Mobile Banking UI
  const isMobileBankingMasterEnabled = () => {
    const mb = paymentSettings?.mobileBanking;
    return typeof mb?.enabled === 'boolean' ? mb.enabled : true;
  };

  const isProviderEnabled = (provider: 'bkash' | 'nagad' | 'rocket') => {
    if (!isMobileBankingMasterEnabled()) return false;
    const mb: any = paymentSettings?.mobileBanking;
    const details: any = paymentSettings?.mobileBankingDetails?.[provider];
    return Boolean(mb?.[provider] || details?.enabled);
  };

  const getProviderDetails = (provider: 'bkash' | 'nagad' | 'rocket') => {
    const details: any = paymentSettings?.mobileBankingDetails?.[provider] || {};
    const number = details.number || paymentSettings?.mobileBanking?.numbers || '';
    const qrUrl = details.qrUrl || (number ? `/api/qr?provider=${provider}&number=${encodeURIComponent(number)}` : '');
    const instructions = details.instructions || '';
    const accountName = details.accountName || '';
    const accountType = details.accountType || '';
    return { number, qrUrl, instructions, accountName, accountType };
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  // Load Checkout Offer settings for website scope and schedule modal (per product if available)
  useEffect(() => {
    let timer: any;
    (async () => {
      try {
        const first = (localCartItems && localCartItems.length > 0) ? localCartItems[0] : null;
        const qs = new URLSearchParams();
        qs.set('scope', 'website');
        if (first?.id) qs.set('productId', String(first.id));
        const res = await fetch(`/api/customer-info/offer?${qs.toString()}`);
        if (res.ok) {
          const list = await res.json();
          const o = Array.isArray(list) ? list.find((x: any) => x.enabled) : null;
          if (o) {
            setCiSettings(o);
            const delayMs = Math.max(0, Math.min(3600, Number(o.delaySeconds ?? 10))) * 1000;
            timer = setTimeout(() => setOfferVisible(true), delayMs);
          }
        }
      } catch {}
    })();
    return () => { if (timer) clearTimeout(timer); };
  }, [localCartItems]);

  // Track InitiateCheckout when cart loads
  useEffect(() => {
    // Guard against double-invocation (StrictMode) and state re-runs
    if (icFiredRef.current) return;
    if (localCartItems.length > 0 && !isLoading) {
      const totalValue = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const contentIds = localCartItems.map(item => item.id);
      
      trackInitiateCheckout({
        content_name: 'Checkout',
        content_category: 'checkout',
        content_ids: contentIds,
        content_type: 'checkout',
        value: totalValue,
        currency: 'BDT',
        num_items: localCartItems.reduce((total, item) => total + item.quantity, 0)
      });
      icFiredRef.current = true;
    }
  }, [localCartItems, isLoading, trackInitiateCheckout]);

  // Auto log on mount and whenever cart finishes loading, even if user doesn't type
  useEffect(() => {
    if (isLoading) return;
    const first = (localCartItems && localCartItems.length > 0) ? localCartItems[0] : null;
    journey.logCheckoutForm({
      customerName: formData.fullName || undefined,
      fullName: formData.fullName || undefined,
      phone: formData.phone || undefined,
      email: `bd_user_${Date.now()}@temp.local`, // Auto-generated email for tracking
      address: formData.address || undefined,
      district: formData.area || undefined,
      productName: first?.name || undefined,
      productImage: first?.image || undefined
    }, 0);
  }, [isLoading, localCartItems, formData]);

  // Calculate shipping cost when area changes
  useEffect(() => {
    if (formData.area && shippingSettings?.zones) {
      const selectedZone = shippingSettings.zones.find((zone: any) => zone.name === formData.area);
      
      if (selectedZone) {
        // Use zone-specific shipping cost
        const zoneShippingCost = selectedZone.shippingCost || selectedZone.cost || 0;
        
        // Check if free delivery applies
        const totalAmount = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        if (shippingSettings.freeDelivery?.enabled) {
          if (shippingSettings.freeDelivery.threshold === 0 || totalAmount >= shippingSettings.freeDelivery.threshold) {
            setShippingCost(0);
          } else {
            setShippingCost(zoneShippingCost);
          }
        } else {
          setShippingCost(zoneShippingCost);
        }
      } else {
        // Use default shipping cost if area not found in zones
        const totalAmount = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        if (shippingSettings.freeDelivery?.enabled) {
          if (shippingSettings.freeDelivery.threshold === 0 || totalAmount >= shippingSettings.freeDelivery.threshold) {
            setShippingCost(0);
          } else {
            setShippingCost(shippingSettings.defaultShippingCost || 0);
          }
        } else {
          setShippingCost(shippingSettings.defaultShippingCost || 0);
        }
      }
    }
  }, [formData.area, shippingSettings, localCartItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Log partial fields when filled
    if (['fullName','phone','address','area'].includes(name)) {
      const first = (localCartItems && localCartItems.length > 0) ? localCartItems[0] : null;
      journey.logCheckoutFilled({
        customerName: name === 'fullName' ? value : formData.fullName,
        fullName: name === 'fullName' ? value : formData.fullName,
        phone: name === 'phone' ? value : formData.phone,
        email: `bd_user_${Date.now()}@temp.local`, // Auto-generated email for tracking
        address: name === 'address' ? value : formData.address,
        district: name === 'area' ? value : formData.area,
        productName: first?.name || undefined,
        productImage: first?.image || undefined
      }, name === 'phone' ? 0 : 200);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address || !formData.area) {
      setError('সব ফিল্ড পূরণ করুন');
      return;
    }

    // Email validation removed - using auto-generated email for pixel tracking

    if (!paymentMethod) {
      setError('পেমেন্ট পদ্ধতি নির্বাচন করুন');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const subtotal = localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const total = subtotal + shippingCost;

      const orderData = {
        orderType: 'website', // Specify this is a website order
        customerName: formData.fullName,
        phone: formData.phone,
        email: `bd_user_${Date.now()}@temp.local`, // Auto-generated email for pixel tracking
        address: formData.address,
        district: formData.area, // API expects 'district' but we're sending 'area'
        items: localCartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingMethod: paymentMethod,
        shippingCost: shippingCost,
        subtotal: subtotal,
        total: total,
        currency: localCartItems[0]?.currency || 'USD'
      };

      console.log('📤 Sending order data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Order created successfully:', result);
        
        setOrderDetails(result);
        // Persist PII for Advanced Matching (BD market: phone + auto-generated email)
        try {
          if (formData.phone) localStorage.setItem('pixel_phone', formData.phone);
          // Always save auto-generated email for pixel tracking
          const emailToSave = `bd_user_${Date.now()}@temp.local`;
          localStorage.setItem('pixel_email', emailToSave);
          if (formData.area) localStorage.setItem('pixel_city', formData.area);
          localStorage.setItem('pixel_country', 'BD');
          // Also save full name for potential future use
          if (formData.fullName) localStorage.setItem('pixel_name', formData.fullName);
        } catch {}
        // If online payment chosen, initiate SSLCommerz session
        if (paymentMethod === 'online_payment') {
          const initRes = await fetch('/api/payment/ssl/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: result.orderId })
          });
          if (initRes.ok) {
            const initData = await initRes.json();
            if (initData?.url) {
              window.location.href = initData.url;
              return;
            }
          }
          setError('অনলাইন পেমেন্ট শুরু করা যায়নি। অন্য পদ্ধতি দিয়ে চেষ্টা করুন।');
          return;
        }

        // COD/MB/Bank: normal flow
        setOrderConfirmed(true);
        clearCart();
        localStorage.removeItem('nexus-shop-cart');

        const itemsParam = encodeURIComponent(JSON.stringify(localCartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))));
        const thankYouUrl = `/thank-you?orderId=${result.orderId}&orderNo=${result.orderNo}&customerName=${encodeURIComponent(formData.fullName)}&phone=${encodeURIComponent(formData.phone)}&email=${encodeURIComponent(`bd_user_${Date.now()}@temp.local`)}&address=${encodeURIComponent(formData.address)}&city=${encodeURIComponent(formData.area)}&country=BD&total=${result.order?.total || total}&currency=${localCartItems[0]?.currency || 'BDT'}&items=${itemsParam}`;
        router.push(thankYouUrl);
        

      } else {
        const errorData = await response.json();
        console.error('❌ Order creation failed:', errorData);
        setError(errorData.error || 'অর্ডার তৈরি করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Remove this old thank you page - redirect to new one instead
  if (false && orderConfirmed && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <SharedHeader />
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Success Animation */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <div className="text-6xl">🎉</div>
              </div>
              {/* Floating particles */}
              <div className="absolute top-0 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="absolute top-4 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-8 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Success Message */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                অর্ডার সফল হয়েছে!
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">অর্ডার বিবরণ</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">অর্ডার নম্বর:</span>
                      <span className="font-bold text-blue-600">{orderDetails.orderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">মোট মূল্য:</span>
                      <span className="font-bold text-green-600">
                        ${orderDetails.total || orderDetails.subtotal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">অর্ডার স্ট্যাটাস:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        প্রসেসিং
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">গ্রাহক তথ্য</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">নাম:</span>
                      <span className="font-medium text-gray-800">{orderDetails.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ফোন:</span>
                      <span className="font-medium text-gray-800">{orderDetails.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ঠিকানা:</span>
                      <span className="font-medium text-gray-800 max-w-xs truncate">
                        {orderDetails.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/" 
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                🛍️ আবার কেনাকাটা করুন
              </Link>
              
              <Link 
                href="/products" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                📦 আরও প্রোডাক্ট দেখুন
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">📞 যোগাযোগ করুন</h4>
              <p className="text-blue-700 mb-2">
                আপনার অর্ডার সম্পর্কে কোন প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <span className="text-blue-600">📧 support@nexusshop.com</span>
                <span className="text-blue-600">📱 +880 1234-567890</span>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (localCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">কার্ট খালি</h1>
            <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              কেনাকাটা চালিয়ে যান
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SharedHeader />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <span className="text-2xl">🛒</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            চেকআউট সম্পূর্ণ করুন
          </h1>
          <p className="text-gray-600">আপনার অর্ডার সম্পূর্ণ করতে নিচের তথ্যগুলো পূরণ করুন</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg text-red-800 shadow-md">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <span className="text-lg">👤</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">গ্রাহকের তথ্য</h2>
              </div>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    নাম *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gradient-to-r from-blue-50 to-purple-50"
                    placeholder="আপনার পূর্ণ নাম দিন"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">📱</span>
                    ফোন নম্বর *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-gradient-to-r from-green-50 to-blue-50"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                {/* Hidden email field for Facebook Pixel tracking - Bangladesh market friendly */}
                <input
                  type="hidden"
                  name="email"
                  value={formData.email || `bd_user_${Date.now()}@temp.local`}
                />

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">🏠</span>
                    ঠিকানা *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="আপনার সম্পূর্ণ ঠিকানা দিন"
                  />
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">📍</span>
                    এরিয়া *
                  </label>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-gradient-to-r from-orange-50 to-yellow-50"
                  >
                    <option value="">এরিয়া নির্বাচন করুন</option>
                    {shippingSettings?.zones?.map((zone: any, index: number) => (
                      <option key={index} value={zone.name}>
                        {zone.name}
                      </option>
                    ))}
                    {/* Default areas if no zones configured */}
                    {(!shippingSettings?.zones || shippingSettings.zones.length === 0) && (
                      <>
                        <option value="Dhaka City">ঢাকা সিটি</option>
                        <option value="Outside Dhaka">ঢাকার বাইরে</option>
                        <option value="Chittagong Area">চট্টগ্রাম এরিয়া</option>
                        <option value="Other Areas">অন্যান্য এরিয়া</option>
                      </>
                    )}
                  </select>
                  
                  {/* Show shipping details for selected area */}
                  {formData.area && shippingSettings?.zones && (
                    (() => {
                      const selectedZone = shippingSettings.zones.find((zone: any) => zone.name === formData.area);
                      if (selectedZone) {
                        return (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-800 font-medium">শিপিং চার্জ:</span>
                              <span className="text-blue-700 font-bold">
                                {shippingCost === 0 ? 'ফ্রি' : `$${selectedZone.shippingCost || selectedZone.cost || 0}`}
                              </span>
                            </div>
                            {selectedZone.deliveryTime && (
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-blue-800 font-medium">ডেলিভারি টাইম:</span>
                                <span className="text-blue-700">{selectedZone.deliveryTime}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center">
                    <span className="mr-2">💳</span>
                    পেমেন্ট পদ্ধতি *
                  </label>
                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    {paymentSettings?.cod?.enabled && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'cash_on_delivery' 
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={paymentMethod === 'cash_on_delivery'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-green-500"
                        />
                        <span className="mr-2">💵</span>
                        <span className="font-medium">ক্যাশ অন ডেলিভারি</span>
                      </label>
                    )}
                    
                    {/* bKash */}
                    {isProviderEnabled('bkash') && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'bkash' 
                          ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-red-50 shadow-md' 
                          : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          checked={paymentMethod === 'bkash'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-pink-500"
                        />
                        <span className="mr-2">📱</span>
                        <span className="font-medium text-pink-600">bKash</span>
                      </label>
                    )}
                    
                    {/* Nagad */}
                    {isProviderEnabled('nagad') && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'nagad' 
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md' 
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="nagad"
                          checked={paymentMethod === 'nagad'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-orange-500"
                        />
                        <span className="mr-2">💰</span>
                        <span className="font-medium text-orange-600">Nagad</span>
                      </label>
                    )}
                    
                    {/* Rocket */}
                    {isProviderEnabled('rocket') && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'rocket' 
                          ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="rocket"
                          checked={paymentMethod === 'rocket'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-purple-500"
                        />
                        <span className="mr-2">🚀</span>
                        <span className="font-medium text-purple-600">Rocket</span>
                      </label>
                    )}
                    
                    {/* Bank Transfer */}
                    {paymentSettings?.bankTransfer?.enabled && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'bank_transfer' 
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-blue-500"
                        />
                        <span className="mr-2">🏦</span>
                        <span className="font-medium text-blue-600">ব্যাংক ট্রান্সফার</span>
                      </label>
                    )}

                    {/* Online Payment (SSLCommerz) */}
                    {paymentSettings?.online?.ssl?.enabled && (
                      <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'online_payment' 
                          ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-green-50 shadow-md' 
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online_payment"
                          checked={paymentMethod === 'online_payment'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 text-teal-500"
                        />
                        <span className="mr-2">🌐</span>
                        <span className="font-medium text-teal-700">Online Payment (SSLCommerz)</span>
                      </label>
                    )}
                  </div>
                  
                  {/* Show payment details if available */}
                  {paymentMethod === 'bank_transfer' && paymentSettings?.bankTransfer?.accountDetails && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">ব্যাংক অ্যাকাউন্ট বিবরণ:</p>
                      <p className="text-sm text-blue-700 mt-1">{paymentSettings.bankTransfer.accountDetails}</p>
                    </div>
                  )}
                  
                  {['bkash','nagad','rocket'].includes(paymentMethod) && (
                    (() => {
                      const prov = paymentMethod as 'bkash' | 'nagad' | 'rocket';
                      if (!isProviderEnabled(prov)) return null;
                      const { number, qrUrl, instructions, accountName, accountType } = getProviderDetails(prov);
                      const titleMap: Record<'bkash'|'nagad'|'rocket', string> = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' };
                      const colorWrap: Record<'bkash'|'nagad'|'rocket', string> = {
                        bkash: 'from-pink-50 to-red-50 border-pink-200',
                        nagad: 'from-orange-50 to-yellow-50 border-orange-200',
                        rocket: 'from-purple-50 to-blue-50 border-purple-200'
                      };
                      const flow = (accountType || 'Personal').toLowerCase() === 'merchant' ? 'Payment' : 'Send Money';
                      const steps = (instructions || '').trim()
                        ? (instructions as string).split(/\r?\n/).filter(Boolean)
                        : [
                            `${titleMap[prov]} অ্যাপ/USSD চালু করুন।`,
                            `${flow} অপশন সিলেক্ট করুন।`,
                            `নাম্বার দিন: ${number || 'আপনার কনফিগার করা নাম্বার'}.`,
                            'অ্যামাউন্ট দিন এবং রেফারেন্সে Order No লিখুন।',
                            'PIN দিয়ে কনফার্ম করুন।'
                          ];
                      return (
                        <div className={`mt-4 p-4 rounded-xl border-2 bg-gradient-to-r ${colorWrap[prov]}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">ℹ️</span>
                              <p className="text-base font-semibold text-gray-800">{titleMap[prov]} পেমেন্ট নির্দেশনা</p>
                            </div>
                          </div>

                          {number && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 font-medium">নাম্বার</span>
                              <span className="font-semibold text-gray-900">{number}</span>
                              <button type="button" onClick={() => copyText(number, 'number')} className="ml-2 px-2 py-1 text-xs rounded border hover:bg-gray-50">{copied === 'number' ? 'Copied' : 'Copy'}</button>
                            </div>
                          )}

                          {(accountName || accountType) && (
                            <div className="mt-2 text-xs text-gray-700">
                              {accountName && <span className="mr-3">Account: <span className="font-medium">{accountName}</span></span>}
                              {accountType && <span>Type: <span className="font-medium">{accountType}</span></span>}
                            </div>
                          )}

                          {qrUrl && (
                            <div className="mt-4 flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={qrUrl} alt={`${titleMap[prov]} QR`} className="w-28 h-28 rounded-lg border" />
                              <div className="text-xs text-gray-600">QR স্ক্যান করে দ্রুত পেমেন্ট করুন</div>
                            </div>
                          )}

                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-800 mb-2">কিভাবে পেমেন্ট করবেন:</p>
                            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                              {steps.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      প্রক্রিয়াকরণ হচ্ছে...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🎉</span>
                      অর্ডার সম্পূর্ণ করুন
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-24 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <span className="text-lg">📋</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">অর্ডার সারসংক্ষেপ</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                {localCartItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border-2 border-gray-100 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden shadow-md">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl">📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-1">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-100 pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <span className="flex items-center text-gray-700 font-medium">
                      <span className="mr-2">🧮</span>
                      সাবটোটাল
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0), localCartItems[0]?.currency || 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <span className="flex items-center text-gray-700 font-medium">
                      <span className="mr-2">🚚</span>
                      শিপিং
                    </span>
                    <span className={`font-bold ${shippingCost === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {shippingCost === 0 ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">ফ্রি</span>
                      ) : (
                        formatPrice(shippingCost, localCartItems[0]?.currency || 'USD')
                      )}
                    </span>
                  </div>
                  <div className="border-t-2 border-purple-200 pt-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-md">
                      <span className="flex items-center text-xl font-bold text-gray-800">
                        <span className="mr-2">💰</span>
                        মোট
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        {formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0) + shippingCost, localCartItems[0]?.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Checkout offer modal */}
      {offerVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-md p-6 border">
            {ciSettings?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ciSettings.imageUrl} alt="Offer" className="w-full h-40 object-cover rounded mb-3" />
            )}
            <div className="text-2xl font-bold mb-2">{ciSettings?.title || 'Special Offer'}</div>
            <div className="text-gray-700 mb-4">{ciSettings?.message || 'Complete your order now and enjoy our special offer!'}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOfferVisible(false)} className="px-4 py-2 rounded border">Close</button>
              <button onClick={() => setOfferVisible(false)} className="px-4 py-2 rounded bg-green-600 text-white">{ciSettings?.ctaText || 'Apply Offer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutFormPage() {
  return (
    <ErrorBoundary>
      <CheckoutFormPageContent />
    </ErrorBoundary>
  );
}
