// components/admin/dialogs/registerUserDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Department, Employee, Region, Branch, REGIONS, BRANCHES, validateLocation, getBranchesForRegion } from "@/lib/admin"
import { authApi } from "@/lib/auth"
import { showToast } from "@/lib/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, UserPlus, MapPin, Building, UserCog } from "lucide-react"

// Helper function to convert empty strings to undefined
const toOptionalString = (value: string | undefined): string | undefined => {
  return value && value !== "none" ? value : undefined;
};

// Define location validation schema
const locationSchema = z.object({
  region: z.string().optional(),
  branch: z.string().optional()
}).refine((data) => {
  // If either region or branch is provided, both must be provided and valid
  const region = toOptionalString(data.region);
  const branch = toOptionalString(data.branch);
  
  if (region || branch) {
    if (!region || !branch) {
      return false;
    }
    const validBranches = BRANCHES[region as Region] as readonly Branch[] | undefined;
    return Boolean(validBranches && validBranches.includes(branch as Branch));
  }
  return true;
}, {
  message: "Invalid region and branch combination. Please select a valid branch for the chosen region.",
  path: ["branch"]
});

const formSchema = z.object({
  id_card: z.string()
    .min(5, "ID card must be at least 5 characters")
    .regex(/^KE\d{3}$/, "ID Card must follow format KE175 (e.g., KE175)"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["STAFF", "LINE_MANAGER", "SUPER_ADMIN"]),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  region: z.string().optional(),
  branch: z.string().optional(),
  reportsTo: z.string().optional(),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.and(locationSchema); // Combine with location validation

interface RegisterUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
  employees: Employee[]
  isActionLoading?: boolean
  onSuccess?: () => void
}

export default function RegisterUserDialog({
  open,
  onOpenChange,
  departments,
  employees,
  isActionLoading = false,
  onSuccess
}: RegisterUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [filteredManagers, setFilteredManagers] = useState<Employee[]>([])
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const BRAND_COLOR = "#ec3338";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_card: "", email: "", password: "", confirmPassword: "",
      first_name: "", last_name: "", role: "STAFF", department: "",
      position: "", region: "none", branch: "none", reportsTo: "none",
    },
  })

  const watchRole = form.watch("role")
  const watchRegion = form.watch("region")

  // Update available branches when region changes
  useEffect(() => {
    const regionValue = toOptionalString(watchRegion);
    if (regionValue && REGIONS.includes(regionValue as Region)) {
      const branches = getBranchesForRegion(regionValue as Region)
      setAvailableBranches(branches)
      
      // Clear branch if it's not valid for the new region
      const currentBranch = form.getValues("branch")
      const currentBranchValue = toOptionalString(currentBranch);
      if (currentBranchValue && !branches.includes(currentBranchValue as Branch)) {
        form.setValue("branch", "none")
      }
    } else {
      setAvailableBranches([])
      form.setValue("branch", "none")
    }
  }, [watchRegion, form])

  // Update available managers based on role
  useEffect(() => {
    let availableManagers: Employee[] = [];
    
    if (watchRole === "STAFF") {
      // STAFF can report to LINE_MANAGER or SUPER_ADMIN
      availableManagers = employees.filter(emp => 
        (emp.role === "LINE_MANAGER" || emp.role === "SUPER_ADMIN") && 
        emp.is_active && 
        !emp.isLocked
      )
    } else if (watchRole === "LINE_MANAGER") {
      // LINE_MANAGER can report to SUPER_ADMIN
      availableManagers = employees.filter(emp => 
        emp.role === "SUPER_ADMIN" && 
        emp.is_active && 
        !emp.isLocked
      )
    }
    // SUPER_ADMIN typically doesn't report to anyone
    
    setFilteredManagers(availableManagers)
    
    // Auto-select if only one manager available and not already set
    if (availableManagers.length === 1 && form.getValues("reportsTo") === "none") {
      form.setValue("reportsTo", availableManagers[0]._id)
    } else if (availableManagers.length === 0) {
      form.setValue("reportsTo", "none")
    }
  }, [watchRole, employees, form])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Convert "none" to undefined for API
      const regionValue = toOptionalString(values.region);
      const branchValue = toOptionalString(values.branch);
      const reportsToValue = toOptionalString(values.reportsTo);
      
      // Prepare registration data with proper typing
      const registrationData = {
        id_card: values.id_card,
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        department: values.department,
        position: values.position,
        region: regionValue ? (regionValue as Region) : undefined,
        branch: branchValue ? (branchValue as Branch) : undefined,
        reportsTo: reportsToValue
      }

      const response = await authApi.register(registrationData)
      if (response.success) {
        showToast.success(response.message || "User registered successfully")
        form.reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        id_card: "", email: "", password: "", confirmPassword: "",
        first_name: "", last_name: "", role: "STAFF", department: "",
        position: "", region: "none", branch: "none", reportsTo: "none",
      })
      setAvailableBranches([])
    }
    onOpenChange(open)
  }

  // Helper function to handle clearing region/branch
  const clearLocation = () => {
    form.setValue("region", "none")
    form.setValue("branch", "none")
  }

  // Get the appropriate reportsTo label based on role
  const getReportsToLabel = () => {
    switch (watchRole) {
      case "STAFF":
        return "Reports To (Manager) *";
      case "LINE_MANAGER":
        return "Reports To (Super Admin)";
      case "SUPER_ADMIN":
        return "Reports To (Optional)";
      default:
        return "Reports To";
    }
  }

  // Get the appropriate placeholder for reportsTo
  const getReportsToPlaceholder = () => {
    switch (watchRole) {
      case "STAFF":
        return "Select a manager";
      case "LINE_MANAGER":
        return "Select a super admin";
      case "SUPER_ADMIN":
        return "Optional - select if reporting to someone";
      default:
        return "Select";
    }
  }

  // Get description for reportsTo field
  const getReportsToDescription = () => {
    switch (watchRole) {
      case "STAFF":
        return "STAFF must report to a LINE_MANAGER or SUPER_ADMIN";
      case "LINE_MANAGER":
        return "LINE_MANAGER typically reports to SUPER_ADMIN";
      case "SUPER_ADMIN":
        return "SUPER_ADMIN usually has no direct supervisor";
      default:
        return "";
    }
  }

  // Check if reportsTo is required
  const isReportsToRequired = watchRole === "STAFF";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] border-t-4" style={{ borderTopColor: BRAND_COLOR }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <UserPlus className="h-5 w-5" style={{ color: BRAND_COLOR }} />
            Register New User
          </DialogTitle>
          <DialogDescription>
            Onboard a new employee. A verification email will be dispatched upon creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              
              {/* --- Section: Credentials --- */}
              <FormField
                control={form.control}
                name="id_card"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">ID Card *</FormLabel>
                    <FormControl>
                      <Input placeholder="KE175" {...field} className="uppercase focus-visible:ring-[#ec3338]" onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@company.com" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Confirm Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Section: Personal Info --- */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Section: Organizational --- */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Access Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-[#ec3338]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="LINE_MANAGER">Line Manager</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Department *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-[#ec3338]">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.filter(d => d.isActive).map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Job Position *</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} className="focus-visible:ring-[#ec3338]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Section: Location --- */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={14} />
                    <span>Location Information (Optional)</span>
                  </div>
                  {(toOptionalString(watchRegion) || toOptionalString(form.getValues("branch"))) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLocation}
                      className="h-auto p-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Clear location
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Region</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-[#ec3338]">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Branch</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!watchRegion || watchRegion === "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-[#ec3338]">
                              <SelectValue placeholder={
                                !watchRegion || watchRegion === "none" 
                                  ? "Select region first" 
                                  : "Select branch"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {availableBranches.map((branch) => (
                              <SelectItem key={branch} value={branch}>
                                <div className="flex items-center gap-2">
                                  <Building size={12} className="text-slate-400" />
                                  <span>{branch}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {watchRegion && watchRegion !== "none" && availableBranches.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            No branches available for selected region
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                  <p className="font-medium mb-1">Note:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Location is optional but recommended for regional tracking</li>
                    <li>If region is selected, branch must also be selected for validation</li>
                    <li>Valid combinations: Lagos (HQ, Alimosho), Delta (Warri), Osun (Osun)</li>
                    <li>Select "Not specified" to skip location information</li>
                  </ul>
                </div>
              </div>

              {/* --- Section: Reporting Structure --- */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserCog size={14} />
                  <span>Reporting Structure</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="reportsTo"
                  render={({ field }) => (
                    <FormItem className="bg-slate-50 p-3 rounded-lg border border-dashed">
                      <FormLabel className={`text-xs font-bold uppercase ${isReportsToRequired ? 'text-[#ec3338]' : 'text-muted-foreground'}`}>
                        {getReportsToLabel()}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white focus:ring-[#ec3338]">
                            <SelectValue placeholder={getReportsToPlaceholder()} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No manager assigned</SelectItem>
                          {filteredManagers.map((m) => (
                            <SelectItem key={m._id} value={m._id}>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{m.first_name} {m.last_name}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {m.role.toLowerCase().replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span>ID: {m.id_card}</span>
                                  {m.department && (
                                    <span>• Dept: {typeof m.department === 'object' ? m.department.name : 'N/A'}</span>
                                  )}
                                  {m.region && (
                                    <span>• Location: {m.region} {m.branch ? `- ${m.branch}` : ''}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {filteredManagers.length === 0 && watchRole !== "SUPER_ADMIN" && (
                        <p className="text-xs text-amber-600 mt-1">
                          No available {watchRole === "STAFF" ? "managers (LINE_MANAGER or SUPER_ADMIN)" : "super admins"} to assign
                        </p>
                      )}
                      {getReportsToDescription() && (
                        <p className="text-xs text-slate-500 mt-1">
                          {getReportsToDescription()}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="text-white transition-all active:scale-95 px-8" style={{ backgroundColor: BRAND_COLOR }}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Register User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Add Badge component import if not already available
import { Badge } from "@/components/ui/badge"