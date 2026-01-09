import { Employee, Department } from "@/lib/admin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

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
  // Brand color constant for easy maintenance
  const BRAND_COLOR = "#ec3338";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] border-t-4" style={{ borderTopColor: BRAND_COLOR }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Staff Profile</DialogTitle>
          <DialogDescription>
            Update employee credentials, organizational placement, and system permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</Label>
              <Input 
                className="focus-visible:ring-[#ec3338]"
                value={formData.first_name || ""} 
                onChange={e => onFormDataChange({...formData, first_name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
              <Input 
                className="focus-visible:ring-[#ec3338]"
                value={formData.last_name || ""} 
                onChange={e => onFormDataChange({...formData, last_name: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* System Role */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Role</Label>
              <Select 
                value={formData.role || ""} 
                onValueChange={val => onFormDataChange({...formData, role: val})}
              >
                <SelectTrigger className="focus:ring-[#ec3338]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="LINE_MANAGER">Line Manager</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Select 
                value={formData.department as string || ""} 
                onValueChange={val => onFormDataChange({...formData, department: val})}
              >
                <SelectTrigger className="focus:ring-[#ec3338]">
                  <SelectValue placeholder="Assign department" />
                </SelectTrigger>
                <SelectContent>
                  {departments
                    .filter(d => d.isActive)
                    .map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name} <span className="text-muted-foreground text-xs ml-1">({dept.code})</span>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Region</Label>
              <Input 
                className="focus-visible:ring-[#ec3338]"
                value={formData.region || ""} 
                onChange={e => onFormDataChange({...formData, region: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch</Label>
              <Input 
                className="focus-visible:ring-[#ec3338]"
                value={formData.branch || ""} 
                onChange={e => onFormDataChange({...formData, branch: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave} 
            disabled={isActionLoading} 
            className="text-white transition-all active:scale-95"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}