// lib/admin.ts
import api from "./api";

/* =========================
   Types
========================= */

export const REGIONS = ['Lagos', 'Delta', 'Osun'] as const;
export const BRANCHES = {
  Lagos: ['HQ', 'Alimosho'],
  Delta: ['Warri'],
  Osun: ['Osun']
} as const;

export type Region = typeof REGIONS[number];
export type Branch = 'HQ' | 'Alimosho' | 'Warri' | 'Osun';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  _id: string;
  id_card: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: Department | string;
  position?: string;
  reportsTo?: any;
  region?: Region;
  branch?: Branch;
  is_active: boolean;
  isAdmin: boolean;
  isLocked: boolean;
  isVerified: boolean;
  loginAttempts?: number; 
  lockedAt?: string | null; 
  lockedReason?: string | null;
  lastCheckinAt?: string | null;
  lastCheckinRegion?: Region | null;
  lastCheckinBranch?: Branch | null;
  otp?: string | null;
  otpExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Add a helper function for location validation
// Add a helper function for location validation
export const validateLocation = (region: Region, branch: Branch): boolean => {
  // Check if region exists in BRANCHES
  if (!BRANCHES[region]) {
    return false;
  }
  
  const validBranches = BRANCHES[region] as readonly Branch[] | undefined;
  
  // If no branches defined for this region
  if (!validBranches || validBranches.length === 0) {
    return false;
  }
  
  // Check if branch is included in valid branches
  return validBranches.includes(branch);
};

// Add a more flexible validation function that accepts strings
export const isValidLocationCombo = (region: string, branch: string): boolean => {
  if (!region || !branch || region.trim() === '' || branch.trim() === '') {
    return false;
  }
  
  // Convert to proper types
  const regionType = region as Region;
  const branchType = branch as Branch;
  
  // Check if it's a valid Region type
  if (!REGIONS.includes(regionType)) {
    return false;
  }
  
  // Check if branch is valid for this region
  return validateLocation(regionType, branchType);
};

// Add a function to get available branches for a region
export const getBranchesForRegion = (region: Region): Branch[] => {
  const branches = BRANCHES[region] as readonly Branch[] | undefined;
  return branches ? Array.from(branches) : [];
};

