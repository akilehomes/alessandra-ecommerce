import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

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
            Design Europeu com Alma Brasileira
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
            SHOP
          </h2>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            Peças selecionadas
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
            PROJECTS
          </h2>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            color: '#666'
          }}>
            Espaços transformados
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-6 text-center">
        <div style={{maxWidth: '500px', margin: '0 auto'}}>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '24px',
            textTransform: 'uppercase'
          }}>
            NEWSLETTER
          </h2>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontSize: '14px',
            fontStyle: 'italic',
            fontWeight: '300',
            marginBottom: '24px',
            color: '#666'
          }}>
            Sign up and get 10% off your next order
          </p>
          <div style={{marginBottom: '20px'}}>
            <input
              type="email"
              placeholder="Email address"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                padding: '8px 0',
                borderBottom: '1px solid #000',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                outline: 'none',
                width: '100%',
                background: 'transparent',
                color: '#000'
              }}
            />
          </div>
          <button
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1px',
              padding: '10px 24px',
              border: '1px solid #000',
              background: '#000',
              color: '#fff',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Subscribe
          </button>
        </div>
      </section>
    </div>
  );
}
