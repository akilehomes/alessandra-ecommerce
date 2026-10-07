import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRegionStore } from '../store/regionStore';
import WishlistButton from './WishlistButton';
import { useI18n } from '../i18n';
import { currencyOfRegion, unitPriceFor } from '../utils/pricing';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const REGION_CONFIG = {
  BR: { symbol: 'R$', tax: 0.18 },
  PT: { symbol: '€', tax: 0.23 },
  EU: { symbol: '€', tax: 0.21 },
};

export default function SearchResults({ filters = {} }) {
  const navigate = useNavigate();
  const { region } = useRegionStore();
  const { t, money } = useI18n();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState(5);

  useEffect(() => {
    searchProducts();
  }, [filters]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.page) params.append('page', filters.page);
      params.append('limit', viewMode);

      const response = await axios.get(`${API_URL}/search?${params.toString()}`);
      setProducts(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getGridClass = () => {
    if (viewMode === 2) return 'grid-cols-2 md:grid-cols-2 gap-4';
    if (viewMode === 3) return 'grid-cols-3 md:grid-cols-3 gap-3';
    if (viewMode === 5) return 'grid-cols-5 md:grid-cols-5 gap-3';
    return 'grid-cols-5 md:grid-cols-5 gap-3';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: '#666', fontFamily: 'Outfit, sans-serif' }}>
        {t('sr.searching')}
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      {/* View Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '0.5px' }}>
          <button
            onClick={() => setViewMode(2)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: viewMode === 2 ? 1 : 0.5,
              fontWeight: viewMode === 2 ? 700 : 400
            }}
          >
            2
          </button>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <button
            onClick={() => setViewMode(3)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: viewMode === 3 ? 1 : 0.5,
              fontWeight: viewMode === 3 ? 700 : 400
            }}
          >
            3
          </button>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <button
            onClick={() => setViewMode(5)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: viewMode === 5 ? 1 : 0.5,
              fontWeight: viewMode === 5 ? 700 : 400
            }}
          >
            5
          </button>
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#666' }}>
          {pagination.total === 1 ? t('sr.results.one', { n: 1 }) : t('sr.results.other', { n: pagination.total })}
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ fontSize: '16px', color: '#666', fontFamily: 'Outfit, sans-serif' }}>
            {t('sr.none')}
          </p>
        </div>
      ) : (
        <>
          <div className={`grid ${getGridClass()}`}>
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div
                  className="aspect-square overflow-hidden mb-2 bg-gray-50 relative"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WishlistButton productId={product.id} size="sm" />
                  </div>
                </div>
                <div onClick={() => navigate(`/product/${product.id}`)}>
                  <h3 style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    marginBottom: '2px',
                    textTransform: 'uppercase',
                    lineHeight: '1.2'
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '9px',
                    fontWeight: '400',
                    letterSpacing: '0.5px',
                    color: '#666'
                  }}>
                    {unitPriceFor(product, currencyOfRegion(region)) === null ? t('product.unavailableRegion') : money(unitPriceFor(product, currencyOfRegion(region)), currencyOfRegion(region))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    // Trigger filter change with new page
                    if (filters.page !== page) {
                      // This would need to be handled by parent component
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    border: page === pagination.page ? '2px solid #000' : '1px solid #d1d5db',
                    backgroundColor: page === pagination.page ? '#000' : '#fff',
                    color: page === pagination.page ? '#fff' : '#000',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: '4px',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
