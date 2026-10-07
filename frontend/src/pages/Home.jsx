import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="bg-white pt-16">
      {/* Header Section - NO BACKGROUND IMAGE - Simple title */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '36px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '16px',
            textTransform: 'uppercase'
          }}>
            ALESSANDRA ZANETTI
          </h1>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            {t('home.tagline')}
          </p>
        </div>
      </section>

      {/* Cards Section - 2 Column Grid - NO BACKGROUND IMAGES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div
          className="flex flex-col items-center justify-center text-center py-24 px-6 group cursor-pointer border-r border-gray-200"
          onClick={() => navigate('/shop')}
        >
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            {t('home.shop')}
          </h2>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            {t('home.shopSub')}
          </p>
        </div>

        <div
          className="flex flex-col items-center justify-center text-center py-24 px-6 group cursor-pointer"
          onClick={() => navigate('/projects')}
        >
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            {t('home.projects')}
          </h2>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            {t('home.projectsSub')}
          </p>
        </div>
      </section>
    </div>
  );
}
