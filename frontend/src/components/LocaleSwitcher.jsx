import React, { useState, useEffect, useRef } from 'react';
import { useRegionStore } from '../store/regionStore';
import { useCountries } from '../utils/geo';
import { useI18n, LANGUAGES, useLanguageStore } from '../i18n';

// Bandeira a partir do codigo do pais (emoji); sem suporte do sistema, aparece o proprio codigo
const flag = (code) => String(code).toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

// Seletor unico de pais (define moeda e precos) e idioma, num botao compacto: "🇧🇷 PT ▾"
export default function LocaleSwitcher() {
  const { t, countryName } = useI18n();
  const countries = useCountries();
  const { country, setCountry } = useRegionStore();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Brasil e Portugal primeiro; depois os demais em ordem alfabetica (no idioma atual)
  const priority = ['BR', 'PT'];
  const sorted = [...countries].sort((a, b) => {
    const pa = priority.indexOf(a.code); const pb = priority.indexOf(b.code);
    if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    return countryName(a.code).localeCompare(countryName(b.code));
  });
  const current = countries.find((c) => c.code === country);
  const currency = current ? current.currency : 'BRL';

  const row = (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
    padding: '7px 10px', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13,
    background: active ? '#000' : 'transparent', color: active ? '#fff' : '#111',
  });

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t('locale.title')}: ${countryName(country)}, ${LANGUAGES[lang]}`}
        title={`${countryName(country)} · ${LANGUAGES[lang]} · ${currency}`}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none' }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{flag(country)}</span>
        <span>{lang.toUpperCase()}</span>
        <span aria-hidden="true" style={{ fontSize: 9 }}>▾</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('locale.title')}
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 300, background: '#fff', border: '1px solid #d1d5db', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100 }}
        >
          <div style={{ padding: '10px 10px 4px', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' }}>
            {t('locale.language')}
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px' }}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <button key={code} type="button" onClick={() => setLang(code)} style={{ ...row(lang === code), width: 'auto', flex: 1, border: '1px solid #d1d5db', justifyContent: 'center' }}>
                {name}
              </button>
            ))}
          </div>

          <div style={{ padding: '4px 10px', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', borderTop: '1px solid #eee' }}>
            {t('locale.country')}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {sorted.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { setCountry(c.code); setOpen(false); }}
                style={row(country === c.code)}
              >
                <span style={{ width: 20 }}>{flag(c.code)}</span>
                <span style={{ flex: 1 }}>{countryName(c.code)}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{c.currency}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 10px', fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#6b7280', borderTop: '1px solid #eee' }}>
            {t('locale.note', { currency })}
          </div>
        </div>
      )}
    </div>
  );
}
