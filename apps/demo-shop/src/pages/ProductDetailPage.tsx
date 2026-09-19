import { useParams, Link } from 'react-router-dom';
import { PRODUCTS, useShop } from '../store.ts';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = PRODUCTS.find((p) => p.id === id);
  const { addToCart } = useShop();

  if (!product) {
    return (
      // BUG: 404 page gives no navigation options — dead end
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
        {/* No back link or suggestion */}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb — BUG: back navigation uses browser back which breaks on direct URL */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:underline">Home</Link>
        {' / '}
        <Link to="/products" className="hover:underline">Products</Link>
        {' / '}
        <span>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-xl object-cover"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{product.category}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-400">★★★★★</span>
            <span className="text-sm text-gray-500">{product.rating} / 5</span>
          </div>

          <p className="text-3xl font-bold text-indigo-600 mt-4">${product.price}</p>

          <p className="text-gray-600 mt-4">{product.description}</p>

          {!product.inStock ? (
            <div className="mt-6">
              <p className="text-red-500 font-medium">Out of stock</p>
              {/* BUG: No "notify me" option or alternative suggestion */}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
                data-testid="add-to-cart"
              >
                Add to Cart
                {/* BUG: No visual feedback after clicking — cart count updates but button doesn't */}
              </button>

              <Link
                to="/cart"
                className="block text-center text-indigo-600 border border-indigo-600 py-3 rounded-lg hover:bg-indigo-50"
                data-testid="view-cart"
              >
                View Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
