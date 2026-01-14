import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  LogOut, 
  ChevronLeft, 
  Menu,
  LayoutDashboard,
  Users,
  Activity,
  Building,
  ShieldAlert,
  BarChart3,
  LucideIcon
} from "lucide-react"

type ViewType = "overview" | "employees" | "activities" | "departments" | "locked" | "analytics"

interface SidebarProps {
  sidebarOpen: boolean
  activeView: ViewType
  userName: string
  userRole?: string
  stats: {
    total: number
    active: number
    locked: number
    unverified: number
  }
  activitiesStats?: any
  departmentsCount: number
  availableViews: {
    id: ViewType;
    label: string;
    icon: LucideIcon;
  }[]
  onToggleSidebar: () => void
  onViewChange: (view: ViewType) => void
  onLogout: () => void
}

const defaultNavigationItems: Array<{id: ViewType, icon: LucideIcon, label: string}> = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "employees", icon: Users, label: "Employee List" },
  { id: "activities", icon: Activity, label: "Activities" },
  { id: "departments", icon: Building, label: "Departments" },
  { id: "locked", icon: ShieldAlert, label: "Locked Accounts" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
]

export default function Sidebar({
  sidebarOpen,
  activeView,
  userName,
  userRole,
  stats,
  activitiesStats,
  departmentsCount,
  availableViews = defaultNavigationItems,
  onToggleSidebar,
  onViewChange,
  onLogout,
}: SidebarProps) {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const getItemCount = (id: ViewType) => {
    switch (id) {
      case "employees": return stats.total
      case "activities": return activitiesStats?.total || undefined
      case "departments": return departmentsCount
      case "locked": return stats.locked
      default: return undefined
    }
  }

  return (
    <aside 
      className={`relative h-screen flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* 1. Header Section */}
      <div className="h-20 flex items-center px-6">
        <div className={`transition-all duration-300 ${!sidebarOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
          {sidebarOpen && (
            <img src="/kadick_logo.png" alt="Kadick" className="h-10 w-auto object-contain" />
          )}
        </div>
      </div>

      {/* 2. Toggle Button - Subtler styling */}
      <button
        onClick={onToggleSidebar}
        className="absolute -right-3 top-7 h-6 w-6 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm text-slate-400 hover:text-[#ec3338] transition-all z-50 group"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <Menu size={12} />}
      </button>

      {/* 3. Navigation Section */}
      <TooltipProvider delayDuration={0}>
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {availableViews.map((item) => {
              const Icon = item.icon
              const count = getItemCount(item.id)
              const isActive = activeView === item.id
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onViewChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative group ${
                        isActive 
                          ? "bg-[#ec3338] text-white shadow-sm shadow-red-100" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon 
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`${!sidebarOpen && "mx-auto"}`} 
                      />
                      
                      {sidebarOpen && (
                        <>
                          <span className={`flex-1 text-left text-sm tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                            {item.label}
                          </span>
                          {count !== undefined && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                              isActive ? "bg-white/20 text-white font-bold" : "bg-slate-100 text-slate-500 font-semibold"
                            }`}>
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right" sideOffset={15} className="bg-slate-900 text-white border-none font-medium text-xs">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>
        </ScrollArea>
      </TooltipProvider>

      {/* 4. Footer Section */}
      <div className="p-4">
        <div className={`flex flex-col gap-2 rounded-xl transition-all ${sidebarOpen ? "bg-slate-50 p-3" : "items-center"}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-[#ec3338] flex items-center justify-center text-white text-xs font-bold">
                {userName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-slate-900">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {userRole || "Administrator"}
                </p>
              </div>
            </div>
          ) : (
             <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold hover:text-[#ec3338] transition-colors cursor-pointer">
                {userName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLogoutConfirmOpen(true)} 
            className={`text-slate-500 hover:text-[#ec3338] hover:bg-red-50 transition-all h-8 ${
              !sidebarOpen ? "w-10 px-0 mt-2" : "w-full justify-start gap-3 mt-1 px-2"
            }`}
          >
            <LogOut size={14} />
            {sidebarOpen && <span className="text-xs font-semibold">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Dialog Implementation */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#ec3338] font-semibold">Confirm Sign Out</DialogTitle>
          </DialogHeader>
          <div className="mt-1 text-sm text-slate-500 font-normal">
            Are you sure you want to sign out? You will be redirected to the login page.
          </div>
          <DialogFooter className="sm:justify-between mt-6">
            <Button type="button" variant="outline" onClick={() => setLogoutConfirmOpen(false)} className="font-medium">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setLogoutConfirmOpen(false)
                onLogout()
              }}
              className="bg-[#ec3338] hover:bg-[#d42d32] text-white font-semibold"
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}