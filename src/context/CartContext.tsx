import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- Types ---
export interface Product {
  id: number | string;
  category: string;
  name: string;
  price: number | { min: number; max: number };
  image: string;
  description: string;
}

// A CartItem's price is always a number, as we resolve the range upon adding to cart.
export type CartItem = Omit<Product, 'price'> & {
  price: number;
  quantity: number;
};


interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number | string) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; discount: number; total: number };
  getCartItemCount: () => number;
  applyCoupon: (code: string) => boolean;
  appliedCoupon: string;
}

// --- Context ---
const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Provider ---
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const localData = window.localStorage.getItem('cart');
      if (!localData) return [];

      const parsedData: (Product & { quantity: number })[] = JSON.parse(localData);

      const migratedData = parsedData.map(item => {
        const price = typeof item.price === 'number' ? item.price : item.price.min;
        return { ...item, price };
      });

      return migratedData;
    } catch (error) {
      console.error("Could not parse or migrate cart data from localStorage", error);
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Could not save cart data to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      const priceToAdd = typeof product.price === 'number' ? product.price : product.price.min;
      const newItem: CartItem = { ...product, price: priceToAdd, quantity: 1 };

      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (productId: number | string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon('');
    setDiscountPercent(0);
  };

  const applyCoupon = (code: string): boolean => {
    if (code.toLowerCase() === 'makü') {
      setAppliedCoupon(code);
      setDiscountPercent(0.5); // 50% discount
      return true;
    }
    // You could add logic for invalid coupons here
    setAppliedCoupon('');
    setDiscountPercent(0);
    return false;
  };

  const getCartTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const discount = subtotal * discountPercent;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        applyCoupon,
        appliedCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// --- Hook ---
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};