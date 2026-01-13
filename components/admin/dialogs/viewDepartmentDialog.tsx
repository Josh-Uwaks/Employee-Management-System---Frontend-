"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Department, Employee } from "@/lib/admin"
import {
  Building2,
  Calendar,
  Clock,
  Users,
  UserCog,
  ShieldCheck,
  Eye,
  Lock,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ViewDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  employees: Employee[]
  totalStaffCount?: number
  isLineManager?: boolean
  authUserId?: string
}

export default function ViewDepartmentDialog({
  open,
  onOpenChange,
  department,
  employees,
  totalStaffCount = 0,
  isLineManager = false,
  authUserId,
}: ViewDepartmentDialogProps) {
  if (!department) return null

  /* ------------------------ DATA LOGIC ------------------------ */
  // Filter employees based on LINE_MANAGER access
  const filteredEmployees = isLineManager && authUserId
    ? employees.filter(emp => 
        emp.reportsTo && 
        (typeof emp.reportsTo === 'string' 
          ? emp.reportsTo === authUserId 
          : emp.reportsTo._id === authUserId))
    : employees

  const departmentStaff = filteredEmployees.filter(emp =>
    typeof emp.department === "string"
      ? emp.department === department._id
      : emp.department?._id === department._id
  )

  const managers = departmentStaff.filter(e => e.role === "LINE_MANAGER")
  const staff = departmentStaff.filter(e => e.role === "STAFF")
  const activeStaff = departmentStaff.filter(e => e.is_active && !e.isLocked).length
  const lockedStaff = departmentStaff.filter(e => e.isLocked).length
  const verifiedStaff = departmentStaff.filter(e => e.isVerified).length

  const activeRate = Math.round(
    (activeStaff / Math.max(departmentStaff.length, 1)) * 100
  )
  const verificationRate = Math.round(
    (verifiedStaff / Math.max(departmentStaff.length, 1)) * 100
  )

  const getName = (e: Employee) => `${e.first_name} ${e.last_name}`
  const getInitials = (e: Employee) =>
    `${e.first_name?.[0] || ""}${e.last_name?.[0] || ""}`.toUpperCase()

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A"

  /* ------------------------ UI ------------------------ */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] p-0 overflow-hidden bg-slate-50">

        {/* ---------- HEADER ---------- */}
        <div className="bg-[#ec3338] px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {department.name}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Code: <span className="font-mono">{department.code || "N/A"}</span>
                {isLineManager && (
                  <span className="ml-4 px-2 py-1 bg-white/20 rounded text-xs">
                    View Only
                  </span>
                )}
              </DialogDescription>
            </div>
            <Badge
              className={cn(
                "ml-auto",
                department.isActive
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-slate-500/20 text-slate-200"
              )}
            >
              {department.isActive ? "Operational" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* ---------- STATS STRIP ---------- */}
        <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border-b">
          <Stat label="Total Staff" value={departmentStaff.length} icon={<Users size={16} />} />
          <Stat label="Active Staff" value={activeStaff} icon={<CheckCircle size={16} />} />
          <Stat label="Verification Rate" value={`${verificationRate}%`} icon={<ShieldCheck size={16} />} />
        </div>

        <ScrollArea className="h-[70vh] px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ---------- LEFT SIDEBAR ---------- */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionTitle>Department Overview</SectionTitle>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {department.description || "No description provided."}
                  </p>

                  <div className="pt-4 space-y-3 border-t">
                    <MetaRow
                      icon={<Calendar size={14} />}
                      label="Created"
                      value={formatDate(department.createdAt)}
                    />
                    <MetaRow
                      icon={<Clock size={14} />}
                      label="Last Updated"
                      value={formatDate(department.updatedAt)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <SectionTitle>Staff Status Breakdown</SectionTitle>

                  <ProgressRow
                    label="Active"
                    value={activeStaff}
                    total={departmentStaff.length}
                    color="bg-emerald-500"
                    icon={<CheckCircle size={12} />}
                  />
                  <ProgressRow
                    label="Verified"
                    value={verifiedStaff}
                    total={departmentStaff.length}
                    color="bg-blue-500"
                    icon={<ShieldCheck size={12} />}
                  />
                  <ProgressRow
                    label="Locked"
                    value={lockedStaff}
                    total={departmentStaff.length}
                    color="bg-[#ec3338]"
                    icon={<Lock size={12} />}
                  />
                </CardContent>
              </Card>
            </div>

            {/* ---------- MAIN CONTENT ---------- */}
            <div className="lg:col-span-2 space-y-8">

              {/* ----- LEADERSHIP ----- */}
              {managers.length > 0 && (
                <section>
                  <HeaderRow
                    title="Leadership"
                    icon={<UserCog size={18} />}
                    count={managers.length}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    {managers.map(m => {
                      const reports = departmentStaff.filter(
                        e =>
                          typeof e.reportsTo === "string"
                            ? e.reportsTo === m._id
                            : e.reportsTo?._id === m._id
                      )

                      return (
                        <div
                          key={m._id}
                          className="bg-white border-l-4 border-[#ec3338] rounded-xl p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-[#ec3338]/10 text-[#ec3338]">
                                {getInitials(m)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{getName(m)}</p>
                              <p className="text-sm text-slate-500">{m.position || "Manager"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-600">{m.email}</span>
                              </div>
                            </div>

                            <Badge variant="secondary" className="gap-1">
                              <Users size={12} />
                              {reports.length} reports
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ----- STAFF TABLE ----- */}
              <section className="bg-white rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Staff Roster {isLineManager && "(Your Direct Reports)"}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {departmentStaff.length} staff members
                  </Badge>
                </div>

                {departmentStaff.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium">No staff members in this department</p>
                    <p className="text-sm mt-1">
                      {isLineManager 
                        ? "You don't have any direct reports in this department"
                        : "No employees are assigned to this department yet"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-3 text-left">Employee</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {departmentStaff.map(s => (
                          <tr key={s._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(s)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">{getName(s)}</p>
                                  <p className="text-xs text-slate-500">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                s.role === "LINE_MANAGER" 
                                  ? "border-purple-200 text-purple-700 bg-purple-50"
                                  : "border-slate-200"
                              )}>
                                {s.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    s.isLocked
                                      ? "text-[#ec3338]"
                                      : s.is_active
                                      ? "text-emerald-600"
                                      : "text-slate-400"
                                  )}
                                >
                                  {s.isLocked
                                    ? "LOCKED"
                                    : s.is_active
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                                </span>
                                {!s.isVerified && (
                                  <span className="text-xs text-amber-600">
                                    Unverified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-mono text-slate-500">
                              {s.id_card}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </ScrollArea>

        {/* ---------- FOOTER ---------- */}
        <div className="bg-white border-t px-6 py-4 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {isLineManager 
              ? "Viewing your assigned department only"
              : "Department details view"}
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------ SMALL COMPONENTS ------------------ */

function Stat({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">{label}</p>
      <div className="flex items-center justify-center gap-2">
        {icon}
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
      {children}
    </h4>
  )
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {icon} {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string
  value: number
  total: number
  color: string
  icon?: React.ReactNode
}) {
  const percentage = Math.round((value / Math.max(total, 1)) * 100)
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span>{value} ({percentage}%)</span>
      </div>
      <Progress value={percentage} className={color} />
    </div>
  )
}

function HeaderRow({
  title,
  icon,
  count,
}: {
  title: string
  icon: React.ReactNode
  count: number
}) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase">
        {icon} {title}
      </h3>
      <Badge variant="outline">{count}</Badge>
    </div>
  )
}