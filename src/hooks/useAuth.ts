import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'User';
  iat: number;
  exp: number;
}

// This interface should align with our global User type for consistency
export interface AuthUser {
  id: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'User';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        // Check if token is expired
        if (decodedToken.exp * 1000 > Date.now()) {
          // Map userId to id for consistency across the app
          setUser({
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
          });
        } else {
          // Token is expired, remove it
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
