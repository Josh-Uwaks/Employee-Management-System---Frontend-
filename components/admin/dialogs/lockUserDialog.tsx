import { Employee } from "@/lib/admin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Lock } from "lucide-react"

interface LockUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  lockReason: string
  isActionLoading: boolean
  onLockReasonChange: (reason: string) => void
  onLock: () => void
}

export default function LockUserDialog({
  open,
  onOpenChange,
  employee,
  lockReason,
  isActionLoading,
  onLockReasonChange,
  onLock,
}: LockUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Lock size={20} /> Lock Account
          </DialogTitle>
          <DialogDescription>
            Restrict {employee?.first_name} {employee?.last_name} from accessing the system immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <Label>Lock Reason (Visible to user)</Label>
          <Textarea 
            placeholder="Suspicious activity, policy violation, etc..." 
            value={lockReason}
            onChange={(e) => onLockReasonChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {/* TEMP: pause submit to inspect lockReason */}
          <Button
            variant="destructive"
            onClick={onLock}
            disabled={isActionLoading}
          >
            Proceed to Lock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}