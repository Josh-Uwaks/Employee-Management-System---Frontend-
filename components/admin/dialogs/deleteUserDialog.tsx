// components/admin/dialogs/deleteUserDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Trash2, UserX } from "lucide-react"
import { Employee } from "@/lib/admin"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  isActionLoading: boolean
  onDelete: () => void
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  employee,
  isActionLoading,
  onDelete,
}: DeleteUserDialogProps) {
  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Delete User</DialogTitle>
              <DialogDescription>
                This action will permanently remove the user from the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{employee.first_name} {employee.last_name}</h3>
              <div className="text-xs text-slate-500 font-mono">{employee.id_card}</div>
            </div>
            <p className="text-sm text-slate-600">{employee.email}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 mb-2">Permanent Deletion</p>
                <p className="text-sm text-amber-700">This will permanently delete the user and cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isActionLoading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isActionLoading}
            className="gap-2"
          >
            {isActionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
