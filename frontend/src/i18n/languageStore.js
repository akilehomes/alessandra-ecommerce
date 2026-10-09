import { create } from 'zustand';

// Idiomas disponiveis. Para adicionar outro (es, fr, it, de...): crie i18n/<codigo>/ com os mesmos textos e inclua aqui.
export const LANGUAGES = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };
const STORAGE_KEY = 'lang';

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES[saved]) return saved;
  } catch (e) { /* sem armazenamento: segue para o idioma do navegador */ }
  const preferred = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const tag of preferred) {
    const code = String(tag || '').toLowerCase().split('-')[0];
    if (LANGUAGES[code]) return code;
  }
  return 'pt';
}

const initial = detect();
if (typeof document !== 'undefined') document.documentElement.lang = initial === 'pt' ? 'pt-BR' : initial;

export const useLanguageStore = create((set) => ({
  lang: initial,
  setLang: (lang) => {
    if (!LANGUAGES[lang]) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignora */ }
    if (typeof document !== 'undefined') document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    set({ lang });
  },
}));
