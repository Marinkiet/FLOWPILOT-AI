import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../store.ts';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, user } = useShop();
  const [form, setForm] = useState({
    fullName: user?.name ?? '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.fullName) newErrors['fullName'] = 'Required';
    if (!form.address) newErrors['address'] = 'Required';
    if (!form.city) newErrors['city'] = 'Required';
    // BUG: Zip validation missing — any string accepted
    if (!form.zip) newErrors['zip'] = 'Required';
    // BUG: Country not validated at all
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // BUG: No loading state — clicking multiple times submits multiple orders
    navigate('/payment');
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        {/* BUG: No link to go back to products */}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 text-lg">Shipping Information</h2>

        {(['fullName', 'address', 'city', 'zip', 'country'] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {field === 'fullName' ? 'Full Name' : field === 'zip' ? 'ZIP / Postal Code' : field}
            </label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors[field] ? 'border-red-400' : 'border-gray-300'
              }`}
              data-testid={`checkout-${field}`}
            />
            {errors[field] && (
              <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
            )}
          </div>
        ))}

        <div className="pt-4 border-t flex justify-between items-center">
          {/* BUG: Back button goes to /cart but doesn't preserve cart state on mobile */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-500 text-sm hover:underline"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700"
            data-testid="checkout-continue"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
}
