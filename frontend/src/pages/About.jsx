import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function About() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="bg-white text-gray-900 pt-16">
      {/* Header Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('about.title')}
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {t('about.mission')}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', lineHeight: '1.8', marginBottom: '20px', color: '#666'}}>
            {t('about.p1')}
          </p>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '16px', fontStyle: 'italic', fontWeight: '300', lineHeight: '1.8', color: '#666'}}>
            {t('about.p2')}
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="py-24 px-6">
          <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('about.design')}
          </h2>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {t('about.designSub')}
          </p>
        </div>

        <div className="py-24 px-6">
          <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('about.quality')}
          </h2>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {t('about.qualitySub')}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center">
        <button
          onClick={() => navigate('/shop')}
          style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '10px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
        >
          {t('about.shop')}
        </button>
      </section>
    </div>
  );
}
