import { Employee } from "@/lib/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Shield, 
  Unlock, 
  Lock, 
  AlertTriangle, 
  UserX, 
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  Building
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LockedAccountsProps {
  lockedAccounts: any[]
  authUser: any
  formatDate: (date?: string | null) => string
  onUnlock: (account: any) => void
  canManageUser: (employee: Employee) => boolean
  // New optional prop for location display
  getFullLocation?: (employee: Employee) => string
}

export default function LockedAccounts({
  lockedAccounts,
  authUser,
  formatDate,
  onUnlock,
  canManageUser,
  getFullLocation,
}: LockedAccountsProps) {

  console.log("Locked Accounts:", lockedAccounts);

  // Helper function to get location display
  const getLocationDisplay = (account: any): string => {
    if (getFullLocation) {
      return getFullLocation(account as Employee);
    }
    // Fallback if getFullLocation is not provided
    if (account.region && account.branch) {
      return `${account.region} - ${account.branch}`;
    }
    return account.region || account.branch || "Not specified";
  };
  
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-rose-600" size={20} />
            <CardTitle className="text-lg font-bold">Security Management</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Accounts manually locked or disabled by security policy
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {lockedAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Shield className="text-slate-300" size={32} />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">All accounts are secure</h3>
            <p className="text-sm text-slate-500 max-w-md">
              No locked accounts detected. All user accounts are currently active and accessible.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-rose-700">Total Locked</p>
                    <p className="text-xl font-bold text-rose-900">{lockedAccounts.length}</p>
                  </div>
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Lock className="text-rose-600" size={18} />
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-700">With Reasons</p>
                    <p className="text-xl font-bold text-amber-900">
                      {lockedAccounts.filter(a => a.lockedReason).length}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="text-amber-600" size={18} />
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700">Super Admin</p>
                    <p className="text-xl font-bold text-slate-900">
                      {lockedAccounts.filter(a => a.role === "SUPER_ADMIN").length}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <ShieldAlert className="text-slate-600" size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Locked Accounts List */}
            <div className="space-y-3">
              {lockedAccounts.map((account) => {
                const restricted = !canManageUser(account as Employee)
                const isSuperAdmin = account.role === "SUPER_ADMIN"
                const hasLocation = account.region || account.branch;
                
                return (
                  <div 
                    key={account._id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all",
                      restricted 
                        ? "bg-amber-50/30 border-amber-100" 
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border",
                          restricted 
                            ? "bg-amber-100 border-amber-200 text-amber-600" 
                            : "bg-rose-100 border-rose-200 text-rose-600"
                        )}>
                          <Lock size={20} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {account.first_name} {account.last_name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                isSuperAdmin 
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700" 
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              )}
                            >
                              {account.role}
                            </Badge>
                            {isSuperAdmin && (
                              <Badge 
                                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
                              >
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          {account.lockedReason && (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={12} />
                              <div>
                                <p className="text-xs font-medium text-slate-700 mb-0.5">Lock Reason</p>
                                <p className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  {account.lockedReason}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Locked: {formatDate(account.lockedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserX size={12} />
                              <span>ID: {account.id_card}</span>
                            </div>
                            
                            {/* Location Display */}
                            {hasLocation && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help border-b border-dashed border-slate-300">
                                      {getLocationDisplay(account)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="space-y-1">
                                      <p className="text-sm flex items-center gap-1">
                                        <Building size={12} />
                                        Region: {account.region || "Not specified"}
                                      </p>
                                      <p className="text-sm flex items-center gap-1">
                                        <MapPin size={12} />
                                        Branch: {account.branch || "Not specified"}
                                      </p>
                                      {getFullLocation && (
                                        <p className="text-sm font-medium mt-1 pt-1 border-t border-slate-200">
                                          Location: {getFullLocation(account as Employee)}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                            
                            {account.email && (
                              <div className="flex items-center gap-1 truncate max-w-[180px]">
                                <span className="text-slate-400">•</span>
                                <span>{account.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {restricted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 border-slate-200 text-slate-600 bg-white cursor-not-allowed"
                              disabled
                            >
                              <Unlock size={14} />
                              Unlock Account
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-sm">Insufficient permissions to modify this account</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all"
                          onClick={() => onUnlock(account)}
                        >
                          <Unlock size={14} />
                          Unlock Account
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="text-slate-600">
                  Showing <span className="font-semibold">{lockedAccounts.length}</span> locked account{lockedAccounts.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span>Locked Account</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Restricted Access</span>
                  </div>
                  {lockedAccounts.some(a => a.region || a.branch) && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Location Info</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}