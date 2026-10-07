import { useI18n } from '../i18n';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';

export default function AdvancedSearch() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      {/* Header */}
      <section className="py-12 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            {t('search.title')}
          </h1>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            {t('search.sub')}
          </p>
        </div>
      </section>

      {/* Search Layout */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div style={{
            display: 'flex',
            gap: '24px'
          }}>
            {/* Sidebar Filters */}
            <SearchFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
            />

            {/* Results */}
            <SearchResults filters={filters} />
          </div>
        </div>
      </section>
    </div>
  );
}
