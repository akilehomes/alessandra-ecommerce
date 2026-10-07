import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Projects() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const projects = [
    { id: 1, title: 'Lisboa', subtitle: t('projects.apartment') },
    { id: 2, title: 'Porto', subtitle: t('projects.studio') },
    { id: 3, title: 'São Paulo', subtitle: t('projects.showroom') },
    { id: 4, title: 'Rio', subtitle: t('projects.loft') },
  ];

  return (
    <div className="bg-white text-gray-900 pt-16">
      {/* Header Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
            {t('projects.title')}
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', color: '#666'}}>
            {t('projects.sub')}
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group cursor-pointer pb-6"
                onClick={() => navigate('/shop')}
              >
                <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', fontWeight: '300', marginBottom: '8px', color: '#666'}}>
                  {project.subtitle}
                </p>
                <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase'}}>
                  {project.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center">
        <button
          onClick={() => navigate('/shop')}
          style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '10px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
        >
          {t('projects.shop')}
        </button>
      </section>
    </div>
  );
}
