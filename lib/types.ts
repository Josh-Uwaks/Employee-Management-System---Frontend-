export type UserRole = "admin" | "employee"

export interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  } | null
  loading: boolean
  error: string | null
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  pendingToday: number
}

export interface ActivityLog {
  id: string
  employeeId: string
  date: string
  hour: number
  status: "present" | "absent" | "pending"
  timestamp: string
}