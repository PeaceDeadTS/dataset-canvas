import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext: token from localStorage =', token ? 'exists' : 'null');
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        console.log('AuthContext: decodedToken =', decodedToken);
        
        if (decodedToken.exp * 1000 > Date.now()) {
          const userObj = {
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            username: decodedToken.username,
          };
          console.log('AuthContext: setting user =', userObj);
          setUser(userObj);
        } else {
          console.log('AuthContext: token expired, removing from localStorage');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Failed to decode token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      console.log('AuthContext: no token found, user = null');
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/auth';
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
