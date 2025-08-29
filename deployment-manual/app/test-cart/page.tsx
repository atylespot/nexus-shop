"use client";

import { useCart } from '../../contexts/CartContext';
import { useState } from 'react';

export default function TestCartPage() {
  const { addToCart, cartItems, cartCount } = useCart();
  const [testProduct] = useState({
    id: 'test-1',
    name: 'Test Product',
    slug: 'test-product',
    price: 99.99,
    currency: 'USD',
    image: 'https://via.placeholder.com/150',
    quantity: 1
  });

  const handleAddToCart = () => {
    console.log('Adding test product to cart:', testProduct);
    addToCart(testProduct);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart Test Page</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Product</h2>
          <div className="flex items-center space-x-4">
            <img src={testProduct.image} alt={testProduct.name} className="w-20 h-20 object-cover rounded" />
            <div>
              <h3 className="font-medium">{testProduct.name}</h3>
              <p className="text-gray-600">${testProduct.price}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add to Cart
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cart Status</h2>
          <p className="mb-2">Cart Count: <span className="font-bold text-blue-600">{cartCount}</span></p>
          <p className="mb-4">Cart Items: <span className="font-bold text-blue-600">{cartItems.length}</span></p>
          
          {cartItems.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-medium">Items in Cart:</h3>
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Price: ${item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No items in cart</p>
          )}
        </div>
      </div>
    </div>
  );
}

