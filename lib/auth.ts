import api from './api';

/* =========================
   Types
========================= */

export interface Department {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface User {
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
}

export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  userInfo?: any;
  locked?: boolean;
  lockedAt?: string;
  lockRemainingMinutes?: number;
  attemptsRemaining?: number;
}

export interface RegistrationData {
  id_card: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  region?: string;
  branch?: string;
  department: string;
  position?: string;
  role?: 'STAFF' | 'LINE_MANAGER' | 'SUPER_ADMIN';
  reportsTo?: string;
}

export interface RegistrationResponse {
  success: boolean;
  status: number;
  message: string;
  user: {
    id_card: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    position?: string;
    reportsTo?: any;
  };
}

export interface OtpVerificationData {
  id_card: string;
  otp: string;
}

export interface OtpStatusResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    isVerified: boolean;
    hasOtp: boolean;
    otpExpiresAt: string | null;
    email: string;
    isLocked: boolean;
    lockedAt: string | null;
    lockedReason: string | null;
  };
}

export interface LockedAccount {
  _id: string;
  id_card: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: Department;
  isLocked: boolean;
  lockedAt: string;
  lockedReason: string;
  reportsTo?: any;
}

export interface LockedAccountsResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    count: number;
    totalCount: number;
    userRole: string;
    accounts: LockedAccount[];
  };
}

export interface LockAccountData {
  id_card: string;
  reason?: string;
}

export interface UnlockAccountData {
  id_card: string;
}

export interface ApiError extends Error {
  response?: {
    status: number;
    data: any;
  };
  requiresVerification?: boolean;
  userInfo?: any;
  locked?: boolean;
  lockedAt?: string;
  lockRemainingMinutes?: number;
  attemptsRemaining?: number;
  error?: string;
}

/* =========================
   Authentication API Calls
========================= */

/**
 * Login user
 */
export const login = async (credentials: { id_card: string; password: string }): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Extract data from backend response structure
    const backendData = response.data;
    
    return {
      success: backendData.success,
      status: backendData.status,
      message: backendData.message,
      token: backendData.token,
      user: backendData.user,
      requiresVerification: backendData.requiresVerification,
      userInfo: backendData.userInfo,
      locked: backendData.locked,
      lockedAt: backendData.lockedAt,
      attemptsRemaining: backendData.attemptsRemaining
    };
  } catch (error: any) {
    console.error('Login API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Login failed. Please try again.'
    );
    
    apiError.response = error.response;
    
    if (error.response?.status === 423) {
      apiError.locked = true;
      apiError.lockedAt = error.response.data.lockedAt;
      apiError.lockRemainingMinutes = error.response.data.lockRemainingMinutes;
    }
    
    if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
      apiError.requiresVerification = true;
      apiError.userInfo = error.response.data.userInfo;
    }
    
    if (error.response?.status === 401 && error.response?.data?.attemptsRemaining) {
      apiError.attemptsRemaining = error.response.data.attemptsRemaining;
    }
    
    throw apiError;
  }
};

/**
 * Register new user
 */
export const register = async (data: RegistrationData): Promise<RegistrationResponse> => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Admin Registration API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Registration failed. Please try again.'
    );
    apiError.response = error.response;
    throw apiError;
  }
};

/**
 * Verify OTP
 */
export const verifyOtp = async (data: OtpVerificationData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  } catch (error: any) {
    console.error('OTP verification API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'OTP verification failed'
    );
    apiError.response = error.response;
    throw apiError;
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (id_card: string): Promise<{ success: boolean; message: string; email: string; expiresAt: string }> => {
  try {
    const response = await api.post('/auth/resend-otp', { id_card });
    return response.data;
  } catch (error: any) {
    console.error('Resend OTP API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Failed to resend OTP'
    );
    apiError.response = error.response;
    throw apiError;
  }
};

/**
 * Check OTP status
 */
export const checkOtpStatus = async (id_card: string): Promise<OtpStatusResponse> => {
  try {
    const response = await api.post('/auth/check-otp-status', { id_card });
    return response.data;
  } catch (error: any) {
    console.error('Check OTP status API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Failed to check OTP status'
    );
    apiError.response = error.response;
    throw apiError;
  }
};

/* =========================
   Admin Account Management API Calls
========================= */

/**
 * Get all locked accounts (Admin only)
 */
export const getLockedAccounts = async (): Promise<LockedAccountsResponse> => {
  try {
    const response = await api.get('/auth/locked-accounts');
    console.log('Get locked accounts response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Get locked accounts API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Failed to fetch locked accounts'
    );
    apiError.response = error.response;
    
    if (error.response?.status === 403) {
      apiError.error = 'INSUFFICIENT_PERMISSIONS';
    }
    
    throw apiError;
  }
};

/**
 * Unlock user account (Admin only)
 */
export const unlockAccount = async (data: UnlockAccountData): Promise<{
  success: boolean;
  message: string;
  unlockedBy: { id_card: string; name: string; role: string };
  user: { id_card: string; email: string; first_name: string; last_name: string };
}> => {
  try {
    const response = await api.post('/auth/unlock-account', data);
    return response.data;
  } catch (error: any) {
    console.error('Unlock account API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Failed to unlock account'
    );
    apiError.response = error.response;
    
    if (error.response?.status === 403) {
      apiError.error = 'INSUFFICIENT_PERMISSIONS';
    }
    
    if (error.response?.status === 404) {
      apiError.error = 'USER_NOT_FOUND';
    }
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('not locked')) {
      apiError.error = 'ACCOUNT_NOT_LOCKED';
    }
    
    throw apiError;
  }
};

/**
 * Manually lock user account (Admin only)
 */
export const lockAccount = async (data: LockAccountData): Promise<{
  success: boolean;
  message: string;
  lockedBy: { id_card: string; name: string; role: string };
  user: { 
    id_card: string; 
    email: string; 
    first_name: string; 
    last_name: string; 
    role: string;
    department?: Department;
    lockedAt: string;
    lockedReason: string;
  };
}> => {
  try {
    const response = await api.post('/auth/lock-account', data);
    return response.data;
  } catch (error: any) {
    console.error('Lock account API error:', error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || 'Failed to lock account'
    );
    apiError.response = error.response;
    
    if (error.response?.status === 403) {
      apiError.error = 'INSUFFICIENT_PERMISSIONS';
    }
    
    if (error.response?.status === 404) {
      apiError.error = 'USER_NOT_FOUND';
    }
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already locked')) {
      apiError.error = 'ACCOUNT_ALREADY_LOCKED';
    }
    
    throw apiError;
  }
};

/* =========================
   Export all functions
========================= */
export const authApi = {
  login,
  register,
  verifyOtp,
  resendOtp,
  checkOtpStatus,
  getLockedAccounts,
  unlockAccount,
  lockAccount
};