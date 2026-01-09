"use client"

import { useState, useEffect } from "react"
import { useActivities } from "@/context/activitiesContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send, AlertTriangle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/lib/toast"

interface ActivityLoggerProps {
  selectedDate: string
  onActivityLogged?: () => void
  readOnly?: boolean
}

export default function ActivityLogger({ selectedDate, onActivityLogged, readOnly = false }: ActivityLoggerProps) {
  const { createPersonalActivity, personalActivitiesLoading } = useActivities()
  
  const [activityDescription, setActivityDescription] = useState("")
  const [activityStatus, setActivityStatus] = useState<"ongoing" | "pending" | "completed">("ongoing")
  const [timeInterval, setTimeInterval] = useState("")
  const [timeToNextSlot, setTimeToNextSlot] = useState<number>(0)
  const [currentSlot, setCurrentSlot] = useState(0)

  // Define work hours (8am to 5:30pm in half-hour slots)
  const WORK_SLOT_START = 16 // 8:00 AM
  const WORK_SLOT_END = 35 // 5:30 PM

  useEffect(() => {
    updateCurrentSlot()
    updateCountdown()
    
    const timer = setInterval(() => {
      updateCurrentSlot()
      updateCountdown()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Set default time interval based on current slot
    const hour = Math.floor(currentSlot / 2)
    const minute = (currentSlot % 2) * 30
    const nextHour = Math.floor((currentSlot + 1) / 2) % 24
    const nextMinute = ((currentSlot + 1) % 2) * 30
    
    const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    const end = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
    
    setTimeInterval(`${start} - ${end}`)
  }, [currentSlot])

  const updateCurrentSlot = () => {
    const now = new Date()
    const currentHalfHourIndex = now.getHours() * 2 + Math.floor(now.getMinutes() / 30)
    setCurrentSlot(currentHalfHourIndex)
  }

  const updateCountdown = () => {
    const now = new Date()
    const currentMinutes = now.getMinutes()
    const currentSeconds = now.getSeconds()
    
    const minutesUntilNextSlot = 30 - (currentMinutes % 30)
    const secondsUntilNextSlot = (minutesUntilNextSlot * 60) - currentSeconds
    
    setTimeToNextSlot(secondsUntilNextSlot)
  }

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const submitActivityEntry = async () => {
    if (!timeInterval.trim() || !activityDescription.trim()) {
      showToast.error("Time interval and description are required")
      return
    }

    try {
      // Validate time interval format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(timeInterval)) {
        showToast.error("Time interval must be in format HH:MM - HH:MM")
        return
      }

      // Validate start time < end time
      const [start, end] = timeInterval.split('-').map(t => t.trim())
      if (start >= end) {
        showToast.error("Start time must be before end time")
        return
      }

      await createPersonalActivity({
        timeInterval,
        description: activityDescription.trim(),
        status: activityStatus
      })

      setActivityDescription("")
      setActivityStatus("ongoing")
      showToast.success("Activity created successfully")
      
      if (onActivityLogged) {
        onActivityLogged()
      }
    } catch (error) {
      // Error handling is done in context
      console.error("Error creating activity:", error)
    }
  }

  const isWithinWorkHours = currentSlot >= WORK_SLOT_START && currentSlot < WORK_SLOT_END
  const isToday = selectedDate === new Date().toISOString().split("T")[0]
  const canCreateActivity = isToday && isWithinWorkHours && !readOnly

  return (
    <Card className="border-slate-200/60 shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Send className="w-5 h-5 text-red-600" />
          Activity Logger
        </CardTitle>
        <CardDescription className="text-slate-600">
          Log your daily activities and tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Slot & Countdown Display */}
        {isToday && isWithinWorkHours && !readOnly && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Current Slot</span>
              </div>
              <div className="text-xs text-slate-500">{timeInterval}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Time until next slot:</span>
              <div className={`text-sm font-bold ${
                timeToNextSlot < 300 ? 'text-red-600' : 
                timeToNextSlot < 600 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {formatCountdown(timeToNextSlot)}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-red-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((1800 - timeToNextSlot) / 1800) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Activity Entry Form */}
        {canCreateActivity ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Time Interval Input */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Time Interval *</label>
                <input
                  type="text"
                  value={timeInterval}
                  onChange={(e) => setTimeInterval(e.target.value)}
                  placeholder="09:00 - 10:30"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Format: HH:MM - HH:MM</p>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Activity Description *</label>
                <Textarea
                  placeholder="Describe your activity..."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Status</label>
                <Select
                  value={activityStatus}
                  onValueChange={(value: "ongoing" | "pending" | "completed") => setActivityStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={submitActivityEntry} 
                disabled={!timeInterval.trim() || !activityDescription.trim() || personalActivitiesLoading}
                className="w-full gap-2 bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Send className="w-4 h-4" />
                {personalActivitiesLoading ? "Submitting..." : "Submit Activity"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            {!isToday ? (
              <>
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">View Only Mode</p>
                <p className="text-xs text-slate-400 mt-1">You can only create activities for today</p>
              </>
            ) : !isWithinWorkHours ? (
              <>
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-amber-700 font-medium">Outside Work Hours</p>
                <p className="text-xs text-amber-600 mt-1">Activity logging is restricted to work hours (8:00 AM - 5:30 PM).</p>
              </>
            ) : (
              <>
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">View Only Mode</p>
                <p className="text-xs text-slate-400 mt-1">Read-only access</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}