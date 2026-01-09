// components/admin/dialogs/registerUserDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Department, Employee } from "@/lib/admin"
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
import { Loader2, UserPlus } from "lucide-react"

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

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
  const BRAND_COLOR = "#ec3338";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_card: "", email: "", password: "", confirmPassword: "",
      first_name: "", last_name: "", role: "STAFF", department: "",
      position: "", region: "", branch: "", reportsTo: "",
    },
  })

  const watchRole = form.watch("role")

  useEffect(() => {
    if (watchRole === "STAFF") {
      const managers = employees.filter(emp => emp.role === "LINE_MANAGER" && emp.is_active && !emp.isLocked)
      setFilteredManagers(managers)
      if (managers.length === 1 && !form.getValues("reportsTo")) {
        form.setValue("reportsTo", managers[0]._id)
      }
    } else {
      setFilteredManagers([])
      form.setValue("reportsTo", "")
    }
  }, [watchRole, employees, form])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const response = await authApi.register(values)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Region</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-[#ec3338]">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lagos">Lagos</SelectItem>
                        <SelectItem value="Delta">Delta</SelectItem>
                        <SelectItem value="Osun">Osun</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchRole === "STAFF" && (
                <FormField
                  control={form.control}
                  name="reportsTo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-dashed">
                      <FormLabel className="text-xs font-bold uppercase text-[#ec3338]">Reporting Line Manager *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white focus:ring-[#ec3338]">
                            <SelectValue placeholder="Assign a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredManagers.map((m) => (
                            <SelectItem key={m._id} value={m._id}>{m.first_name} {m.last_name} ({m.id_card})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
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