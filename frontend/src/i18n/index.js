import { useCallback } from 'react';
import pt from './pt';
import en from './en';
import { useLanguageStore } from './languageStore';

export { LANGUAGES, useLanguageStore } from './languageStore';

const DICTS = { pt, en };

// Busca a chave no idioma; se faltar, usa o portugues; se faltar tambem, mostra a propria chave
export function translate(lang, key, vars) {
  const text = (DICTS[lang] && DICTS[lang][key]) ?? DICTS.pt[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])));
}

// Para uso fora de componentes (stores, utilitarios)
export const tNow = (key, vars) => translate(useLanguageStore.getState().lang, key, vars);

const LOCALES = { pt: 'pt-BR', en: 'en-GB' };

// Hook principal: t(chave, variaveis), idioma atual e formatadores por idioma
export function useI18n() {
  const lang = useLanguageStore((s) => s.lang);
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const locale = LOCALES[lang] || 'pt-BR';
  const countryName = useCallback((code) => {
    try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code; } catch (e) { return code; }
  }, [locale]);
  // Valor monetario no formato do idioma (R$ 1.234,00 / €1,234.00)
  const money = useCallback((amount, currency = 'BRL') => {
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0); } catch (e) { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
  }, [locale]);
  const formatDate = useCallback((value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale);
  }, [locale]);
  return { t, lang, locale, countryName, formatDate, money };
}
