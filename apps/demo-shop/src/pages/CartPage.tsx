import { Link } from 'react-router-dom';
import { useShop } from '../store.ts';

export function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useShop();
  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

      <div className="space-y-4">
        {cart.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
            data-testid={`cart-item-${product.id}`}
          >
            <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />

            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              {/* BUG: Out-of-stock item p4 shows no warning here */}
              <p className="text-indigo-600 font-bold">${product.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(product.id)}
              className="text-red-400 hover:text-red-600 text-sm ml-4"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">Subtotal</p>
          <p className="text-2xl font-bold text-gray-800">${total.toFixed(2)}</p>
          {/* BUG: No tax, shipping cost, or total breakdown shown */}
        </div>
        <Link
          to="/checkout"
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700"
          data-testid="checkout-btn"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
