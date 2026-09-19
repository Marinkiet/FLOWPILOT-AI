/**
 * Demo shop state — uses React Context and localStorage.
 * Intentionally simple, no external state library.
 */

import { createContext, useContext } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShopState {
  cart: CartItem[];
  user: { email: string; name: string } | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  login: (email: string, _password: string) => boolean;
  logout: () => void;
}

export const ShopContext = createContext<ShopState | null>(null);

export function useShop(): ShopState {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'ProBook Laptop 15"',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    category: 'Laptops',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD.',
    rating: 4.5,
    inStock: true,
  },
  {
    id: 'p2',
    name: 'UltraSlim Laptop 13"',
    price: 999,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    category: 'Laptops',
    description: 'Ultra-portable laptop, perfect for on-the-go professionals.',
    rating: 4.2,
    inStock: true,
  },
  {
    id: 'p3',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 349,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Audio',
    description: 'Premium noise-cancelling headphones with 30hr battery life.',
    rating: 4.8,
    inStock: true,
  },
  {
    id: 'p4',
    name: 'Mechanical Keyboard Pro',
    price: 189,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
    category: 'Accessories',
    description: 'Tactile mechanical keyboard with RGB backlighting.',
    rating: 4.6,
    inStock: false, // BUG: Out-of-stock but no clear label shown in cart
  },
  {
    id: 'p5',
    name: '4K Ultra HD Monitor 27"',
    price: 599,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    category: 'Monitors',
    description: 'Crystal-clear 4K display with HDR support and 144Hz refresh.',
    rating: 4.7,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Ergonomic Mouse',
    price: 79,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    category: 'Accessories',
    description: 'Ergonomic wireless mouse designed to reduce wrist strain.',
    rating: 4.3,
    inStock: true,
  },
];
