import { Link } from 'react-router-dom';
import { PRODUCTS } from '../store.ts';

export function HomePage() {
  const featured = PRODUCTS.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <div className="bg-indigo-700 text-white py-20 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to TechMart</h1>
        <p className="text-indigo-200 text-lg mb-8">
          Premium tech, delivered fast. Shop laptops, accessories, and more.
        </p>
        <Link
          to="/products"
          className="bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50"
          data-testid="shop-now-btn"
        >
          Shop Now
        </Link>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((product) => (
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
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-indigo-600 font-bold mt-1">${product.price}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-gray-500">{product.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all products →
          </Link>
        </div>
      </div>

      {/* Categories — BUG: category links navigate to a filtered page that doesn't work */}
      <div className="bg-gray-100 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
          <div className="flex gap-4 flex-wrap">
            {['Laptops', 'Audio', 'Monitors', 'Accessories'].map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${cat}`}
                className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow font-medium text-gray-700"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
