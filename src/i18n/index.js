import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.js';
import ru from './locales/ru.js';
import en from './locales/en.js';

export const SUPPORTED = ['uz', 'ru', 'en'];
export const LANG_LABELS = { uz: "O‘zbekcha", ru: 'Русский', en: 'English' };
export const LOCALE_TAGS = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };
const STORAGE_KEY = 'rd.lang';

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch { /* storage unavailable */ }
  return 'uz'; // Uzbek is the default
}

export function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) return;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

const isDev = import.meta.env?.DEV;

i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru }, en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'uz',
  supportedLngs: SUPPORTED,
  interpolation: { escapeValue: false }, // React escapes
  returnNull: false,
  saveMissing: isDev,
  // Missing keys are surfaced loudly in development rather than silently showing the key.
  missingKeyHandler: (lngs, ns, key) => { if (isDev) console.warn(`[i18n] missing key "${key}" for ${lngs.join(',')}`); },
  parseMissingKeyHandler: (key) => (isDev ? `⟦${key}⟧` : key.split('.').pop()),
});
document.documentElement.lang = i18n.language;

export default i18n;
