import 'react-i18next';

// Импортируем типы из наших файлов переводов
import type common from '@/locales/en/common.json';
import type navigation from '@/locales/en/navigation.json';
import type pages from '@/locales/en/pages.json';
import type admin from '@/locales/en/admin.json';

// Декларируем модуль для типизации
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      navigation: typeof navigation;
      pages: typeof pages;
      admin: typeof admin;
    };
  }
}
