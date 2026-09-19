import { Link } from 'react-router-dom';
import { useShop } from '../store.ts';

export function OrderHistoryPage() {
  const { user } = useShop();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Sign in to view your orders</h2>
        <Link to="/login" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

      {/* BUG: Always shows empty state even right after placing an order.
          Orders are not persisted — they disappear after navigation. */}
      <div className="text-center py-16 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="font-medium text-gray-600">No orders yet</p>
        <p className="text-sm mt-1">Orders you place will appear here.</p>
        {/* BUG: User just placed an order and now sees this — extremely confusing */}
        <Link to="/products" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
