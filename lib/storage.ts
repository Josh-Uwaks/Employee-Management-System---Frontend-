// Client-side data storage utilities using localStorage
// All data is JSON-serialized for localStorage

export interface User {
  id: string
  idNumber: string
  name: string
  email: string
  role: "admin" | "employee"
  password: string
  createdAt: string
}

export interface ActivityEntry {
  id: string
  description: string
  status: "ongoing" | "pending" | "completed" // Add "pending" to the status options
  timestamp: string
  changeCount?: number // Add optional changeCount
}

export interface ActivityLog {
  id: string
  employeeId: string
  date: string
  hour: number
  slotIndex: number // ADDED: slotIndex property
  status: "present" | "absent" | "pending" | "empty" // ADDED: "empty" to status options
  activities?: ActivityEntry[]
  timestamp: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface MissedActivity {
  id: string
  employeeId: string
  date: string
  hour: number
  notified: boolean
  createdAt: string
}

// Keys
const USERS_KEY = "app_users_v1"
const CURRENT_USER_KEY = "app_current_user_v1"
const ACTIVITY_LOGS_KEY = "app_activity_logs_v1"
const NOTIFICATIONS_KEY = "app_notifications_v1"
const MISSED_ACTIVITIES_KEY = "app_missed_activities_v1"

// Safe localStorage wrapper (handles SSR / private mode)
const safeLocalStorage = {
  getItem(key: string) {
    try {
      if (typeof window === "undefined") return null
      return window.localStorage.getItem(key)
    } catch (err) {
      console.warn("safeLocalStorage.getItem error", err)
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window === "undefined") return
      window.localStorage.setItem(key, value)
    } catch (err) {
      console.warn("safeLocalStorage.setItem error", err)
    }
  },
  removeItem(key: string) {
    try {
      if (typeof window === "undefined") return
      window.localStorage.removeItem(key)
    } catch (err) {
      console.warn("safeLocalStorage.removeItem error", err)
    }
  },
}

// Ensure storage seeded with demo users
function initializeStorage() {
  const raw = safeLocalStorage.getItem(USERS_KEY)
  if (raw) return

  const now = new Date().toISOString()
  const seed: User[] = [
    {
      id: "1",
      idNumber: "KE175",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "employee",
      password: "password123",
      createdAt: now,
    },
    {
      id: "2",
      idNumber: "KE176",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "employee",
      password: "password123",
      createdAt: now,
    },
    {
      id: "3",
      idNumber: "KE177",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      role: "employee",
      password: "password123",
      createdAt: now,
    },
    {
      id: "4",
      idNumber: "AD001",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      password: "admin123",
      createdAt: now,
    },
  ]

  safeLocalStorage.setItem(USERS_KEY, JSON.stringify(seed))
  console.log("initializeStorage: seeded default users", seed.map(u => ({ idNumber: u.idNumber, role: u.role })))

  // Verify the data was stored correctly
  const stored = safeLocalStorage.getItem(USERS_KEY)
  console.log("initializeStorage() - verified stored data:", stored)
}

// Initialize activity logs storage
function initializeActivityLogs() {
  const raw = safeLocalStorage.getItem(ACTIVITY_LOGS_KEY)
  if (raw) return

  // Start with empty activity logs
  safeLocalStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify([]))
}

// Initialize notifications storage
function initializeNotifications() {
  const raw = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
  if (raw) return

  // Start with empty notifications
  safeLocalStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]))
}

function initializeMissedActivities() {
  const raw = safeLocalStorage.getItem(MISSED_ACTIVITIES_KEY)
  if (raw) return
  safeLocalStorage.setItem(MISSED_ACTIVITIES_KEY, JSON.stringify([]))
}

