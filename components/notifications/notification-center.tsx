"use client"

import { useState, useEffect } from "react"
import { StorageService, type Notification } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCheck, AlertCircle } from "lucide-react"

interface NotificationCenterProps {
  userId: string
  onNotificationsUpdate?: () => void
}

export default function NotificationCenter({ userId, onNotificationsUpdate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadNotifications = () => {
    const notifs = StorageService.getNotifications(userId)
    setNotifications(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const markAsRead = (notificationId: string) => {
    try {
      StorageService.markNotificationAsRead(notificationId)
    } catch (e) {
      console.warn("markAsRead failed", e)
    }
    loadNotifications()
    onNotificationsUpdate?.()
  }

  const deleteNotification = (notificationId: string) => {
  try {
    // Try StorageService helper if available
    // @ts-ignore
    if (typeof StorageService.deleteNotification === "function") {
      // @ts-ignore
      StorageService.deleteNotification(notificationId)
    } else {
      // Fallback: update raw storage key used by StorageService
      const all = StorageService.getNotifications(userId) // ← Add userId here
      const filtered = all.filter((n) => n.id !== notificationId)
      try {
        localStorage.setItem("app_notifications_v1", JSON.stringify(filtered))
      } catch (err) {
        console.warn("Failed to persist notifications via localStorage fallback", err)
      }
    }
  } catch (err) {
    console.warn("deleteNotification failed", err)
  }
  loadNotifications()
  onNotificationsUpdate?.()
}

  const markAllAsRead = () => {
    notifications.forEach((notif) => {
      if (!notif.read) {
        try {
          StorageService.markNotificationAsRead(notif.id)
        } catch (e) {
          console.warn("markAllAsRead item failed", e)
        }
      }
    })
    loadNotifications()
    onNotificationsUpdate?.()
  }

  const clearAll = () => {
  try {
    // Prefer a batch removal via StorageService if available
    // @ts-ignore
    if (typeof StorageService.clearNotificationsForUser === "function") {
      // @ts-ignore
      StorageService.clearNotificationsForUser(userId)
    } else {
      // Fallback: remove all notifications for this user and persist
      const all = StorageService.getNotifications(userId) // ← Add userId here
      const remaining = all.filter((n) => n.userId !== userId)
      try {
        localStorage.setItem("app_notifications_v1", JSON.stringify(remaining))
      } catch (err) {
        console.warn("clearAll fallback failed", err)
      }
    }
  } catch (err) {
    console.warn("clearAll failed", err)
  }
  loadNotifications()
  onNotificationsUpdate?.()
}

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800">Notifications</h3>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2 text-xs text-slate-500 hover:text-red-600"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No notifications</p>
            <p className="text-slate-500 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  !notif.read ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? "font-medium text-slate-800" : "text-slate-600"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notif.id)}
                        className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notif.id)}
                      className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}