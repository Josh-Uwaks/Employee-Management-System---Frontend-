"use client"

import { DailyActivity } from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, MapPin, Building2, Activity, FileText, AlertCircle } from "lucide-react"

interface ActivityDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: DailyActivity | null
}

export default function ActivityDetailsDialog({
  open,
  onOpenChange,
  activity
}: ActivityDetailsDialogProps) {
  if (!activity) return null

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
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800 border-gray-200'
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const user = typeof activity.user === 'object' ? activity.user : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Activity Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about the logged activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Activity Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(activity.date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Time Slot:</span>
                  <span>{activity.timeInterval}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 mt-1" />
                  <div>
                    <span className="font-medium block mb-1">Description:</span>
                    <p className="text-slate-700">{activity.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                
                {activity.category && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline">
                      {activity.category}
                    </Badge>
                  </div>
                )}
                
                {activity.priority && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Priority:</span>
                    <Badge className={getPriorityColor(activity.priority)}>
                      {activity.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee Information */}
          {user && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-slate-800">Employee Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Name:</span>
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ID Card:</span>
                    <Badge variant="outline">{user.id_card}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Role:</span>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {user.region && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Region:</span>
                      <span>{user.region}</span>
                    </div>
                  )}
                  
                  {user.branch && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Branch:</span>
                      <span>{user.branch}</span>
                    </div>
                  )}
                  
                  {user.department && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Department:</span>
                      <span>
                        {typeof user.department === 'object' 
                          ? user.department.name 
                          : user.department}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-slate-800">Timeline</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Created:</span>
                <span>{formatTime(activity.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Last Updated:</span>
                <span>{formatTime(activity.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {user && user.email && (
              <Button onClick={() => {
                window.location.href = `mailto:${user.email}?subject=Regarding your activity on ${formatDate(activity.date)}`
              }}>
                Contact Employee
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}