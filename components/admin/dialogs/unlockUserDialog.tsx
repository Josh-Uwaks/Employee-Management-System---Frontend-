"use client"

import { Employee } from "@/lib/admin"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Unlock } from "lucide-react"

interface UnlockUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  isActionLoading: boolean
  onUnlock: () => void // ✅ Changed from onLock to onUnlock
}

export default function UnlockUserDialog({
  open,
  onOpenChange,
  employee,
  isActionLoading,
  onUnlock, // ✅ Changed from onLock to onUnlock
}: UnlockUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2">
            <Unlock size={20} /> Unlock Account
          </DialogTitle>
          <DialogDescription>
            Restore access for {employee?.first_name} {employee?.last_name}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700" 
            onClick={onUnlock} // ✅ Changed from onLock to onUnlock
            disabled={isActionLoading}
          >
            Restore Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}