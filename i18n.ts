import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const LANG_KEY = 'sos-condo-lang';

/** Supported UI/email languages. Add a new language by: 1) adding here, 2) adding locales/XX.json and resources below, 3) adding email strings in functions. */
export const SUPPORTED_LANGUAGES: readonly string[] = ['en', 'fr'];

export const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
  } catch {
    return 'en';
  }
};

export const setStoredLanguage = (lang: string): void => {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React escapes by default
    },
  });

i18n.on('languageChanged', (lng) => {
  setStoredLanguage(lng);
});

export default i18n;
