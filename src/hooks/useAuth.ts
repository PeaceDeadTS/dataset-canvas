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
    console.log('useAuth: token from localStorage =', token ? 'exists' : 'null');
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        console.log('useAuth: decodedToken =', decodedToken);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          const userObj = {
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            username: decodedToken.username,
          };
          console.log('useAuth: setting user =', userObj);
          setUser(userObj);
        } else {
          console.log('useAuth: token expired, removing from localStorage');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("useAuth: Failed to decode token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      console.log('useAuth: no token found, user = null');
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