export interface DailyActivity {
  _id: string;
  user: Employee | string;
  date: string;
  timeInterval: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface GetUsersResponse {
  success: boolean;
  status: number;
  message: string;
  count?: number;
  data: Employee[];
}

interface DepartmentResponse {
  success: boolean;
  status: number;
  message: string;
  data: Department;
}

interface DepartmentsResponse {
  success: boolean;
  status: number;
  message: string;
  count?: number;
  data: Department[];
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
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

interface ActivityResponse {
  success: boolean;
  status: number;
  message: string;
  data: DailyActivity;
}

/* =========================
   User Management API Calls
========================= */

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (): Promise<Employee[]> => {
  try {
    const res = await api.get("/users");
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch users");
    }
    
    return res.data.data || [];
  } catch (error: any) {
    console.error("getAllUsers error:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    });
    
    if (error?.response?.status === 403) {
      throw new Error("Insufficient permissions to view users");
    }
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch users"
    );
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<Employee> => {
  try {
    const res = await api.get<GetUsersResponse>(`/users/${userId}`);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch user");
    }
    
    return res.data.data[0];
  } catch (error: any) {
    console.error("getUserById error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch user"
    );
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (userId: string, data: Partial<Employee>): Promise<Employee> => {
  try {
    const res = await api.put<GetUsersResponse>(`/users/${userId}`, data);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update user");
    }
    
    return res.data.data[0];
  } catch (error: any) {
    console.error("updateUser error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update user"
    );
  }
};

/**
 * Delete user (Super Admin only)
 */
export const deleteUser = async (userId: string): Promise<{
  success: boolean;
  message: string;
  data: {
    id: string;
    id_card: string;
    email: string;
    name: string;
  };
  deletedBy: {
    id_card: string;
    name: string;
    role: string;
  };
}> => {
  try {
    const res = await api.delete<any>(`/users/${userId}`);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete user");
    }
    
    return res.data;
  } catch (error: any) {
    console.error("deleteUser error:", error.response?.data || error.message);
    
    // Handle specific error cases
    if (error?.response?.status === 403) {
      throw new Error("Only SUPER_ADMIN can delete users");
    } else if (error?.response?.status === 404) {
      throw new Error("User not found");
    } else if (error?.response?.status === 400) {
      if (error?.response?.data?.message?.includes('your own account')) {
        throw new Error("Cannot delete your own account");
      } else if (error?.response?.data?.message?.includes('SUPER_ADMIN')) {
        throw new Error("Cannot delete another SUPER_ADMIN account");
      }
    }
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete user"
    );
  }
};


/* =========================
   Department Management API Calls
========================= */

/**
 * Get all departments
 */
export const getAllDepartments = async (activeOnly: boolean = true): Promise<Department[]> => {
  try {
    const res = await api.get<DepartmentsResponse>(`/departments?activeOnly=${activeOnly}`);

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch departments");
    }

    return res.data.data;
  } catch (error: any) {
    console.error("getAllDepartments error:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    });

    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch departments"
    );
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (departmentId: string): Promise<Department> => {
  try {
    const res = await api.get<DepartmentResponse>(`/departments/${departmentId}`);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch department");
    }
    
    return res.data.data;
  } catch (error: any) {
    console.error("getDepartmentById error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch department"
    );
  }
};

/**
 * Create new department (Admin only)
 */
export const createDepartment = async (data: {
  name: string;
  code?: string;
  description?: string;
}): Promise<Department> => {
  try {
    const res = await api.post<any>('/departments', data); // Use 'any' temporarily for debugging
    
    console.log('[DEBUG] createDepartment raw response:', res.data);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to create department");
    }
    
    // Extract department data from response
    const responseData = res.data.data;
    
    // Debug the structure
    console.log('[DEBUG] Response data structure:', {
      type: typeof responseData,
      has_id: responseData._id !== undefined,
      has__id: responseData._id !== undefined,
      keys: Object.keys(responseData)
    });
    
    // Handle different response formats
    let departmentData: any;
    
    if (responseData && typeof responseData === 'object') {
      // If it's a Mongoose document, it might have _id instead of _id
      departmentData = {
        _id: responseData._id || responseData._id || '',
        name: responseData.name || '',
        code: responseData.code || '',
        description: responseData.description || '',
        isActive: responseData.isActive !== undefined ? responseData.isActive : true,
        createdAt: responseData.createdAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || new Date().toISOString()
      };
    } else {
      throw new Error("Invalid department response format");
    }
    
    // Validate required fields
    if (!departmentData._id) {
      throw new Error("Department created but missing ID");
    }
    
    console.log('[DEBUG] Processed department data:', departmentData);
    
    return departmentData;
  } catch (error: any) {
    console.error("createDepartment error:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
      fullError: error
    });
    
    // Provide more specific error messages
    if (error?.response?.status === 400) {
      if (error?.response?.data?.message?.includes('already exists')) {
        throw new Error("A department with this name or code already exists");
      }
      if (error?.response?.data?.message?.includes('required')) {
        throw new Error(error.response.data.message);
      }
    }
    
    if (error?.response?.status === 403) {
      throw new Error("Only SUPER_ADMIN can create departments");
    }
    
    if (error?.response?.status === 409) {
      throw new Error(error.response.data.message || "Department already exists");
    }
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create department"
    );
  }
};

/**
 * Update department (Admin only)
 */
export const updateDepartment = async (departmentId: string, data: Partial<Department>): Promise<Department> => {
  try {
    const res = await api.put<DepartmentResponse>(`/departments/${departmentId}`, data);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update department");
    }
    
    return res.data.data;
  } catch (error: any) {
    console.error("updateDepartment error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update department"
    );
  }
};

