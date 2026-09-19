import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../store.ts';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // BUG: error state exists but is only shown sometimes (see logic below)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useShop();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // BUG: Fake async delay with no visual loading indicator on the button
    await new Promise((r) => setTimeout(r, 1500));

    const success = login(email, password);
    setLoading(false);

    if (success) {
      // BUG: Redirects to /dashboard which doesn't exist — user sees 404
      navigate('/dashboard');
    } else {
      // BUG: Error only shown if password < 4 chars — unclear to user why login failed
      if (password.length < 4) {
        setError('Invalid credentials.');
      }
      // If email is empty, NO error message is shown — silent failure
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign in</h1>
        <p className="text-gray-500 text-sm mb-6">
          Welcome back to TechMart
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              data-testid="email-input"
            />
            {/* BUG: No required validation on email — form submits with empty email */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your password"
              data-testid="password-input"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-60"
            data-testid="login-submit"
          >
            {/* BUG: No "Loading..." text shown while submitting */}
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
