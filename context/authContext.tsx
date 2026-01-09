"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, ApiError } from "@/lib/auth";

export interface Department {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export type User = {
  _id: string;
  id_card: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: Department | string;
  position?: string;
  reportsTo?: any;
  region?: string;
  branch?: string;
  isAdmin: boolean;
  isVerified: boolean;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
};

type AuthContextType = {
  user: User | null;
  login: (id_card: string, password: string) => Promise<{ requiresOtp?: boolean }>;
  logout: () => void;
  verifyOtp: (id_card: string, otp: string) => Promise<void>;
  resendOtp: (id_card: string) => Promise<{ 
    success: boolean; 
    message: string; 
    email: string; 
    expiresAt: string 
  }>;
  requiresOtp: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  pendingIdCard: string | null;
  clearOtpRequirement: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [pendingIdCard, setPendingIdCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    
    checkOtpExpiration();
    
    setLoading(false);
  }, []);

  const checkOtpExpiration = () => {
    const otpTimestamp = localStorage.getItem("otp_timestamp");
    if (otpTimestamp) {
      const currentTime = Date.now();
      const otpTime = parseInt(otpTimestamp);
      const tenMinutes = 10 * 60 * 1000;
      
      if (currentTime - otpTime > tenMinutes) {
        clearOtpRequirement();
      }
    }
  };

  const login = async (id_card: string, password: string): Promise<{ requiresOtp?: boolean }> => {
    setLoading(true);
    setRequiresOtp(false);
    setPendingIdCard(null);
    
    try {
      console.log('Attempting login for:', id_card);
      const data = await authApi.login({ id_card, password });

      console.log('Login response:', data);

      if (data.token && data.user) {
        console.log('Login successful, storing data');
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user);
        setRequiresOtp(false);
        setPendingIdCard(null);
        
        return {};
      } else {
        throw new Error("Login failed: Invalid response from server");
      }
      
    } catch (error: any) {
      console.error('Login error in context:', error);
      
      if (error.locked) {
        throw error;
      }
      
      if (error.requiresVerification) {
        console.log('OTP verification required');
        setRequiresOtp(true);
        setPendingIdCard(id_card);
        
        localStorage.setItem("otp_timestamp", Date.now().toString());
        
        if (error.userInfo) {
          localStorage.setItem("user_info", JSON.stringify(error.userInfo));
        }
        
        localStorage.setItem("pending_verification_id", id_card);
        localStorage.setItem("pending_password", password);
        
        return { requiresOtp: true };
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (id_card: string, otp: string) => {
    setLoading(true);
    
    try {
      const otpTimestamp = localStorage.getItem("otp_timestamp");
      if (otpTimestamp) {
        const currentTime = Date.now();
        const otpTime = parseInt(otpTimestamp);
        const tenMinutes = 10 * 60 * 1000;
        
        if (currentTime - otpTime > tenMinutes) {
          clearOtpRequirement();
          throw new Error("OTP has expired. Please login again.");
        }
      }

      const otpResponse = await authApi.verifyOtp({ id_card, otp });

      if (otpResponse.success || otpResponse.message === "Account verified successfully") {
        const password = localStorage.getItem("pending_password");
        
        if (!password) {
          throw new Error("Session expired. Please login again.");
        }

        try {
          const loginResponse = await authApi.login({ id_card, password });
          
          if (loginResponse.token && loginResponse.user) {
            localStorage.setItem("token", loginResponse.token);
            localStorage.setItem("user", JSON.stringify(loginResponse.user));
            
            setUser(loginResponse.user);
            setRequiresOtp(false);
            setPendingIdCard(null);
            
            localStorage.removeItem("otp_timestamp");
            localStorage.removeItem("pending_verification_id");
            localStorage.removeItem("pending_password");
            localStorage.removeItem("user_info");
          } else {
            throw new Error("Account verified, but login failed. Please try logging in again.");
          }
          
        } catch (loginError: any) {
          if (loginError.requiresVerification) {
            throw new Error("Verification still required. Please contact support.");
          }
          throw loginError;
        }
      } else {
        const errorMessage = otpResponse.message || "OTP verification failed";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (id_card: string): Promise<{ 
    success: boolean; 
    message: string; 
    email: string; 
    expiresAt: string 
  }> => {
    try {
      const otpTimestamp = localStorage.getItem("otp_timestamp");
      if (!otpTimestamp) {
        throw new Error("No active OTP session. Please login again.");
      }
      
      const currentTime = Date.now();
      const otpTime = parseInt(otpTimestamp);
      const tenMinutes = 10 * 60 * 1000;
      
      if (currentTime - otpTime > tenMinutes) {
        clearOtpRequirement();
        throw new Error("OTP session expired. Please login again.");
      }
      
      const data = await authApi.resendOtp(id_card);
      if (!data.success) {
        throw new Error(data.message || "Failed to resend OTP");
      }
      
      localStorage.setItem("otp_timestamp", Date.now().toString());
      
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  const clearOtpRequirement = () => {
    setRequiresOtp(false);
    setPendingIdCard(null);
    localStorage.removeItem("pending_verification_id");
    localStorage.removeItem("pending_password");
    localStorage.removeItem("user_info");
    localStorage.removeItem("otp_timestamp");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pending_verification_id");
    localStorage.removeItem("pending_password");
    localStorage.removeItem("user_info");
    localStorage.removeItem("otp_timestamp");
    setUser(null);
    setRequiresOtp(false);
    setPendingIdCard(null);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        login, 
        logout, 
        verifyOtp,
        resendOtp,
        requiresOtp, 
        isAuthenticated, 
        loading,
        pendingIdCard,
        clearOtpRequirement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};