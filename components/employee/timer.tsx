"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Clock, AlertTriangle } from "lucide-react"

interface DashboardTimerProps {
  workSlotEnded?: boolean
  workSlotStarted?: boolean
}

export default function DashboardTimer({ workSlotEnded = false, workSlotStarted = false }: DashboardTimerProps) {
  const [now, setNow] = useState(new Date())
  const BRAND_COLOR = "#ec3338"

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const stats = useMemo(() => {
    const nigeriaTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: 'Africa/Lagos'
    }).format(now)

    const minute = now.getMinutes()
    const second = now.getSeconds()
    const hour = now.getHours()

    const isSecondHalf = minute >= 30
    const startMin = isSecondHalf ? 30 : 0
    const endMin = isSecondHalf ? 0 : 30
    const endHour = isSecondHalf ? (hour + 1) % 24 : hour

    const currentSlot = `${String(hour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} — ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
    
    const minutesRemaining = 29 - (minute % 30)
    const secondsRemaining = 59 - second
    const progress = (((minute % 30) * 60 + second) / (30 * 60)) * 100

    return {
      currentTime: nigeriaTime,
      currentSlot,
      minutesRemaining,
      secondsRemaining,
      progress,
      isCritical: minutesRemaining < 5,
    }
  }, [now])

  // Handle before work starts (before 8:00 AM)
  if (!workSlotStarted && !workSlotEnded) {
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Calculate time until 8:00 AM
    const hoursUntilStart = 8 - currentHour - (currentMinute > 0 ? 1 : 0)
    const minutesUntilStart = 60 - currentMinute
    const totalMinutesUntilStart = hoursUntilStart * 60 + minutesUntilStart
    
    return (
      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-bold">Work Schedule</p>
            <h2 className="text-lg font-bold text-slate-900">8:00 AM — 5:30 PM</h2>
          </div>
        </div>
        
        {/* Countdown to start */}
        <div className="text-center mb-4">
          <p className="text-sm text-slate-500 mb-2">Work starts in:</p>
          <div className="text-4xl font-bold text-slate-800 tabular-nums">
            {String(Math.max(0, totalMinutesUntilStart)).padStart(2, '0')}
            <span className="opacity-30">:</span>
            {String(60 - now.getSeconds()).padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-400 mt-2">minutes</p>
        </div>
        
        {/* Status message */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700 font-medium">
              You can start logging activities at 8:00 AM
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Handle work slot ended (after 5:30 PM)
  if (workSlotEnded) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-bold">Work Schedule</p>
            <h2 className="text-lg font-bold text-slate-900">8:00 AM — 5:30 PM</h2>
          </div>
        </div>
        
        {/* Status message */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-bold">SHIFT COMPLETED</span>
            </div>
            <p className="text-sm text-slate-600">
              Today's work session has ended. You can still log activities you missed earlier.
            </p>
          </div>
        </div>
        
        {/* Current time display */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Current Time</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">
            {stats.currentTime}
          </p>
        </div>
      </div>
    )
  }

  // Normal working hours (8:00 AM - 5:30 PM)
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-1">Active Slot</p>
          <h2 className="text-lg font-bold text-slate-900">{stats.currentSlot}</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-1">Local Time</p>
          <p className="text-sm font-medium text-slate-600 tabular-nums">{stats.currentTime}</p>
        </div>
      </div>

      {/* Main Countdown */}
      <div className="mb-6">
        <div className={cn(
          "text-5xl font-bold tracking-tighter tabular-nums mb-2 transition-colors",
          stats.isCritical ? "text-[#ec3338]" : "text-slate-900"
        )}>
          {String(stats.minutesRemaining).padStart(2, '0')}
          <span className="opacity-20">:</span>
          {String(stats.secondsRemaining).padStart(2, '0')}
        </div>
        
        {/* Sleek Progress Line */}
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full absolute left-0 top-0"
            style={{ 
              backgroundColor: stats.isCritical ? "#ec3338" : BRAND_COLOR,
              backgroundImage: stats.isCritical 
                ? "linear-gradient(90deg, #ec3338, #ff6b6b)" 
                : "linear-gradient(90deg, #ec3338, #ff8c42)"
            }}
          />
          {/* Animated dot at progress end */}
          <motion.div 
            animate={{ x: `${stats.progress}%` }}
            transition={{ duration: 1 }}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2"
            style={{ 
              borderColor: stats.isCritical ? "#ec3338" : BRAND_COLOR,
              marginLeft: '-6px'
            }}
          />
        </div>
      </div>

      {/* Status Footer */}
      <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <div 
            className={cn("w-1.5 h-1.5 rounded-full", stats.isCritical && "animate-pulse")} 
            style={{ backgroundColor: BRAND_COLOR }} 
          />
          <span className="uppercase tracking-wider">Slot Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-500">{Math.round(stats.progress)}%</span>
          {stats.isCritical && (
            <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full font-bold animate-pulse">
              Ending Soon
            </span>
          )}
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ✓ You can log activities for any time slot today (8:00 AM - 5:30 PM)
        </p>
      </div>
    </div>
  )
}