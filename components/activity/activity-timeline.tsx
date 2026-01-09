"use client"

import { StorageService } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Lock, CheckCircle } from "lucide-react"
import { useMemo } from "react"

interface ActivityTimelineProps {
  employeeId: string
  date?: string
}

export default function ActivityTimeline({ employeeId, date }: ActivityTimelineProps) {
  const logs = useMemo(() => {
    const today = date || new Date().toISOString().split("T")[0]
    const existingLogs = StorageService.getEmployeeActivity(employeeId, today)

    const allHourLogs = Array.from({ length: 24 }).map((_, hour) => {
      return (
        existingLogs.find((l) => l.hour === hour) || {
          id: `temp_${hour}`,
          employeeId,
          hour,
          date: today,
          activities: [], // explicitly initialize as empty array
          isLocked: StorageService.isHourLocked(hour, today),
          timestamp: new Date().toISOString(),
        }
      )
    })

    return allHourLogs
  }, [employeeId, date])

  const summary = useMemo(() => {
    const withActivities = logs.filter((l) => (l.activities ?? []).length > 0).length
    const empty = logs.filter((l) => (l.activities ?? []).length === 0).length
    const locked = logs.filter((l) => l.isLocked).length
    return { withActivities, empty, locked, total: 24 }
  }, [logs])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Daily Timeline
        </CardTitle>
        <CardDescription>Hourly activities for {date || "today"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{summary.withActivities}</p>
            <p className="text-xs text-muted-foreground">Hours Logged</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{summary.empty}</p>
            <p className="text-xs text-muted-foreground">Empty Hours</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{summary.locked}</p>
            <p className="text-xs text-muted-foreground">Locked</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          {logs.map((log) => {
            const activities = log.activities ?? []
            const hasActivities = activities.length > 0
            const isLocked = log.isLocked

            return (
              <div key={log.hour} className="flex items-start gap-3">
                <div className="w-12 text-right pt-2">
                  <span className="text-sm font-mono font-medium">{log.hour.toString().padStart(2, "0")}:00</span>
                </div>
                <div className="flex-1">
                  <div
                    className={`p-3 rounded border transition-colors ${
                      hasActivities
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900"
                        : isLocked
                          ? "bg-muted border-border"
                          : "bg-background border-border hover:bg-secondary/50"
                    }`}
                  >
                    {hasActivities ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-200">
                            {activities.length} activit{activities.length === 1 ? "y" : "ies"}
                          </span>
                          {isLocked && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
                        </div>
                        <ul className="space-y-1">
                          {activities.map((activity, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground pl-6 relative">
                              <span className="absolute left-0">•</span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isLocked ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Hour locked - no activities logged</span>
                          </>
                        ) : (
                          <span>No activities logged</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
