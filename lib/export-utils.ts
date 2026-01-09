// Utility functions for data export and reporting

import { StorageService } from "./storage"

export interface ActivityReport {
  employeeId: string
  employeeName: string
  date: string
  presentHours: number
  absentHours: number
  pendingHours: number
  attendancePercentage: number
}

export const ExportUtils = {
  // Generate activity report for a specific date
  generateActivityReport(date: string): ActivityReport[] {
    const employees = StorageService.getUsers().filter((u) => u.role === "employee")

    return employees.map((emp) => {
      const summary = StorageService.getActivitySummary(emp.id, date)
      const percentage = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        presentHours: summary.present,
        absentHours: summary.absent,
        pendingHours: summary.pending,
        attendancePercentage: percentage,
      }
    })
  },

  // Export report as CSV
  exportToCSV(reports: ActivityReport[]): string {
    const headers = ["Employee ID", "Employee Name", "Date", "Present Hours", "Absent Hours", "Pending Hours", "Attendance %"]
    const rows = reports.map((r) => [
      r.employeeId,
      r.employeeName,
      r.date,
      r.presentHours.toString(),
      r.absentHours.toString(),
      r.pendingHours.toString(),
      r.attendancePercentage + "%",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    return csv
  },

  // Download report as file
  downloadReport(filename: string, content: string) {
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(content))
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  },

  // Get employee activity statistics
  getEmployeeStats(employeeId: string) {
    const allLogs = StorageService.getActivityLogs().filter((log) => log.employeeId === employeeId)

    if (allLogs.length === 0) {
      return {
        totalDays: 0,
        averageAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
      }
    }

    const dates = [...new Set(allLogs.map((l) => l.date))]
    const totalPresent = allLogs.filter((l) => l.status === "present").length
    const totalAbsent = allLogs.filter((l) => l.status === "absent").length
    const avgAttendance = Math.round((totalPresent / allLogs.length) * 100)

    return {
      totalDays: dates.length,
      averageAttendance: avgAttendance,
      totalPresent,
      totalAbsent,
    }
  },

  // Generate report for date range
  generateDateRangeReport(startDate: string, endDate: string): ActivityReport[] {
    const employees = StorageService.getUsers().filter((u) => u.role === "employee")
    const reports: ActivityReport[] = []

    employees.forEach(emp => {
      const allLogs = StorageService.getActivityLogs().filter(log => 
        log.employeeId === emp.id && 
        log.date >= startDate && 
        log.date <= endDate
      )

      const presentHours = allLogs.filter(log => log.status === "present").length
      const absentHours = allLogs.filter(log => log.status === "absent").length
      const pendingHours = allLogs.filter(log => log.status === "pending").length
      const totalHours = allLogs.length
      const percentage = totalHours > 0 ? Math.round((presentHours / totalHours) * 100) : 0

      reports.push({
        employeeId: emp.id,
        employeeName: emp.name,
        date: `${startDate} to ${endDate}`,
        presentHours,
        absentHours,
        pendingHours,
        attendancePercentage: percentage,
      })
    })

    return reports
  }
}