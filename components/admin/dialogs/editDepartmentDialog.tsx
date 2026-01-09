import { Department } from "@/lib/admin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
}

interface EditDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  formData: DepartmentFormData
  isActionLoading: boolean
  onFormDataChange: (data: DepartmentFormData) => void
  onSave: () => void
}

export default function EditDepartmentDialog({
  open,
  onOpenChange,
  department,
  formData,
  isActionLoading,
  onFormDataChange,
  onSave,
}: EditDepartmentDialogProps) {
  // Official Company Brand Color
  const BRAND_COLOR = "#ec3338";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-t-4" style={{ borderTopColor: BRAND_COLOR }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Department</DialogTitle>
          <DialogDescription>
            Modify department identification and organizational details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Department Name - Takes up 2/3 of the row */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department Name *
              </Label>
              <Input
                id="edit-name"
                className="focus-visible:ring-[#ec3338]"
                placeholder="e.g., Human Resources"
                value={formData.name}
                onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
              />
            </div>

            {/* Department Code - Takes up 1/3 of the row */}
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code
              </Label>
              <Input
                id="edit-code"
                className="focus-visible:ring-[#ec3338] font-mono"
                placeholder="e.g., HR"
                value={formData.code}
                onChange={(e) => onFormDataChange({...formData, code: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="edit-description"
              className="focus-visible:ring-[#ec3338] resize-none"
              placeholder="Provide a brief overview of department functions..."
              rows={4}
              value={formData.description}
              onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            disabled={isActionLoading || !formData.name.trim()}
            className="text-white transition-all active:scale-95"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isActionLoading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}