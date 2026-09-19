import { Link } from 'react-router-dom';

export function OrderConfirmationPage() {
  // BUG: No order ID displayed — user cannot reference this order for support
  // BUG: No order summary — user doesn't know what they ordered
  // BUG: No email confirmation mention
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-green-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
      {/* BUG: "Order Placed" but no order number, no estimated delivery, no next steps */}
      <p className="text-gray-500 mb-8">
        Your order has been received. We'll be in touch.
        {/* BUG: Vague — no email address referenced, no timeline */}
      </p>

      <div className="space-y-3">
        {/* BUG: "Track Order" goes to /orders which shows no orders (state is cleared) */}
        <Link
          to="/orders"
          className="block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          data-testid="track-order-btn"
        >
          Track Your Order
        </Link>
        <Link to="/" className="block text-indigo-600 hover:underline text-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
