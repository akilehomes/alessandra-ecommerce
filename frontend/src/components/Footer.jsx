import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { COMPANY } from '../config/company';

export default function Footer() {
  const { t } = useI18n();
  const link = 'hover:text-white transition';
  const head = 'text-white font-semibold tracking-wide mb-4 text-xs uppercase';
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-16 mt-20">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div>
          <h4 className={head}>{t('footer.shop')}</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/shop" className={link}>{t('footer.allProducts')}</Link></li>
            <li><Link to="/search" className={link}>{t('footer.search')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={head}>{t('footer.studio')}</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/about" className={link}>{t('footer.about')}</Link></li>
            <li><Link to="/projects" className={link}>{t('footer.projects')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={head}>{t('footer.support')}</h4>
          <ul className="space-y-2 text-xs">
            {COMPANY.email && <li><a href={`mailto:${COMPANY.email}`} className={link}>{t('footer.contact')}</a></li>}
            <li><Link to="/legal/envio" className={link}>{t('footer.shipping')}</Link></li>
            <li><Link to="/legal/trocas" className={link}>{t('footer.returns')}</Link></li>
            <li><Link to="/track" className={link}>{t('footer.track')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={head}>{t('footer.legal')}</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/legal/privacidade" className={link}>{t('footer.privacy')}</Link></li>
            <li><Link to="/legal/termos" className={link}>{t('footer.terms')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8 max-w-6xl mx-auto px-6 flex justify-between items-center text-xs">
        <p>&copy; {new Date().getFullYear()} Alessandra Zanetti. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
