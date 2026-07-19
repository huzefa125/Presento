import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const loadTranslation = async (language) => {
  switch (language) {
    case 'hi':
      return import('./locales/hi/translation.json');
    case 'ta':
      return import('./locales/ta/translation.json');
    case 'te':
      return import('./locales/te/translation.json');
    case 'bn':
      return import('./locales/bn/translation.json');
    case 'mr':
      return import('./locales/mr/translation.json');
    case 'ar':
      return import('./locales/ar/translation.json');
    case 'zh':
      return import('./locales/zh/translation.json');
    case 'es':
      return import('./locales/es/translation.json');
    case 'fr':
      return import('./locales/fr/translation.json');
    case 'pt':
      return import('./locales/pt/translation.json');
    case 'en':
    default:
      return import('./locales/en/translation.json');
  }
};

const lazyTranslationBackend = {
  type: 'backend',
  read(language, namespace, callback) {
    loadTranslation(language)
      .then((module) => callback(null, module.default || module))
      .catch((error) => callback(error, null));
  }
};

i18n
  .use(lazyTranslationBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    partialBundledLanguages: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
