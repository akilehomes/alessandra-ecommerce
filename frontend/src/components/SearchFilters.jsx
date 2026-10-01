import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function SearchFilters({ onFiltersChange, initialFilters = {} }) {
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [filters, setFilters] = useState({
    q: initialFilters.q || '',
    category: initialFilters.category || 'all',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    sortBy: initialFilters.sortBy || 'newest',
    page: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [catRes, priceRes] = await Promise.all([
        axios.get(`${API_URL}/search/categories`),
        axios.get(`${API_URL}/search/price-range`)
      ]);

      setCategories(catRes.data.categories || []);
      setPriceRange({
        min: priceRes.data.minPrice,
        max: priceRes.data.maxPrice
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      q: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      page: 1
    };
    setFilters(resetFilters);
    if (onFiltersChange) {
      onFiltersChange(resetFilters);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando filtros...</div>;
  }

  return (
    <div style={{
      width: '280px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      height: 'fit-content',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', fontFamily: 'Outfit, sans-serif' }}>
          Filtros
        </h3>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#0ea5e9',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            textDecoration: 'underline'
          }}
        >
          Limpar
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: '8px' }}>
          BUSCAR
        </label>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          placeholder="Nome ou descrição..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Category */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: '8px' }}>
          CATEGORIA
        </label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px'
          }}
        >
          <option value="all">Todas</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: '8px' }}>
          FAIXA DE PREÇO
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            placeholder="Mín."
            min={0}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px'
            }}
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            placeholder="Máx."
            min={0}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px'
            }}
          />
        </div>
        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px', margin: '4px 0 0 0', fontFamily: 'Outfit, sans-serif' }}>
          Até R$ {priceRange.max.toFixed(0)}
        </p>
      </div>

      {/* Sort */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: '8px' }}>
          ORDENAR
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px'
          }}
        >
          <option value="newest">Novos</option>
          <option value="name">Nome (A-Z)</option>
          <option value="price-asc">Preço (Menor)</option>
          <option value="price-desc">Preço (Maior)</option>
        </select>
      </div>
    </div>
  );
}
