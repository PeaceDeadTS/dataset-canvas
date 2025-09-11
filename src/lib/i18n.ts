import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импортируем переводы
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enPages from '@/locales/en/pages.json';
import enAdmin from '@/locales/en/admin.json';

import ruCommon from '@/locales/ru/common.json';
import ruNavigation from '@/locales/ru/navigation.json';
import ruPages from '@/locales/ru/pages.json';
import ruAdmin from '@/locales/ru/admin.json';

// Ресурсы переводов
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    pages: enPages,
    admin: enAdmin,
  },
  ru: {
    common: ruCommon,
    navigation: ruNavigation,
    pages: ruPages,
    admin: ruAdmin,
  },
} as const;

i18n
  // Детектор языка браузера
  .use(LanguageDetector)
  // Подключение к React
  .use(initReactI18next)
  // Инициализация i18next
  .init({
    resources,
    
    // Язык по умолчанию
    fallbackLng: 'en',
    
    // Настройки детектора языка
    detection: {
      // Порядок определения языка
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Ключи для сохранения
      lookupLocalStorage: 'i18nextLng',
      
      // Кэширование выбора пользователя
      caches: ['localStorage'],
    },

    // Настройки интерполяции
    interpolation: {
      escapeValue: false, // React уже защищает от XSS
    },

    // Настройки namespace
    defaultNS: 'common',
    ns: ['common', 'navigation', 'pages', 'admin'],

    // Отладка (только в разработке)
    debug: import.meta.env.DEV,

    // Настройки для автоматического обновления переводов
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV 
      ? (lng: string[], ns: string, key: string) => {
          console.warn(`Missing translation key: ${key} for language: ${lng[0]} in namespace: ${ns}`);
        }
      : undefined,
  });

export default i18n;
