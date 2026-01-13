"use client"

import { DailyActivity, getDepartmentById } from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, MapPin, Mail, X, History, FileText, Hash, Building2, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"

interface ActivityDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: DailyActivity | null
  getStatusColor?: (status: string) => string
}

export default function ActivityDetailsDialog({
  open,
  onOpenChange,
  activity,
  getStatusColor
}: ActivityDetailsDialogProps) {
  const [departmentDetails, setDepartmentDetails] = useState<any>(null)
  const [loadingDepartment, setLoadingDepartment] = useState(false)

  // Fetch department details when activity changes
  useEffect(() => {
    if (!activity || !open) {
      setDepartmentDetails(null)
      return
    }

    const user = typeof activity.user === 'object' ? activity.user : null
    if (!user || !user.department) {
      setDepartmentDetails(null)
      return
    }

    // If department is already an object with name, use it
    if (typeof user.department === 'object' && user.department.name) {
      setDepartmentDetails(user.department)
      return
    }

    // If department is a string ID, fetch it using existing API function
    if (typeof user.department === 'string') {
      fetchDepartmentDetails(user.department)
    }
  }, [activity, open])

  const fetchDepartmentDetails = async (departmentId: string) => {
    try {
      setLoadingDepartment(true)
      const department = await getDepartmentById(departmentId)
      setDepartmentDetails(department)
    } catch (error) {
      console.error('Failed to fetch department details:', error)
      // If fetch fails, at least show the ID
      setDepartmentDetails({ _id: departmentId, name: `Department (${departmentId})` })
    } finally {
      setLoadingDepartment(false)
    }
  }

  if (!activity) return null

  console.log("Rendering ActivityDetailsDialog for activity:", activity)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColorFn = getStatusColor || ((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'ongoing': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  })

  const user = typeof activity.user === 'object' ? activity.user : null

  // Get department name from either the fetched details or the object
  const getDepartmentName = () => {
    if (!user || !user.department) return "Not specified"
    
    if (typeof user.department === 'object') {
      return user.department.name || "Unknown Department"
    }
    
    // If we have fetched department details
    if (departmentDetails) {
      return departmentDetails.name
    }
    
    // If loading
    if (loadingDepartment) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </span>
      )
    }
    
    // Fallback - show ID briefly while loading
    return `Department (${user.department.substring(0, 8)}...)`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-[#ec3338]" />

        <DialogHeader className="px-8 pt-8 pb-6 flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Activity Details
              </DialogTitle>
              <Badge variant="outline" className={`${getStatusColorFn(activity.status)} border capitalize px-2.5 py-0.5`}>
                {activity.status}
              </Badge>
            </div>
            <DialogDescription className="text-slate-500">
              Viewing full log and assignment information
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Logistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
              <Calendar className="h-5 w-5 text-[#ec3338] mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(activity.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
              <Clock className="h-5 w-5 text-[#ec3338] mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Slot</p>
                <p className="text-sm font-semibold text-slate-900">{activity.timeInterval}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Description</h3>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-700 leading-relaxed text-sm antialiased">
                {activity.description}
              </p>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Employee Information */}
          {user && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Assigned Employee</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                    <p className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Number</p>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-mono font-medium text-slate-600">{user.id_card}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {(user.region || user.branch) && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Location</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-700">{user.region} {user.branch && `• ${user.branch}`}</span>
                      </div>
                    </div>
                  )}
                  {user.department && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {getDepartmentName()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Audit */}
          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <History className="h-3 w-3" />
                <span>Created: {formatTime(activity.createdAt)}</span>
              </div>
              <span>Updated: {formatTime(activity.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {user?.email && (
          <div className="px-8 py-5 bg-slate-50 border-t flex justify-end">
            <Button
              onClick={() => {
                window.location.href = `mailto:${user.email}?subject=Regarding your activity on ${formatDate(activity.date)}`
              }}
              className="bg-[#ec3338] hover:bg-[#d12e32] text-white px-6 shadow-lg shadow-red-100 transition-all active:scale-95"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Employee
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}