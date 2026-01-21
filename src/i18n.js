import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Handle RTL direction
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.dir = dir;
  document.documentElement.lang = lng;
  if (dir === 'rtl') {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
});

// Set initial direction
const initialDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.dir = initialDir;
document.documentElement.lang = i18n.language;
if (initialDir === 'rtl') {
  document.body.classList.add('rtl');
}

export default i18n;
