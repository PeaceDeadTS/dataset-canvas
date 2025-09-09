import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '@/types';

interface DecodedToken {
  userId: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'User';
  username: string;
  iat: number;
  exp: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔐 useAuth: Проверяем токен в localStorage:', !!token);
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        console.log('🔓 useAuth: Декодированный токен:', decodedToken);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          const userData = {
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            username: decodedToken.username,
          };
          console.log('✅ useAuth: Токен действителен, устанавливаем пользователя:', userData);
          setUser(userData);
        } else {
          console.log('⏰ useAuth: Токен истек, удаляем');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("❌ useAuth: Ошибка при декодировании токена:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      console.log('👻 useAuth: Токен отсутствует');
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/auth';
  };

  return { user, logout };
}
