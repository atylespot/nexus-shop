"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import SharedHeader from '../../components/SharedHeader';
import Footer from '@/components/Footer';
import { trackEvent } from '@/lib/pixels';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(true);
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(5);

  // Load cart directly from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        setError(null); // Clear any previous errors
        const savedCart = localStorage.getItem('nexus-shop-cart');
        console.log('Raw localStorage data:', savedCart);
        
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalCartItems(parsed);
            console.log('Cart loaded from localStorage:', parsed);
            
            // Track PageView event (server-side + client-side)
            trackEvent('PageView', {
              event_source_url: window.location.href,
              content_type: 'page'
            });
            
            // Also fire client-side event
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('track', 'PageView');
            }
          } else {
            console.log('Cart is empty or invalid');
            setLocalCartItems([]);
          }
        } else {
          console.log('No cart found in localStorage');
          setLocalCartItems([]);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setError('Failed to load cart data. Please refresh the page.');
        setLocalCartItems([]);
      }
    };

    // Load immediately
    loadCart();
    
    // Set loading to false after a short delay to ensure data is processed
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    // Listen for storage changes (in case cart is updated from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexus-shop-cart') {
        loadCart();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync localCartItems with cart context when cartItems change
  useEffect(() => {
    if (cartItems.length > 0) {
      setLocalCartItems(cartItems);
    }
  }, [cartItems]);

  // Handle countdown for empty cart redirect
  useEffect(() => {
    if (localCartItems.length === 0 && !isLoading) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [localCartItems.length, isLoading, router]);



  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  const handleCheckout = () => {
    console.log('handleCheckout function called');
    
    try {
      // Track InitiateCheckout event (server-side + client-side)
      try { 
        trackEvent('InitiateCheckout', { 
          value: localCartItems.reduce((t,i)=>t+(i.price*i.quantity),0), 
          currency: localCartItems[0]?.currency || 'BDT', 
          num_items: localCartItems.length, 
          content_type: 'product',
          content_ids: localCartItems.map(item => item.id),
          contents: localCartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price
          })),
          event_source_url: typeof window !== 'undefined' ? window.location.href : undefined
        }); 
        
        // Also fire client-side event
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            value: localCartItems.reduce((t,i)=>t+(i.price*i.quantity),0),
            currency: localCartItems[0]?.currency || 'BDT',
            content_ids: localCartItems.map(item => item.id)
          });
        }
      } catch {}
      // Use window.location for direct navigation
      window.location.href = '/checkout/form';
      console.log('Navigation initiated with window.location');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to router.push
      try {
        router.push('/checkout/form');
        console.log('Fallback navigation with router.push');
      } catch (routerError) {
        console.error('Router navigation also failed:', routerError);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedHeader />
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to your cart to continue shopping.</p>
            <div className="space-y-4">
              <Link
                href="/"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
              <div className="text-sm text-gray-500">
                <p>Redirecting to home page in <span id="countdown">{countdown}</span> seconds...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader />
      
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="mb-8">
           <h1 className="text-3xl font-bold text-gray-900">ইনিশিয়েট চেকআউট</h1>
           <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-1">Please try again or contact support if the problem persists.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {localCartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl text-gray-400">📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-lg font-bold text-red-600">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Total</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0), localCartItems[0]?.currency || 'BDT')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(localCartItems.reduce((total, item) => total + (item.price * item.quantity), 0), localCartItems[0]?.currency || 'BDT')}</span>
                  </div>
                </div>
              </div>
              
                                            <button
                 onClick={handleCheckout}
                 className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
               >
                 ইনিশিয়েট চেকআউট
               </button>
              
                             <div className="mt-4 text-center">
                 <Link
                   href="/"
                   className="text-blue-600 hover:text-blue-800 text-sm"
                 >
                   Continue Shopping
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
