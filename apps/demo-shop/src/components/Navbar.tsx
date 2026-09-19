import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../store.ts';

export function Navbar() {
  const { cart, user, logout } = useShop();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    // BUG: Nav has two "Home" links — confusing navigation duplication
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              TechMart
            </Link>
            {/* BUG: Duplicate home link — confusing */}
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/products" className="text-sm text-gray-600 hover:text-gray-900">Products</Link>
            {/* BUG: "Deals" link goes nowhere — dead end */}
            <span
              className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
              onClick={() => console.error('Deals page not implemented')}
            >
              Deals
            </span>
            {user && (
              <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">My Orders</Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative flex items-center gap-1 text-gray-600 hover:text-gray-900"
              data-testid="cart-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Hi, {user.name}</span>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                data-testid="login-btn"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
