import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useI18n } from '../i18n';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { user, logout } = useAuthStore();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-transparent h-16">
      <div className="max-w-full px-6 h-full flex items-center justify-between gap-4">
        {/* Left Navigation */}
        <div className="flex-1 basis-0 min-w-0 flex gap-6 text-sm font-medium">
          <Link to="/" className="hover:opacity-60 transition">{t('nav.home')}</Link>
          <Link to="/shop" className="hover:opacity-60 transition font-bold">{t('nav.shop')}</Link>
          <Link to="/projects" className="hover:opacity-60 transition">{t('nav.projects')}</Link>
          <Link to="/about" className="hover:opacity-60 transition">{t('nav.about')}</Link>
        </div>

        {/* Center Logo */}
        <Link to="/" className="shrink-0 text-center text-xl font-bold tracking-wider whitespace-nowrap">
          ALESSANDRA ZANETTI
        </Link>

        {/* Right Section */}
        <div className="flex-1 basis-0 min-w-0 flex gap-4 items-center justify-end">
          {/* Pais (moeda/precos) e idioma, num seletor so */}
          <LocaleSwitcher />

          {/* Auth Links */}
          <div className="flex gap-3 items-center text-sm whitespace-nowrap">
            {user ? (
              <>

                <button
                  onClick={handleLogout}
                  className="hover:opacity-60 transition text-red-500 font-medium whitespace-nowrap"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:opacity-60 transition p-1" title={t('nav.login')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Icons */}
          <button className="hover:opacity-60 transition p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <Link to="/wishlist" className="hover:opacity-60 transition p-1 relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="hover:opacity-60 transition p-1 relative" title={t('nav.cart')} aria-label={t('nav.cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l1 14H5L6 7z"></path>
              <path d="M9 7V6a3 3 0 0 1 6 0v1"></path>
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
