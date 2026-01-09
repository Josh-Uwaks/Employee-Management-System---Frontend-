// components/admin/dialogs/deleteDepartmentDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, Users, AlertCircle } from "lucide-react"
import { Department, Employee } from "@/lib/admin"
import { Badge } from "@/components/ui/badge"

interface DeleteDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  employees: Employee[]
  isActionLoading: boolean
  onDelete: () => void
}

export default function DeleteDepartmentDialog({
  open,
  onOpenChange,
  department,
  employees,
  isActionLoading,
  onDelete,
}: DeleteDepartmentDialogProps) {
  if (!department) return null

  const assignedEmployees = employees.filter(emp => 
    typeof emp.department === 'object' 
      ? emp.department._id === department._id 
      : emp.department === department._id
  )

  const canDelete = assignedEmployees.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Delete Department</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Department Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{department.name}</h3>
              <Badge variant="outline" className="font-mono">
                {department.code || 'NO-CODE'}
              </Badge>
            </div>
            {department.description && (
              <p className="text-sm text-slate-600">{department.description}</p>
            )}
          </div>

          {/* Warning Messages */}
          {!canDelete ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 mb-2">
                    Cannot Delete Department
                  </p>
                  <p className="text-sm text-amber-700">
                    This department has <strong>{assignedEmployees.length} employee(s)</strong> assigned to it.
                    You must reassign or remove these employees before deleting the department.
                  </p>
                  
                  <div className="mt-3 text-xs text-amber-600">
                    <p className="font-medium mb-1">Assigned Employees:</p>
                    <ul className="space-y-1">
                      {assignedEmployees.slice(0, 3).map(emp => (
                        <li key={emp._id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>{emp.first_name} {emp.last_name} ({emp.id_card})</span>
                        </li>
                      ))}
                      {assignedEmployees.length > 3 && (
                        <li className="text-amber-500">
                          + {assignedEmployees.length - 3} more employee(s)
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 mb-2">
                    Permanent Deletion
                  </p>
                  <p className="text-sm text-red-700">
                    This will permanently delete the "{department.name}" department from the system.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
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
            disabled={!canDelete || isActionLoading}
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
                Delete Department
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}