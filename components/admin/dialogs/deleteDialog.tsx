
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, UserX, ShieldAlert } from "lucide-react"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: {
    _id: string
    id_card: string
    email: string
    first_name: string
    last_name: string
    role: string
    department?: any
    reportsTo?: any
    region?: string
    branch?: string
  }
  isActionLoading: boolean
  onDelete: () => Promise<void>
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  employee,
  isActionLoading,
  onDelete
}: DeleteUserDialogProps) {
  if (!employee) return null

  const handleConfirm = async () => {
    try {
      await onDelete()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the onDelete function
    }
  }

  const getDepartmentName = () => {
    if (!employee.department) return "N/A"
    if (typeof employee.department === 'object') return employee.department.name
    return employee.department
  }

  const isSuperAdmin = employee.role === "SUPER_ADMIN"
  const hasReports = employee.reportsTo // This would need to check if any staff reports to this user

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">ID Card</p>
              <p className="text-muted-foreground">{employee.id_card}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Name</p>
              <p className="text-muted-foreground">
                {employee.first_name} {employee.last_name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">{employee.email}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Role</p>
              <p className="text-muted-foreground">{employee.role}</p>
            </div>
            {employee.department && (
              <div className="space-y-1 col-span-2">
                <p className="font-medium">Department</p>
                <p className="text-muted-foreground">{getDepartmentName()}</p>
              </div>
            )}
            {(employee.region || employee.branch) && (
              <div className="space-y-1 col-span-2">
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">
                  {employee.region} {employee.branch ? `- ${employee.branch}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Warning messages based on user role */}
        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              SUPER_ADMIN Account
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Deleting a SUPER_ADMIN account requires special consideration. Ensure there is at least one other active SUPER_ADMIN.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Critical Action Warning
          </p>
          <ul className="mt-2 text-sm text-destructive/80 space-y-1 pl-6 list-disc">
            <li>User will lose access to the system immediately</li>
            <li>All user data including check-ins and activities will be deleted</li>
            <li>This action cannot be reversed</li>
            {employee.role === "LINE_MANAGER" && (
              <li>Staff reporting to this manager will need to be reassigned</li>
            )}
          </ul>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isActionLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isActionLoading || isSuperAdmin}
            className="gap-2"
          >
            {isActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
