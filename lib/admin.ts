import api from "./api";

/* =========================
   Types
========================= */

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
  region?: string;
  branch?: string;
  is_active: boolean;
  isAdmin: boolean;
  isLocked: boolean;
  isVerified: boolean;
  loginAttempts?: number; 
  lockedAt?: string | null; 
  lockedReason?: string | null;
  lastCheckinAt?: string | null;
  lastCheckinRegion?: string | null;
  lastCheckinBranch?: string | null;
  otp?: string | null;
  otpExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

/* =========================
   User Management API Calls
========================= */

/**
 * Get all users (Admin only)
 */
// Update getAllUsers to handle backend response:
export const getAllUsers = async (): Promise<Employee[]> => {
  try {
    const res = await api.get("/users");
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch users");
    }
    
    // Backend returns { success, status, message, data: users[] }
    return res.data.data || [];
  } catch (error: any) {
    console.error("getAllUsers error:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    });
    
    // Handle specific permission errors for LINE_MANAGER
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
    const res = await api.post<DepartmentResponse>('/departments', data);
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to create department");
    }
    
    return res.data.data;
  } catch (error: any) {
    console.error("createDepartment error:", error.response?.data || error.message);
    
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
   Export all functions
========================= */
export const adminApi = {
  getAllUsers,
  getUserById,
  updateUser,
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
};