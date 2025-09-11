import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

interface DecodedToken {
  userId: string;
  username: string;
  email: string;
  role: 'Administrator' | 'Developer' | 'User';
  iat: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          const userObj = {
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            username: decodedToken.username,
          };
          setUser(userObj);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Используем React Router для навигации
    navigate('/auth', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
