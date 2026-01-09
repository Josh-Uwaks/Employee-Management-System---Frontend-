// activity-table.tsx - MODERN PROFESSIONAL REDESIGN
// Replace your existing activity-table.tsx with this code

import React, { useState } from "react";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ActivityEntry } from "@/lib/storage"
import { StorageService } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// --- INTERFACES ---

interface ActivityTableEntryHalfHour {
  slotIndex: number
  timeLabel: string
  status: "present" | "absent" | "pending" | "empty"
  activities: ActivityEntry[]
}

interface ActivityTableProps {
  data: ActivityTableEntryHalfHour[]
  selectedDate: string
  employeeId: string
  onActivityUpdate: () => void
  readOnly: boolean
  ACTION_BUTTON_CLASS: string
  ACTION_BUTTON_DEFAULT: string
}

// --- COMPONENT START ---

export default function ActivityTable({ 
  data, 
  selectedDate, 
  employeeId, 
  onActivityUpdate, 
  readOnly, 
  ACTION_BUTTON_CLASS, 
  ACTION_BUTTON_DEFAULT 
}: ActivityTableProps) {
  
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set())

  const toggleSlot = (slotIndex: number) => {
    setExpandedSlots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(slotIndex)) {
        newSet.delete(slotIndex)
      } else {
        newSet.add(slotIndex)
      }
      return newSet
    })
  }
  
  // --- UTILITY FUNCTIONS ---

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'present':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: 'Present'
        }
      case 'absent':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertCircle,
          label: 'Absent'
        }
      case 'pending':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Circle,
          label: 'Pending'
        }
      case 'empty':
        return {
          color: 'bg-slate-50 text-slate-500 border-slate-200',
          icon: Circle,
          label: 'Empty'
        }
      default:
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Circle,
          label: status
        }
    }
  }

  const getActivityStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2
        }
      case 'pending':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock
        }
      case 'ongoing':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Circle
        }
      default:
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: Circle
        }
    }
  }

  const canChangeStatus = (currentStatus: "ongoing" | "pending" | "completed", changeCount: number): boolean => {
    return changeCount < 2 && currentStatus !== 'completed' && !readOnly
  }

  const getNextStatus = (currentStatus: "ongoing" | "pending" | "completed"): "ongoing" | "pending" | "completed" => {
    const statusFlow: Record<string, "ongoing" | "pending" | "completed"> = {
      'ongoing': 'pending',
      'pending': 'completed',
      'completed': 'completed'
    }
    return statusFlow[currentStatus] || currentStatus
  }

  // --- ACTIVITY STATUS UPDATE ---

  const updateActivityStatus = (slotIndex: number, activityId: string, currentStatus: "ongoing" | "pending" | "completed", changeCount: number) => {
    if (!canChangeStatus(currentStatus, changeCount)) return

    const logs = StorageService.getEmployeeActivity(employeeId, selectedDate)
    const slotLog = logs.find(log => log.slotIndex === slotIndex)
    if (!slotLog) return

    const updatedActivities: ActivityEntry[] = (slotLog.activities || []).map(activity => 
      activity.id === activityId 
        ? { 
            ...activity, 
            status: getNextStatus(currentStatus),
            changeCount: (activity.changeCount || 0) + 1
          }
        : activity
    )

    StorageService.logActivity(
      employeeId,
      selectedDate,
      slotLog.hour,       
      slotIndex,          
      slotLog.status,
      updatedActivities
    )

    onActivityUpdate()
  }

  // --- RENDER ---

  return (
    <div className="space-y-6">
      {/* Modern Table Container */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        {data.map((entry) => {
          const isExpanded = expandedSlots.has(entry.slotIndex)
          const statusConfig = getStatusConfig(entry.status)
          const StatusIcon = statusConfig.icon
          const hasActivities = entry.activities.length > 0

          return (
            <div 
              key={entry.slotIndex} 
              className={cn(
                "border-b border-slate-100 last:border-b-0 transition-all duration-200",
                entry.status === 'absent' && "bg-red-50/30"
              )}
            >
              {/* Main Row */}
              <div className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleSlot(entry.slotIndex)}
                  disabled={!hasActivities}
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                    hasActivities 
                      ? "hover:bg-slate-200 text-slate-600" 
                      : "text-slate-300 cursor-not-allowed"
                  )}
                >
                  {hasActivities ? (
                    isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                {/* Time Slot */}
                <div className="shrink-0 w-32">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-sm text-slate-700">
                      {entry.timeLabel}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-semibold border flex items-center gap-1.5 px-3 py-1",
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Activity Count */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {hasActivities ? (
                    <>
                      <span className="text-sm text-slate-600">
                        {entry.activities.length} {entry.activities.length === 1 ? 'activity' : 'activities'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1">
                          {entry.activities.slice(0, 3).map((activity) => {
                            const activityConfig = getActivityStatusConfig(activity.status)
                            return (
                              <div
                                key={activity.id}
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  activityConfig.color.split(' ')[0]
                                )}
                              />
                            )
                          })}
                          {entry.activities.length > 3 && (
                            <span className="text-xs text-slate-400 ml-1">
                              +{entry.activities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 italic">
                      No activities logged
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Activities Section */}
              {isExpanded && hasActivities && (
                <div className="px-4 pb-4 bg-slate-50/50">
                  <div className="space-y-3 pt-2">
                    {entry.activities.map((activity, index) => {
                      const activityConfig = getActivityStatusConfig(activity.status)
                      const ActivityStatusIcon = activityConfig.icon
                      const canChange = canChangeStatus(activity.status, activity.changeCount || 0)
                      const nextStatus = getNextStatus(activity.status)

                      return (
                        <div
                          key={activity.id}
                          className={cn(
                            "rounded-lg border p-4 transition-all duration-200",
                            canChange 
                              ? "bg-white border-red-200 shadow-sm hover:shadow-md" 
                              : "bg-white/50 border-slate-200"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Activity Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start gap-2">
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "font-semibold border flex items-center gap-1.5 px-2.5 py-0.5 text-xs",
                                    activityConfig.color
                                  )}
                                >
                                  <ActivityStatusIcon className="w-3 h-3" />
                                  {activity.status}
                                </Badge>
                                <p className="text-sm font-medium text-slate-700 flex-1">
                                  {activity.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className={cn(
                                  "font-semibold",
                                  (activity.changeCount || 0) >= 2 ? "text-amber-600" : "text-slate-500"
                                )}>
                                  Changes: {(activity.changeCount || 0)}/2
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="shrink-0">
                              <Button
                                size="sm"
                                className={cn(
                                  "w-full sm:w-auto text-xs h-9 px-4 font-semibold transition-all duration-200",
                                  canChange ? ACTION_BUTTON_CLASS : ACTION_BUTTON_DEFAULT
                                )}
                                disabled={!canChange}
                                onClick={() => updateActivityStatus(
                                  entry.slotIndex, 
                                  activity.id, 
                                  activity.status, 
                                  activity.changeCount || 0
                                )}
                              >
                                {readOnly ? 'View Only' : 
                                 nextStatus === 'completed' && activity.status === 'completed' ? 'Completed' : 
                                 !canChange ? 'Locked' : `Mark ${nextStatus}`}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Enhanced Legend */}
      <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
        <h4 className="text-sm font-bold text-slate-700 mb-4">Legend</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slot Status */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Slot Status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-700">Present - Activities logged</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-slate-700">Absent - No activity logged</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-slate-700">Pending - Awaiting completion</span>
              </div>
            </div>
          </div>

          {/* Activity Status */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Activity Status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="text-xs text-slate-700">Ongoing - In progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-slate-700">Pending - Paused/Waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-700">Completed - Finished</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Change Info */}
        <div className="mt-4 pt-4 border-t border-slate-300">
          <p className="text-xs text-slate-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
            <span>Each activity can be updated up to 2 times. Status progression: Ongoing → Pending → Completed</span>
          </p>
        </div>
      </div>
    </div>
  )
}