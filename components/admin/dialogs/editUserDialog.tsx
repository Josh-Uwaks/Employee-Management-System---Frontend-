"use client"

import {
  Employee,
  Department,
  Region,
  Branch,
  REGIONS,
  getBranchesForRegion,
  validateLocation,
} from "@/lib/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  UserCog,
  Fingerprint,
  ShieldCheck,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  ChevronRight,
  User,
  Building2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  formData: Partial<Employee>
  departments: Department[]
  isActionLoading: boolean
  onFormDataChange: (data: Partial<Employee>) => void
  onSave: () => void
}

export default function EditUserDialog({
  open,
  onOpenChange,
  employee,
  formData,
  departments,
  isActionLoading,
  onFormDataChange,
  onSave,
}: EditUserDialogProps) {
  const BRAND_COLOR = "#ec3338"
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [locationError, setLocationError] = useState("")
  const [potentialLineManagers, setPotentialLineManagers] = useState<Employee[]>([])

  // Get the current department
  const currentDepartment = departments.find(dept => dept._id === formData.department)
  
  // Get the employee's current reportsTo information
  const getReportsToInfo = () => {
    if (!employee?.reportsTo) return null;
    
    if (typeof employee.reportsTo === 'object') {
      return {
        name: `${employee.reportsTo.first_name} ${employee.reportsTo.last_name}`,
        idCard: employee.reportsTo.id_card,
        role: employee.reportsTo.role,
        isObject: true
      };
    }
    
    return {
      name: "Unknown Manager",
      idCard: "N/A",
      role: "Unknown",
      isObject: false,
      id: employee.reportsTo
    };
  };

  const reportsToInfo = getReportsToInfo();

  /* ---------------- LINE MANAGER LOGIC ---------------- */
  // Find potential line managers in the selected department
  useEffect(() => {
    if (formData.department && employee && employee._id) {
      // In a real implementation, this would fetch LINE_MANAGERS from API
      // For now, simulate by filtering from available employees
      const currentDept = departments.find(d => d._id === formData.department)
      if (currentDept) {
        console.log("Looking for line managers in department:", currentDept.name)
        
        // Find all LINE_MANAGERS in this department
        const lineManagersInDept: Employee[] = [] // This would come from API
        setPotentialLineManagers(lineManagersInDept)
      }
    }
  }, [formData.department, employee, departments])

  // Get line manager display text
  const getLineManagerDisplay = () => {
    if (!reportsToInfo) return "Not assigned (will be auto-assigned)";
    
    return `${reportsToInfo.name} (${reportsToInfo.idCard}) - ${reportsToInfo.role}`;
  };

  // Check if the employee is a STAFF (needs line manager)
  const isStaff = formData.role === "STAFF";

  // Check if department is changing
  const isDepartmentChanging = employee?.department && 
    ((typeof employee.department === 'object' && employee.department._id !== formData.department) ||
     (typeof employee.department === 'string' && employee.department !== formData.department));

  /* ---------------- LOCATION LOGIC ---------------- */
  useEffect(() => {
    setLocationError("")

    if (formData.region && REGIONS.includes(formData.region as Region)) {
      const branches = getBranchesForRegion(formData.region as Region)
      setAvailableBranches(branches)

      if (
        formData.branch &&
        !branches.includes(formData.branch as Branch)
      ) {
        onFormDataChange({ ...formData, branch: undefined })
      }

      if (formData.region && formData.branch) {
        if (
          !validateLocation(
            formData.region as Region,
            formData.branch as Branch
          )
        ) {
          setLocationError(
            `Invalid branch for ${formData.region}. Valid: ${branches.join(", ")}`
          )
        }
      }
    } else {
      setAvailableBranches([])
    }
  }, [formData.region, formData.branch])

  const isValidLocation =
    formData.region &&
    formData.branch &&
    validateLocation(
      formData.region as Region,
      formData.branch as Branch
    )

  const handleSave = () => {
    if (formData.region && formData.branch && !isValidLocation) {
      setLocationError("Invalid region / branch combination")
      return
    }
    onSave()
  }

  /* ---------------- UI ---------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-white">

        {/* HEADER */}
        <DialogHeader className="px-8 py-6 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#ec3338]/10 flex items-center justify-center text-[#ec3338]">
              <UserCog size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Edit User Profile
              </DialogTitle>
              <DialogDescription className="text-sm">
                Update system access and identity details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-8 py-6">
          <div className="space-y-10">

            {/* PERSONAL */}
            <Section title="Personal Identity" icon={Fingerprint}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name">
                  <Input
                    value={formData.first_name || ""}
                    onChange={e =>
                      onFormDataChange({
                        ...formData,
                        first_name: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={formData.last_name || ""}
                    onChange={e =>
                      onFormDataChange({
                        ...formData,
                        last_name: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Job position">
                <Input
                  value={formData.position || ""}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      position: e.target.value,
                    })
                  }
                />
              </Field>
            </Section>

            <Separator />

            {/* ROLE */}
            <Section title="Role & Department" icon={ShieldCheck}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="System role">
                  <Select
                    value={formData.role || ""}
                    onValueChange={val =>
                      onFormDataChange({ ...formData, role: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="LINE_MANAGER">
                        Line Manager
                      </SelectItem>
                      <SelectItem value="SUPER_ADMIN">
                        Super Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Department">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {/* <Label className="text-xs font-semibold text-slate-600">Department</Label> */}
                      {isDepartmentChanging && isStaff && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Line manager will update
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={(formData.department as string) || ""}
                      onValueChange={val =>
                        onFormDataChange({
                          ...formData,
                          department: val,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments
                          .filter(d => d.isActive)
                          .map(d => (
                            <SelectItem key={d._id} value={d._id}>
                              {d.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              </div>

              {/* Line Manager Display - Only for STAFF */}
              {isStaff && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                      <User size={12} />
                      Current Line Manager
                    </Label>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Auto-assigned
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-slate-50/50 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {getLineManagerDisplay()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {reportsToInfo 
                            ? "Line manager is automatically assigned based on department. Changing department will update the line manager."
                            : "No line manager assigned. Will be auto-assigned when department is saved if a LINE_MANAGER exists in that department."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Role-specific note */}
              {formData.role === "LINE_MANAGER" && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-indigo-600 mt-0.5 flex-shrink-0" size={14} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-indigo-800 mb-1">
                        LINE_MANAGER Role
                      </p>
                      <p className="text-xs text-indigo-700">
                        LINE_MANAGERS do not report to anyone and can manage STAFF in their department.
                        STAFF will be automatically assigned to LINE_MANAGERS in their department.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.role === "SUPER_ADMIN" && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-purple-600 mt-0.5 flex-shrink-0" size={14} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-800 mb-1">
                        SUPER_ADMIN Role
                      </p>
                      <p className="text-xs text-purple-700">
                        SUPER_ADMINS have full system access and do not report to anyone.
                        They can manage all users regardless of department.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Department change notice for STAFF */}
              {isDepartmentChanging && isStaff && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        Department Change Detected
                      </p>
                      <p className="text-xs text-blue-700">
                        Changing department will automatically assign this staff member to a LINE_MANAGER 
                        in the new department. If no LINE_MANAGER exists, they will remain unassigned.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <Separator />

            {/* LOCATION */}
            <Section title="Work Location" icon={MapPin}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Region">
                  <Select
                    value={formData.region || ""}
                    onValueChange={val =>
                      onFormDataChange({
                        ...formData,
                        region: val as Region,
                        branch: undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Branch">
                  <Select
                    value={formData.branch || ""}
                    disabled={!availableBranches.length}
                    onValueChange={val =>
                      onFormDataChange({
                        ...formData,
                        branch: val as Branch,
                      })
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        locationError && "border-rose-300"
                      )}
                    >
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map(b => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {locationError && (
                <AlertMessage
                  icon={AlertCircle}
                  text={locationError}
                  tone="error"
                />
              )}

              {isValidLocation && (
                <AlertMessage
                  icon={CheckCircle}
                  text={`Location verified (${formData.region} – ${formData.branch})`}
                  tone="success"
                />
              )}
            </Section>
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={isActionLoading}
            style={{ backgroundColor: BRAND_COLOR }}
            className="px-8 font-semibold"
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- SMALL UI HELPERS ---------------- */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Icon size={14} />
        {title}
      </h4>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">
        {label}
      </Label>
      {children}
    </div>
  )
}

function AlertMessage({
  icon: Icon,
  text,
  tone,
}: {
  icon: any
  text: string
  tone: "error" | "success"
}) {
  const styles =
    tone === "error"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return (
    <div className={cn("flex gap-2 items-start p-3 border rounded-lg", styles)}>
      <Icon size={14} className="mt-0.5" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  )
}