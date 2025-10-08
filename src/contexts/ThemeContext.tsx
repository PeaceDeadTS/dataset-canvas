import { createContext, useContext, useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем тему при монтировании компонента
  useEffect(() => {
    const initializeTheme = async () => {
      if (user) {
        // Для авторизованных пользователей загружаем тему с сервера
        try {
          const response = await axios.get('/users/me/settings');
          const savedTheme = response.data.settings.theme as Theme;
          setThemeState(savedTheme);
        } catch (error) {
          console.error('Failed to load user theme settings', error);
          // Fallback на localStorage если не удалось загрузить с сервера
          const localTheme = localStorage.getItem('theme') as Theme | null;
          setThemeState(localTheme || 'system');
        }
      } else {
        // Для неавторизованных пользователей используем localStorage
        const localTheme = localStorage.getItem('theme') as Theme | null;
        setThemeState(localTheme || 'system');
      }
      setIsInitialized(true);
    };

    initializeTheme();
  }, [user]);

  // Определяем эффективную тему на основе настроек
  useEffect(() => {
    if (!isInitialized) return;

    const getEffectiveTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const updateEffectiveTheme = () => {
      const newEffectiveTheme = getEffectiveTheme();
      setEffectiveTheme(newEffectiveTheme);

      // Применяем класс к документу
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newEffectiveTheme);
    };

    updateEffectiveTheme();

    // Слушаем изменения системной темы
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateEffectiveTheme();
      
      // Современный способ
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback для старых браузеров
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme, isInitialized]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (user) {
      // Для авторизованных пользователей сохраняем на сервер
      try {
        await axios.patch('/users/me/settings', { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme to server', error);
        // Fallback на localStorage если не удалось сохранить на сервер
        localStorage.setItem('theme', newTheme);
      }
    } else {
      // Для неавторизованных пользователей сохраняем в localStorage
      localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

