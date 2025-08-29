"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../contexts/CartContext';
import SharedHeader from '../../../components/SharedHeader';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import './globals.css';
import { trackEvent } from '@/lib/pixels';

function CheckoutFormPageContent() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
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
  
  // Admin settings states
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('nexus-shop-cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalCartItems(parsed);
            trackEvent('PageView', {
              event_source_url: window.location.href,
              content_type: 'page'
            });
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
            
            // Auto-select default payment method
            if (data.payment.cod?.enabled) {
              setPaymentMethod('cash_on_delivery');
            } else if (data.payment.mobileBanking?.bkash) {
              setPaymentMethod('bkash');
            } else if (data.payment.mobileBanking?.nagad) {
              setPaymentMethod('nagad');
            } else if (data.payment.mobileBanking?.rocket) {
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
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.address || !formData.area) {
      setError('সব ফিল্ড পূরণ করুন');
      return;
    }

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
        customerName: formData.fullName,
        phone: formData.phone,
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
        setOrderConfirmed(true);
        clearCart();
        localStorage.removeItem('nexus-shop-cart');
        
        // Track purchase event
        trackEvent('Purchase', {
          value: result.total || total,
          currency: result.currency || 'USD',
          num_items: localCartItems.length,
          content_type: 'product',
          content_ids: localCartItems.map(item => item.id),
          contents: localCartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          event_source_url: window.location.href
        });
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

  if (orderConfirmed && orderDetails) {
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
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">চেকআউট সম্পূর্ণ করুন</h1>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">গ্রাহকের তথ্য</h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="আপনার পূর্ণ নাম দিন"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="আপনার সম্পূর্ণ ঠিকানা দিন"
                  />
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">এরিয়া *</label>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">পেমেন্ট পদ্ধতি *</label>
                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    {paymentSettings?.cod?.enabled && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={paymentMethod === 'cash_on_delivery'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>ক্যাশ অন ডেলিভারি</span>
                      </label>
                    )}
                    
                    {/* bKash */}
                    {paymentSettings?.mobileBanking?.bkash && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          checked={paymentMethod === 'bkash'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>bKash</span>
                      </label>
                    )}
                    
                    {/* Nagad */}
                    {paymentSettings?.mobileBanking?.nagad && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="nagad"
                          checked={paymentMethod === 'nagad'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>Nagad</span>
                      </label>
                    )}
                    
                    {/* Rocket */}
                    {paymentSettings?.mobileBanking?.rocket && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="rocket"
                          checked={paymentMethod === 'rocket'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>Rocket</span>
                      </label>
                    )}
                    
                    {/* Bank Transfer */}
                    {paymentSettings?.bankTransfer?.enabled && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span>ব্যাংক ট্রান্সফার</span>
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
                  
                  {paymentMethod && paymentSettings?.mobileBanking?.numbers && 
                   ['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">মোবাইল ব্যাংকিং নম্বর:</p>
                      <p className="text-sm text-green-700 mt-1">{paymentSettings.mobileBanking.numbers}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'অর্ডার সম্পূর্ণ করুন'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">অর্ডার সারসংক্ষেপ</h2>
              
              <div className="space-y-4 mb-6">
                {localCartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg text-gray-400">📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-red-600">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>সাবটোটাল</span>
                    <span>{formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0), localCartItems[0]?.currency || 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>শিপিং</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : 'text-gray-600'}>
                      {shippingCost === 0 ? 'ফ্রি' : formatPrice(shippingCost, localCartItems[0]?.currency || 'USD')}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>মোট</span>
                      <span>{formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0) + shippingCost, localCartItems[0]?.currency || 'USD')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
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
