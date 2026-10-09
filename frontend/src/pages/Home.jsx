import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const images = [
    '/alessandra-1.jpg',
    '/alessandra-2.jpg',
    '/alessandra-3.jpg',
    '/alessandra-4.jpg'
  ];

  return (
    <div className="bg-white">
      {/* Hero Video Section */}
      <section className="w-full h-screen relative overflow-hidden bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/alessandra-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0  flex items-end justify-center" style={{ paddingBottom: 'calc(48px + 20vh)' }}>
          <div className="text-center text-white">
            <p style={{
              fontFamily: 'Crimson Text, serif',
              fontSize: '28.8px',
              fontStyle: 'italic',
              fontWeight: '300',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              {t('home.tagline')}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Galeria Alessandra ${idx + 1}`}
              className="w-full rounded-lg shadow-lg"
              style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
            />
          ))}
        </div>
      </section>

      {/* Cards Section - 2 Column Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white">
        <div
          className="flex flex-col items-center justify-center text-center py-24 px-6 group cursor-pointer border-r border-gray-200 hover:bg-gray-50 transition"
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
          className="flex flex-col items-center justify-center text-center py-24 px-6 group cursor-pointer hover:bg-gray-50 transition"
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