export const StorageService = {
  // User Management
  getUsers(): User[] {
    initializeStorage()
    const data = safeLocalStorage.getItem(USERS_KEY)
    const users: User[] = data ? JSON.parse(data) : []

    // DEBUG: Log the retrieved users to verify data
    console.log("StorageService.getUsers() retrieved:", users)
    return users
  },

  saveUsers(users: User[]) {
    safeLocalStorage.setItem(USERS_KEY, JSON.stringify(users))
    console.log("StorageService.saveUsers(): saved", users.map(u => ({ idNumber: u.idNumber, role: u.role })))
  },

  addUser(user: Omit<User, "id" | "createdAt">) {
    const users = this.getUsers()
    const id = String(Date.now())
    const createdAt = new Date().toISOString()
    const newUser: User = { id, createdAt, ...user }
    users.push(newUser)
    this.saveUsers(users)
    console.log("StorageService.addUser():", { idNumber: newUser.idNumber })
    return newUser
  },

  getUserByIdNumber(idNumber: string): User | undefined {
    const users = this.getUsers()
    return users.find(u => u.idNumber === idNumber)
  },

  getUserById(id: string): User | undefined {
    const users = this.getUsers()
    return users.find(u => u.id === id)
  },

  updateUser(id: string, patch: Partial<Omit<User, "id" | "createdAt">>) {
    const users = this.getUsers()
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return null
    users[idx] = { ...users[idx], ...patch }
    this.saveUsers(users)
    console.log("StorageService.updateUser():", { id })
    return users[idx]
  },

  deleteUser(id: string) {
    const users = this.getUsers()
    const filtered = users.filter(u => u.id !== id)
    this.saveUsers(filtered)
    console.log("StorageService.deleteUser():", { id })
  },

  // Current User Session
  setCurrentUser(user: User) {
    safeLocalStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  },

  getCurrentUser(): User | null {
    const data = safeLocalStorage.getItem(CURRENT_USER_KEY)
    return data ? JSON.parse(data) : null
  },

  logout() {
    safeLocalStorage.removeItem(CURRENT_USER_KEY)
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem("otp_idNumber")
      }
    } catch (error) {
      console.warn('sessionStorage access failed:', error)
    }
  },

  // Activity Logs Management
  getActivityLogs(): ActivityLog[] {
    initializeActivityLogs()
    const data = safeLocalStorage.getItem(ACTIVITY_LOGS_KEY)
    const logs: ActivityLog[] = data ? JSON.parse(data) : []
    return logs
  },

  saveActivityLogs(logs: ActivityLog[]) {
    safeLocalStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs))
  },

  logActivity(
    employeeId: string, 
    date: string, 
    hour: number, 
    slotIndex: number, // ADDED: slotIndex parameter
    status: "present" | "absent" | "pending" | "empty", // UPDATED: added "empty"
    activities?: ActivityEntry[]
  ) {
    const logs = this.getActivityLogs()

    // Remove existing log for this employee/date/slotIndex
    const filteredLogs = logs.filter(log =>
      !(log.employeeId === employeeId && log.date === date && log.slotIndex === slotIndex)
    )

    const logId = String(Date.now())
    const timestamp = new Date().toISOString()

    const newLog: ActivityLog = {
      id: logId,
      employeeId,
      date,
      hour,
      slotIndex, // ADDED: slotIndex
      status,
      activities: activities || [],
      timestamp
    }

    filteredLogs.push(newLog)
    this.saveActivityLogs(filteredLogs)
    console.log("StorageService.logActivity():", { employeeId, date, hour, slotIndex, status, activitiesCount: activities?.length || 0 })
    return newLog
  },

  getEmployeeActivity(employeeId: string, date: string): ActivityLog[] {
    const logs = this.getActivityLogs()
    return logs.filter(log => log.employeeId === employeeId && log.date === date)
  },

  getActivitySummary(employeeId: string, date: string) {
    const logs = this.getEmployeeActivity(employeeId, date)
    const present = logs.filter(log => log.status === "present").length
    const absent = logs.filter(log => log.status === "absent").length
    const pending = logs.filter(log => log.status === "pending").length
    const empty = logs.filter(log => log.status === "empty").length
    const totalHours = 24 // Assuming 24-hour day
    const withActivities = logs.length
    const currentHour = new Date().getHours()
    const locked = totalHours - currentHour - 1 // Future hours are locked
    
    return {
      present,
      absent,
      pending,
      empty,
      total: logs.length,
      withActivities,
      locked: Math.max(0, locked)
    }
  },

  // Notifications Management
  getNotifications(userId: string): Notification[] {
    initializeNotifications()
    const data = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
    const allNotifications: Notification[] = data ? JSON.parse(data) : []
    
    // Filter notifications for the specific user
    const userNotifications = allNotifications.filter(notification => 
      notification.userId === userId
    )
    
    // Sort by creation date (newest first)
    return userNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  saveNotifications(notifications: Notification[]) {
    safeLocalStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  },

  addNotification(notification: Omit<Notification, "id" | "createdAt">) {
    const notifications = this.getNotifications(notification.userId)
    const id = String(Date.now())
    const createdAt = new Date().toISOString()
    const newNotification: Notification = { id, createdAt, ...notification }
    
    // Get all notifications and add the new one
    const allNotificationsData = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
    const allNotifications: Notification[] = allNotificationsData ? JSON.parse(allNotificationsData) : []
    allNotifications.push(newNotification)
    
    this.saveNotifications(allNotifications)
    console.log("StorageService.addNotification():", { userId: notification.userId, title: notification.title })
    return newNotification
  },

  markNotificationAsRead(notificationId: string) {
    const allNotificationsData = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
    if (!allNotificationsData) return null
    
    const allNotifications: Notification[] = JSON.parse(allNotificationsData)
    const notificationIndex = allNotifications.findIndex(n => n.id === notificationId)
    
    if (notificationIndex === -1) return null
    
    allNotifications[notificationIndex] = {
      ...allNotifications[notificationIndex],
      read: true
    }
    
    this.saveNotifications(allNotifications)
    console.log("StorageService.markNotificationAsRead():", { notificationId })
    return allNotifications[notificationIndex]
  },

  markAllNotificationsAsRead(userId: string) {
    const allNotificationsData = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
    if (!allNotificationsData) return
    
    const allNotifications: Notification[] = JSON.parse(allNotificationsData)
    const updatedNotifications = allNotifications.map(notification => 
      notification.userId === userId ? { ...notification, read: true } : notification
    )
    
    this.saveNotifications(updatedNotifications)
    console.log("StorageService.markAllNotificationsAsRead():", { userId })
  },

  deleteNotification(notificationId: string) {
    const allNotificationsData = safeLocalStorage.getItem(NOTIFICATIONS_KEY)
    if (!allNotificationsData) return
    
    const allNotifications: Notification[] = JSON.parse(allNotificationsData)
    const filteredNotifications = allNotifications.filter(n => n.id !== notificationId)
    
    this.saveNotifications(filteredNotifications)
    console.log("StorageService.deleteNotification():", { notificationId })
  },

  // Create sample notifications for demo
  createSampleNotifications(userId: string) {
    const sampleNotifications: Omit<Notification, "id" | "createdAt">[] = [
      {
        userId,
        title: "Welcome to Kadick HR System",
        message: "Welcome to the employee activity tracking system. Start logging your daily activities.",
        type: "info",
        read: false
      },
      {
        userId,
        title: "Activity Reminder",
        message: "Remember to log your activities for each hour of the workday.",
        type: "warning",
        read: false
      },
      {
        userId,
        title: "System Update",
        message: "New features added: Real-time activity tracking and performance analytics.",
        type: "success",
        read: true
      }
    ]

    sampleNotifications.forEach(notification => {
      this.addNotification(notification)
    })
  },

  // Hour locking functionality
  isHourLocked(hour: number): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];
    
    // For demo purposes, allow logging for current hour and past hours only
    // Future hours are locked
    return hour > currentHour;
  },

  // Get current hour for reference
  getCurrentHour(): number {
    return new Date().getHours();
  },

  // Get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  // Helper for clearing all app data (dev)
  clearAll() {
    safeLocalStorage.removeItem(USERS_KEY)
    safeLocalStorage.removeItem(CURRENT_USER_KEY)
    safeLocalStorage.removeItem(ACTIVITY_LOGS_KEY)
    safeLocalStorage.removeItem(NOTIFICATIONS_KEY)
    safeLocalStorage.removeItem(MISSED_ACTIVITIES_KEY)
    console.log("StorageService.clearAll(): cleared storage keys")
  },
}

