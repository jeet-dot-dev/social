"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth on component mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Set cookie for middleware
        document.cookie = `authToken=${storedToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set cookie for middleware
    document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    
    // Redirect to dashboard
    router.push('/dashboard/profile');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Redirect to home
    router.push('/');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