/**
 * Delete department (Admin only)
 */
export const deleteDepartment = async (departmentId: string): Promise<{
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    code: string;
  };
}> => {
  try {
    const res = await api.delete<{
      success: boolean;
      status: number;
      message: string;
      data: {
        id: string;
        name: string;
        code: string;
      };
    }>(`/departments/${departmentId}`);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete department");
    }
    
    return res.data;
  } catch (error: any) {
    console.error("deleteDepartment error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete department"
    );
  }
};

/**
 * Toggle department status (Admin only)
 */
export const toggleDepartmentStatus = async (departmentId: string): Promise<Department> => {
  try {
    const res = await api.patch<DepartmentResponse>(`/departments/${departmentId}/toggle-status`);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to toggle department status");
    }
    
    return res.data.data;
  } catch (error: any) {
    console.error("toggleDepartmentStatus error:", error.response?.data || error.message);
    
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to toggle department status"
    );
  }
};

/* =========================
   Daily Activities API Calls (Admin)
========================= */

/**
 * Get all activities (Admin only)
 */
export const getAllActivities = async (params?: {
  date?: string;
  status?: 'pending' | 'ongoing' | 'completed';
  region?: string;
  branch?: string;
  page?: number;
  limit?: number;
}): Promise<ActivitiesResponse> => {
  try {
    const res = await api.get<ActivitiesResponse>('/activities/all', { params });
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch activities");
    }
    
    return res.data;
  } catch (error: any) {
    console.error("getAllActivities error:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    });
    
    const apiError: any = new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch activities"
    );
    
    if (error?.response?.status === 403) {
      apiError.error = 'INSUFFICIENT_PERMISSIONS';
    } else if (error?.response?.status === 400) {
      apiError.error = 'VALIDATION_ERROR';
      apiError.details = error.response?.data?.details;
    }
    
    throw apiError;
  }
};

/**
 * Get activities by user (Admin only)
 */
export const getActivitiesByUser = async (userId: string, params?: {
  date?: string;
  status?: 'pending' | 'ongoing' | 'completed';
  page?: number;
  limit?: number;
}): Promise<ActivitiesResponse> => {
  try {
    // Clean up params before sending - remove empty/null/undefined values
    const cleanedParams: any = {};
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        
        // Only include values that are not empty/null/undefined
        if (value !== undefined && value !== null && value !== '' && 
            value !== 'null' && value !== 'undefined') {
          
          // For page and limit, always include them (they have defaults)
          if (key === 'page' || key === 'limit') {
            cleanedParams[key] = value;
          } 
          // For date and status, only include if they have meaningful values
          else if (key === 'date' && value.trim() !== '') {
            cleanedParams[key] = value;
          } 
          else if (key === 'status' && value.trim() !== '') {
            cleanedParams[key] = value;
          }
        }
      });
    }

    console.log('[DEBUG] getActivitiesByUser params:', { original: params, cleaned: cleanedParams });
    
    const res = await api.get<ActivitiesResponse>(`/activities/user/${userId}`, { 
      params: cleanedParams 
    });
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch user activities");
    }
    
    return res.data;
  } catch (error: any) {
    console.error("getActivitiesByUser error:", error.response?.data || error.message);
    
    const apiError: any = new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch user activities"
    );
    
    if (error?.response?.status === 403) {
      apiError.error = 'INSUFFICIENT_PERMISSIONS';
    } else if (error?.response?.status === 404) {
      apiError.error = 'USER_NOT_FOUND';
    } else if (error?.response?.status === 400) {
      apiError.error = 'VALIDATION_ERROR';
      apiError.details = error.response?.data?.details;
    }
    
    throw apiError;
  }
};

/* =========================
   Export all functions
========================= */
export const adminApi = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getAllActivities,
  getActivitiesByUser,
};