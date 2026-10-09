import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
        <div className="max-w-5xl mx-auto">
          {/* Carrossel: foto na proporcao original (retrato 2:3), sem corte */}
          <div className="mb-8 relative mx-auto shadow-lg rounded-lg overflow-hidden bg-white" style={{ height: 'min(80vh, 720px)', aspectRatio: '2 / 3', maxWidth: '100%' }}>
            <img
              src={images[activeImageIndex]}
              alt={`Galeria Alessandra ${activeImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => setActiveImageIndex((activeImageIndex + images.length - 1) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-xl leading-none"
            >‹</button>
            <button
              type="button"
              aria-label="Próxima"
              onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-xl leading-none"
            >›</button>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex gap-4 justify-center flex-wrap">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`transition-all ${
                  idx === activeImageIndex
                    ? 'ring-2 ring-black'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  className="w-20 h-28 object-cover rounded"
                />
              </button>
            ))}
          </div>
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
