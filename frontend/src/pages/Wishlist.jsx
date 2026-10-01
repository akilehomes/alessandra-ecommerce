import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import WishlistButton from '../components/WishlistButton';

export default function Wishlist() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { items, fetchWishlist, loading } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist(token);
  }, [user, token, navigate, fetchWishlist]);

  const handleAddToCart = (product) => {
    addItem({
      id: product.product_id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
    alert('Added to cart!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your wishlist</h1>
          <Link to="/login" className="text-blue-500 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Wishlist</h1>
          <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding items to your wishlist!</p>
            <Link to="/shop" className="inline-block bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.product_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Product Image */}
                <Link to={`/product/${item.product_id}`} className="block relative h-64 bg-gray-100 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No image</div>
                  )}

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3">
                    <WishlistButton productId={item.product_id} size="md" />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="block font-bold text-lg mb-2 hover:text-gray-600 transition"
                  >
                    {item.name}
                  </Link>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold">
                      R$ {item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
