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

interface CreateDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: DepartmentFormData
  isActionLoading: boolean
  onFormDataChange: (data: DepartmentFormData) => void
  onCreate: () => void
}

export default function CreateDepartmentDialog({
  open,
  onOpenChange,
  formData,
  isActionLoading,
  onFormDataChange,
  onCreate,
}: CreateDepartmentDialogProps) {
  // Official Company Brand Color
  const BRAND_COLOR = "#ec3338";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-t-4" style={{ borderTopColor: BRAND_COLOR }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Create New Department
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Establish a new organizational unit and define its primary identifier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Department Name - 2/3 width */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department Name *
              </Label>
              <Input
                id="name"
                className="focus-visible:ring-[#ec3338]"
                placeholder="e.g., Human Resources"
                value={formData.name}
                onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
              />
            </div>

            {/* Department Code - 1/3 width */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code
              </Label>
              <Input
                id="code"
                className="focus-visible:ring-[#ec3338] font-mono text-center uppercase"
                placeholder="HR"
                maxLength={10}
                value={formData.code}
                onChange={(e) => onFormDataChange({...formData, code: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              className="focus-visible:ring-[#ec3338] resize-none"
              placeholder="Briefly describe the department's mandate or responsibilities..."
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
            onClick={onCreate}
            disabled={isActionLoading || !formData.name.trim()}
            className="text-white transition-all active:scale-95 px-6"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {isActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Create Department"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}