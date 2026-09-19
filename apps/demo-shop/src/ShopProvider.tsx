import { useState, type ReactNode } from 'react';
import { ShopContext, PRODUCTS, type CartItem, type Product } from './store.ts';

interface Props {
  children: ReactNode;
}

export function ShopProvider({ children }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  function addToCart(product: Product) {
    // BUG: No visual feedback to user that item was added
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Intentional bug: console.log instead of user-visible confirmation
    console.log('Item added to cart:', product.name);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  function login(email: string, password: string): boolean {
    // BUG: Accept any non-empty credentials — no real validation message on failure
    if (email && password.length >= 4) {
      setUser({ email, name: email.split('@')[0] ?? 'User' });
      return true;
    }
    // BUG: Returns false but shows no error to the user in some cases
    return false;
  }

  function logout() {
    setUser(null);
    clearCart();
  }

  return (
    <ShopContext.Provider
      value={{ cart, user, addToCart, removeFromCart, updateQuantity, clearCart, login, logout }}
    >
      {children}
    </ShopContext.Provider>
  );
}
