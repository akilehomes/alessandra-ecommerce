import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useI18n, LANGUAGES, useLanguageStore } from '../i18n';

export default function Navbar() {
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { region, setRegion } = useRegionStore();
  const { user, logout } = useAuthStore();
  const { t } = useI18n();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
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
          {/* Idioma */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t('nav.language')}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', padding: '4px 8px', border: '1px solid #000', background: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code} title={name}>{code.toUpperCase()}</option>)}
          </select>

          {/* Region Selector */}
          <select
            aria-label={t('nav.region')}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', padding: '4px 8px', border: '1px solid #000', background: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
          >
            <option value="BR">{t('region.BR')}</option>
            <option value="PT">{t('region.PT')}</option>
            <option value="EU">{t('region.EU')}</option>
          </select>

          {/* Auth Links */}
          <div className="flex gap-3 items-center text-sm whitespace-nowrap">
            {user ? (
              <>
                <Link to="/account/orders" className="hidden xl:inline hover:opacity-60 transition truncate max-w-[110px] whitespace-nowrap" title={user.name}>
                  {String(user.name || '').split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:opacity-60 transition text-red-500 font-medium whitespace-nowrap"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:opacity-60 transition whitespace-nowrap">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="hover:opacity-60 transition font-bold whitespace-nowrap">
                  {t('nav.register')}
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
          <Link to="/cart" className="hover:opacity-60 transition p-1 relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
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
