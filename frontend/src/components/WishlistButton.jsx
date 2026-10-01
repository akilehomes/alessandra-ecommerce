import React, { useState, useEffect } from 'react';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';

export default function WishlistButton({ productId, size = 'md' }) {
  const [isHovered, setIsHovered] = useState(false);
  const { token } = useAuthStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(productId);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert('Please login to add items to your wishlist');
      return;
    }

    await toggleWishlist(productId, token);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center rounded-full
        transition-all duration-200 ease-out
        ${inWishlist
          ? 'bg-red-50 text-red-500'
          : isHovered
            ? 'bg-gray-100 text-gray-400'
            : 'bg-transparent text-gray-300'
        }
        hover:scale-110
        active:scale-95
      `}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={inWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        className="transition-all duration-200"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}
