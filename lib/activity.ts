// lib/activity.ts
import api from "./api";

/* =========================
   Types
========================= */

export interface DailyActivity {
  _id: string;
  user: any;
  date: string;
  timeInterval: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityData {
  timeInterval: string;
  description: string;
  status?: 'pending' | 'ongoing' | 'completed';
}

export interface UpdateActivityData {
  timeInterval?: string;
  description?: string;
  status?: 'pending' | 'ongoing' | 'completed';
}

interface ActivitiesResponse {
  success: boolean;
  status: number;
  message: string;
  count?: number;
  data: DailyActivity[];
  stats?: any;
  dateRange?: {
    start: string;
    end: string;
    days: number;
  };
  summary?: {
    totalDuration: number;
    statusCount: {
      pending: number;
      ongoing: number;
      completed: number;
    };
  };
}

interface ActivityResponse {
  success: boolean;
  status: number;
  message: string;
  data: DailyActivity;
}

interface ApiError extends Error {
  error?: string;
  details?: any[];
  conflictingActivity?: any;
  attemptsRemaining?: number;
  locked?: boolean;
  lockedAt?: string;
  lockRemainingMinutes?: number;
}

/* =========================
   Personal Activities API Calls
========================= */

/**
 * Create daily activity
 */
export const createDailyActivity = async (data: CreateActivityData): Promise<ActivityResponse> => {
  try {
    const response = await api.post<ActivityResponse>('/activities', data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create activity");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("createDailyActivity error:", error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || "Failed to create activity"
    );
    
    apiError.error = error.response?.data?.error;
    apiError.details = error.response?.data?.details;
    apiError.conflictingActivity = error.response?.data?.conflictingActivity;
    
    if (error.response?.status === 400) {
      if (error.response?.data?.error === 'VALIDATION_ERROR') {
        apiError.error = 'VALIDATION_ERROR';
      }
    } else if (error.response?.status === 409) {
      if (error.response?.data?.error === 'TIME_CONFLICT') {
        apiError.error = 'TIME_CONFLICT';
      }
    }
    
    throw apiError;
  }
};

/**
 * Get today's activities
 */
export const getTodayActivities = async (): Promise<ActivitiesResponse> => {
  try {
    const response = await api.get<ActivitiesResponse>('/activities/today');
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch today's activities");
    }

    console.log("getTodayActivities response data:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("getTodayActivities error:", error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || "Failed to fetch activities"
    );
    
    apiError.error = error.response?.data?.error;
    
    throw apiError;
  }
};

/**
 * Get activities by date range
 */
export const getActivitiesByDateRange = async (startDate: string, endDate: string, filters?: {
  status?: 'pending' | 'ongoing' | 'completed';
}): Promise<ActivitiesResponse> => {
  try {
    const params: any = { startDate, endDate };
    if (filters?.status) params.status = filters.status;
    
    const response = await api.get<ActivitiesResponse>('/activities', { params });
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch activities");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("getActivitiesByDateRange error:", error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || "Failed to fetch activities"
    );
    
    apiError.error = error.response?.data?.error;
    apiError.details = error.response?.data?.details;
    
    if (error.response?.status === 400) {
      if (error.response?.data?.error === 'DATE_RANGE_ERROR') {
        apiError.error = 'DATE_RANGE_ERROR';
      } else if (error.response?.data?.error === 'DATE_FORMAT_ERROR') {
        apiError.error = 'DATE_FORMAT_ERROR';
      }
    }
    
    throw apiError;
  }
};

/**
 * Update daily activity
 */
export const updateDailyActivity = async (activityId: string, data: UpdateActivityData): Promise<ActivityResponse> => {
  try {
    const response = await api.put<ActivityResponse>(`/activities/${activityId}`, data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update activity");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("updateDailyActivity error:", error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || "Failed to update activity"
    );
    
    apiError.error = error.response?.data?.error;
    apiError.details = error.response?.data?.details;
    
    if (error.response?.status === 404) {
      apiError.error = 'NOT_FOUND';
    } else if (error.response?.status === 400) {
      if (error.response?.data?.error === 'VALIDATION_ERROR') {
        apiError.error = 'VALIDATION_ERROR';
      } else if (error.response?.data?.error === 'UPDATE_ERROR') {
        apiError.error = 'UPDATE_ERROR';
      }
    } else if (error.response?.status === 403) {
      apiError.error = 'PERMISSION_DENIED';
    }
    
    throw apiError;
  }
};

/**
 * Delete daily activity
 */
export const deleteDailyActivity = async (activityId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.delete<{
      success: boolean;
      status: number;
      message: string;
    }>(`/activities/${activityId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete activity");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("deleteDailyActivity error:", error.response?.data || error.message);
    
    const apiError: ApiError = new Error(
      error.response?.data?.message || "Failed to delete activity"
    );
    
    apiError.error = error.response?.data?.error;
    
    if (error.response?.status === 404) {
      apiError.error = 'NOT_FOUND';
    } else if (error.response?.status === 403) {
      apiError.error = 'PERMISSION_DENIED';
    }
    
    throw apiError;
  }
};

/* =========================
   Export all functions
========================= */
export const activityApi = {
  createDailyActivity,
  getTodayActivities,
  getActivitiesByDateRange,
  updateDailyActivity,
  deleteDailyActivity,
};