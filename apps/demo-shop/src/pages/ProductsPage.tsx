import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PRODUCTS } from '../store.ts';

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  // BUG: Category filter from URL params is read but never applied to the display
  const categoryParam = searchParams.get('category');

  const filtered = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );
  // BUG: categoryParam is ignored — category filter in URL does nothing
  void categoryParam;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Products</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="search-input"
        />
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {/* BUG: Empty state shows no suggestion to clear filter or browse */}
          <p>No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden product-card"
              data-testid={`product-${product.id}`}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  {!product.inStock && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                <p className="text-indigo-600 font-bold mt-2">${product.price}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-gray-500">{product.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
