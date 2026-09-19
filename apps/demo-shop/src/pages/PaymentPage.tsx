import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../store.ts';

export function PaymentPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useShop();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [submitCount, setSubmitCount] = useState(0);

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitCount((c) => c + 1);

    // BUG: Button not disabled after first submit — duplicate submission risk
    setProcessing(true);
    setError('');

    try {
      // Simulate payment gateway call
      // BUG: 40% of the time the payment "times out" — silently
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.4) {
            // Simulated timeout
            reject(new Error('Payment gateway timeout. Please try again.'));
          } else {
            resolve();
          }
        }, 3000); // BUG: 3 second delay with no loading indicator beyond the disabled state
      });

      clearCart();
      // BUG: navigate takes user to confirmation but no order ID is passed
      navigate('/order-confirmation');
    } catch (err) {
      setProcessing(false);
      // BUG: Error message is shown but the form is NOT reset — user can't tell if their card was charged
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      console.error('Payment error:', err); // This will show in browser console
    }
  }

  if (cart.length === 0) {
    // BUG: This state is reached after clearCart() succeeds,
    // but the confirmation redirect should have fired. If it didn't,
    // user sees "cart empty" on the payment page — very confusing.
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Nothing to pay for. Your cart is empty.</p>
        {/* BUG: No link back, no explanation */}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment</h1>

      {submitCount > 1 && (
        // BUG: Warning only appears after second click, not before
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm mb-4">
          Warning: You have submitted this form multiple times. Please check your bank statement.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="card-number"
          />
          {/* BUG: No Luhn check or format validation */}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              data-testid="card-expiry"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <input
              type="password"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="•••"
              maxLength={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              data-testid="card-cvv"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" role="alert">
            {error}
            {/* BUG: No retry guidance or alternative payment method */}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-gray-500 text-sm mb-3">
            Total: <span className="font-bold text-gray-800">${total.toFixed(2)}</span>
          </p>
          <button
            type="submit"
            // BUG: not disabled after first submit — allows duplicate payment
            className={`w-full py-3 rounded-lg font-semibold text-white ${
              processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            data-testid="pay-btn"
          >
            {/* BUG: text doesn't change to "Processing..." during payment */}
            Pay ${total.toFixed(2)}
          </button>
        </div>
      </form>
    </div>
  );
}