function getRawMissedActivities(): MissedActivity[] {
  initializeMissedActivities()
  const data = safeLocalStorage.getItem(MISSED_ACTIVITIES_KEY)
  return data ? JSON.parse(data) : []
}

function saveRawMissedActivities(items: MissedActivity[]) {
  safeLocalStorage.setItem(MISSED_ACTIVITIES_KEY, JSON.stringify(items))
}

export const ActivityService = {
  canLogActivity(hour: number, date: string): boolean {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentHour = now.getHours()
    
    // Cannot log for future hours
    if (date > currentDate) return false
    if (date === currentDate && hour > currentHour) return false
    
    // Cannot edit past hours (only current hour can be modified)
    if (date < currentDate) return false
    if (date === currentDate && hour < currentHour) return false
    
    return true
  },

  checkMissedActivities() {
    const employees = StorageService.getUsers().filter(u => u.role === 'employee')
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()
    
    employees.forEach(employee => {
      for (let hour = 0; hour < currentHour; hour++) {
        const logs = StorageService.getEmployeeActivity(employee.id, today)
        const hasLog = logs.some(log => log.hour === hour)
        
        if (!hasLog) {
          this.recordMissedActivity(employee.id, today, hour)
        }
      }
    })
  },

  recordMissedActivity(employeeId: string, date: string, hour: number) {
    const missedActivities = this.getMissedActivities()
    const existing = missedActivities.find(
      m => m.employeeId === employeeId && m.date === date && m.hour === hour
    )
    
    if (!existing) {
      const newMissed: MissedActivity = {
        id: Date.now().toString(),
        employeeId,
        date,
        hour,
        notified: false,
        createdAt: new Date().toISOString()
      }
      
      missedActivities.push(newMissed)
      this.saveMissedActivities(missedActivities)
      this.notifyAdmin(employeeId, date, hour)
    }
  },

  notifyAdmin(employeeId: string, date: string, hour: number) {
    const employee = StorageService.getUserById(employeeId)
    const admins = StorageService.getUsers().filter(u => u.role === 'admin')
    
    admins.forEach(admin => {
      StorageService.addNotification({
        userId: admin.id,
        title: "Missed Activity Log",
        message: `${employee?.name} missed activity log for ${hour}:00 on ${date}`,
        type: "warning",
        read: false,
        actionUrl: `/admin/employee/${employeeId}`
      })
    })
  },

  // Missed activities persistence helpers
  getMissedActivities(): MissedActivity[] {
    return getRawMissedActivities()
  },

  saveMissedActivities(items: MissedActivity[]) {
    saveRawMissedActivities(items)
  }
}