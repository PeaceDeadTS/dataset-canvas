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
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            username: decodedToken.username,
          });
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/auth';
  };

  return { user, logout };
}
