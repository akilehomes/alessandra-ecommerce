import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRegionStore } from '../store/regionStore';
import WishlistButton from '../components/WishlistButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const REGION_CONFIG = {
  BR: { name: 'Brasil', symbol: 'R$', tax: 0.18 },
  PT: { name: 'Portugal', symbol: '€', tax: 0.23 },
  EU: { name: 'Europa', symbol: '€', tax: 0.21 },
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(5);
  const navigate = useNavigate();
  const { region } = useRegionStore();
  const regionConfig = REGION_CONFIG[region];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products?limit=100`);
      setProducts(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
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

  return (
    <div className="bg-white text-gray-900 pt-16">
      {/* Header Section - CENTRALIZED */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase'}}>
            Products
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {products.length} {products.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </section>

      {/* View Controls */}
      <section className="py-6 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '0.5px'}}>
            <button
              onClick={() => setViewMode(2)}
              style={{background: 'none', border: 'none', cursor: 'pointer', opacity: viewMode === 2 ? 1 : 0.5, fontWeight: viewMode === 2 ? 700 : 400}}
            >
              View 2
            </button>
            <span style={{margin: '0 8px', opacity: 0.5}}>|</span>
            <button
              onClick={() => setViewMode(3)}
              style={{background: 'none', border: 'none', cursor: 'pointer', opacity: viewMode === 3 ? 1 : 0.5, fontWeight: viewMode === 3 ? 700 : 400}}
            >
              3
            </button>
            <span style={{margin: '0 8px', opacity: 0.5}}>|</span>
            <button
              onClick={() => setViewMode(5)}
              style={{background: 'none', border: 'none', cursor: 'pointer', opacity: viewMode === 5 ? 1 : 0.5, fontWeight: viewMode === 5 ? 700 : 400}}
            >
              5
            </button>
          </div>
          <div style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', letterSpacing: '0.5px', cursor: 'pointer'}}>
            Filters
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-6">
        {loading ? (
          <div style={{textAlign: 'center', padding: '64px 0', fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic'}}>
            Carregando produtos...
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className={`grid ${getGridClass()}`}>
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                >
                  <div
                    className="aspect-square overflow-hidden mb-2 bg-gray-50 relative"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300"
                    />
                    {product.stock_quantity != null && product.stock_quantity <= 0 && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#000', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', padding: '3px 8px', textTransform: 'uppercase' }}>
                        Esgotado
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>
                  </div>
                  <div onClick={() => navigate(`/product/${product.id}`)}>
                    <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '2px', textTransform: 'uppercase', lineHeight: '1.2'}}>
                      {product.name}
                    </h3>
                    <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '9px', fontWeight: '400', letterSpacing: '0.5px', color: '#666'}}>
                      {regionConfig.symbol} {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
