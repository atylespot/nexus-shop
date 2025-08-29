"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, getCurrentCurrency } from '@/lib/currency';
import { useScrollTracking } from '@/app/hooks/useScrollTracking';
import { useTimeTracking } from '@/app/hooks/useTimeTracking';
import { useEngagementTracking } from '@/app/hooks/useEngagementTracking';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [currentCurrency, setCurrentCurrency] = useState<string>('BDT');
  
  // Facebook Pixel Tracking Hooks
  useScrollTracking('Cart Page');
  useTimeTracking('Cart Page');
  useEngagementTracking('Cart Page');

  useEffect(() => {
    setCurrentCurrency(getCurrentCurrency());
  }, []);

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <SharedHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl">
              <span className="text-4xl">🛒</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Your Cart is Empty</h1>
            <p className="text-xl text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🛍️ Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SharedHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4 shadow-xl">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">Shopping Cart</h1>
          <p className="text-xl text-gray-600">{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {cartItems.map((item, index) => (
                <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b-2 border-gray-100' : ''} hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200`}>
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl text-gray-400">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <span className="mr-2">💵</span>
                        {formatPrice(item.price, currentCurrency)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                      >
                        <span className="text-lg font-bold text-gray-600">−</span>
                      </button>
                      <span className="text-xl font-bold w-12 text-center bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 rounded-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                      >
                        <span className="text-lg font-bold text-gray-600">+</span>
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        {formatPrice(item.price * item.quantity, currentCurrency)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-all duration-200 p-3 hover:bg-red-50 rounded-full"
                      title="Remove item"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => router.push('/products')}
                className="flex items-center text-blue-600 hover:text-blue-700 font-bold transition-all duration-200 hover:scale-105"
              >
                <span className="mr-2">🛍️</span>
                ← Continue Shopping
              </button>
              <button
                onClick={clearCart}
                className="flex items-center text-red-600 hover:text-red-700 font-bold transition-all duration-200 hover:scale-105"
              >
                <span className="mr-2">🗑️</span>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-4 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <span className="text-lg">📋</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Order Summary</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <span className="flex items-center text-gray-700 font-medium">
                    <span className="mr-2">🧮</span>
                    Subtotal ({cartCount} items)
                  </span>
                  <span className="font-bold text-blue-600">{formatPrice(cartTotal, currentCurrency)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <span className="flex items-center text-gray-700 font-medium">
                    <span className="mr-2">🚚</span>
                    Shipping
                  </span>
                  <span className="font-medium text-gray-600">Calculated at checkout</span>
                </div>
                <div className="border-t-2 border-purple-200 pt-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-md">
                    <span className="flex items-center text-xl font-bold text-gray-800">
                      <span className="mr-2">💰</span>
                      Total
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      {formatPrice(cartTotal, currentCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout/form"
                onClick={() => {
                  console.log('Proceeding to checkout form...');
                  console.log('Current URL:', window.location.href);
                  console.log('Target URL:', '/checkout/form');
                  

                }}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl block text-center"
              >
                🚀 Proceed to Checkout
              </Link>

              <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-blue-600 mr-2">🔒</span>
                  <p className="text-sm text-blue-700 font-medium">
                    Secure checkout with SSL encryption
                  </p>
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
