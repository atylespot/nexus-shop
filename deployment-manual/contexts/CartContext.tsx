"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';



interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  addToCartAndRedirect: (product: any, redirectUrl: string) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  clearMessage: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nexus-shop-cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const validatedCart = validateCartData(parsed);
        setCartItems(validatedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    }
  }, []);

  // Cart is now synced via syncLocalStorage function

  // Sync localStorage with React state when localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexus-shop-cart' && e.newValue) {
        try {
          const newCart = JSON.parse(e.newValue);
          const validatedCart = validateCartData(newCart);
          setCartItems(validatedCart);
        } catch (error) {
          console.error('Error parsing cart from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to sync localStorage with current React state
  const syncLocalStorage = () => {
    try {
      localStorage.setItem('nexus-shop-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error syncing cart to localStorage:', error);
    }
  };

  // Function to validate cart data integrity
  const validateCartData = (cartData: any[]): CartItem[] => {
    if (!Array.isArray(cartData)) {
      console.warn('Cart data is not an array, resetting to empty cart');
      return [];
    }

    return cartData.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid cart item found:', item);
        return false;
      }

      // Check required fields
      if (!item.id || typeof item.id !== 'string') {
        console.warn('Cart item missing or invalid ID:', item);
        return false;
      }

      if (!item.name || typeof item.name !== 'string') {
        console.warn('Cart item missing or invalid name:', item);
        return false;
      }

      if (typeof item.price !== 'number' || item.price <= 0) {
        console.warn('Cart item missing or invalid price:', item);
        return false;
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 999) {
        console.warn('Cart item missing or invalid quantity:', item);
        return false;
      }

      // Check optional fields
      if (item.slug && typeof item.slug !== 'string') {
        console.warn('Cart item has invalid slug:', item);
        return false;
      }

      if (item.currency && typeof item.currency !== 'string') {
        console.warn('Cart item has invalid currency:', item);
        return false;
      }

      if (item.image && typeof item.image !== 'string') {
        console.warn('Cart item has invalid image:', item);
        return false;
      }

      return true;
    }).map(item => ({
      ...item,
      // Ensure default values for optional fields
      slug: item.slug || '',
      currency: item.currency || 'USD',
      image: item.image || ''
    }));
  };

  // Sync localStorage whenever cartItems change
  useEffect(() => {
    syncLocalStorage();
  }, [cartItems]);

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const addToCart = (product: any) => {
    if (isLoading) return; // Prevent multiple simultaneous operations
    
    // Validate product data
    if (!product || !product.id || !product.name || !product.price) {
      console.error('Invalid product data:', product);
      setMessage({ type: 'error', text: 'Invalid product data' });
      return;
    }

    setIsLoading(true);
    try {
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        
        if (existingItem) {
          // If item exists, increase quantity
          const updated = prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + (product.quantity || 1) }
              : item
          );
          setMessage({ type: 'success', text: `${product.name} quantity updated` });
          return updated;
        } else {
          // If item doesn't exist, add new item
          const newItem: CartItem = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            currency: product.currency || 'BDT',
            image: product.image || '',
            quantity: product.quantity || 1
          };
          setMessage({ type: 'success', text: `${product.name} added to cart` });
          return [...prevItems, newItem];
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCartAndRedirect = async (product: any, redirectUrl: string) => {
    if (isLoading) return; // Prevent multiple simultaneous operations
    
    // Validate product data
    if (!product || !product.id || !product.name || !product.regularPrice) {
      console.error('Invalid product data:', product);
      setMessage({ type: 'error', text: 'Invalid product data' });
      throw new Error('Invalid product data');
    }

    // Validate redirect URL
    if (!redirectUrl || typeof redirectUrl !== 'string') {
      console.error('Invalid redirect URL:', redirectUrl);
      setMessage({ type: 'error', text: 'Invalid redirect URL' });
      throw new Error('Invalid redirect URL');
    }

    setIsLoading(true);
    try {
      // Create cart item
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.salePrice || product.regularPrice,
        currency: product.currency || 'BDT',
        image: product.images?.[0] || '',
        quantity: 1
      };
      
      // Update React state first and wait for it
      await new Promise<void>((resolve) => {
        setCartItems(prevItems => {
          const existingItem = prevItems.find(item => item.id === product.id);
          
          if (existingItem) {
            const updated = prevItems.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            setMessage({ type: 'success', text: `${product.name} quantity updated, redirecting to checkout...` });
            resolve();
            return updated;
          } else {
            const updated = [...prevItems, newItem];
            setMessage({ type: 'success', text: `${product.name} added to cart, redirecting to checkout...` });
            resolve();
            return updated;
          }
        });
      });
      
      // Update localStorage
      const currentCart = localStorage.getItem('nexus-shop-cart');
      let updatedCart = [];
      
      if (currentCart) {
        try {
          updatedCart = JSON.parse(currentCart);
          const existingItem = updatedCart.find((item: CartItem) => item.id === product.id);
          
          if (existingItem) {
            updatedCart = updatedCart.map((item: CartItem) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            updatedCart.push(newItem);
          }
        } catch (error) {
          console.error('Error parsing existing cart:', error);
          updatedCart = [newItem];
        }
      } else {
        updatedCart = [newItem];
      }
      
      // Update localStorage
      try {
        localStorage.setItem('nexus-shop-cart', JSON.stringify(updatedCart));
      } catch (error) {
        console.error('Error updating localStorage:', error);
        setMessage({ type: 'error', text: 'Failed to save cart data' });
        throw new Error('Failed to save cart data');
      }
      
      // Navigate immediately after state and localStorage are updated
      router.push(redirectUrl);
    } catch (error) {
      console.error('Error in addToCartAndRedirect:', error);
      setMessage({ type: 'error', text: 'Failed to add product to cart' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = (productId: string) => {
    if (!productId) {
      console.error('Invalid product ID for removal');
      setMessage({ type: 'error', text: 'Invalid product ID' });
      return;
    }
    
    const itemToRemove = cartItems.find(item => item.id === productId);
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    
    if (itemToRemove) {
      setMessage({ type: 'success', text: `${itemToRemove.name} removed from cart` });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!productId) {
      console.error('Invalid product ID for quantity update');
      setMessage({ type: 'error', text: 'Invalid product ID' });
      return;
    }
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (quantity > 999) {
      console.warn('Quantity too high, limiting to 999');
      quantity = 999;
      setMessage({ type: 'error', text: 'Quantity limited to 999' });
    }
    
    const itemToUpdate = cartItems.find(item => item.id === productId);
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
    
    if (itemToUpdate) {
      setMessage({ type: 'success', text: `${itemToUpdate.name} quantity updated to ${quantity}` });
    }
  };

  const clearCart = () => {
    if (cartItems.length > 0) {
      setCartItems([]);
      setMessage({ type: 'success', text: 'Cart cleared successfully' });
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value: CartContextType = {
    cartItems,
    addToCart,
    addToCartAndRedirect,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isLoading,
    message,
    clearMessage: () => setMessage(null)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
