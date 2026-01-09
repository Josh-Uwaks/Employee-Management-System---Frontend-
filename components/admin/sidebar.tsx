import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Shield, 
  LogOut, 
  Home, 
  Users, 
  Building, 
  ShieldAlert, 
  TrendingUp, 
  ChevronLeft, 
  Menu,
  BarChart3,
  LayoutDashboard,
  Activity,
  LucideIcon
} from "lucide-react"

// Define the type for view items
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

// Default navigation items (used as fallback)
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
  departmentsCount,
  availableViews = defaultNavigationItems,
  onToggleSidebar,
  onViewChange,
  onLogout,
}: SidebarProps) {
  const getItemCount = (id: ViewType) => {
    switch (id) {
      case "employees": return stats.total
      case "departments": return departmentsCount
      case "locked": return stats.locked
      default: return undefined
    }
  }

  return (
    <aside 
      className={`relative h-screen flex flex-col border-r bg-slate-50/50 backdrop-blur-xl transition-all duration-500 ease-in-out ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header Section */}
      <div className="h-16 flex items-center px-4 mb-2">
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${!sidebarOpen && "mx-auto"}`}>
          <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-200">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              KADICK <span className="text-red-600">ADMIN</span>
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button - Floating Style */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onToggleSidebar}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border shadow-sm bg-white hover:bg-slate-50 z-50"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
      </Button>

      {/* Navigation Section */}
      <TooltipProvider delayDuration={0}>
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1.5">
            {availableViews.map((item) => {
              const Icon = item.icon
              const count = getItemCount(item.id)
              const isActive = activeView === item.id
              
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onViewChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                          ? "bg-white text-red-600 shadow-sm ring-1 ring-slate-200" 
                          : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-red-600 rounded-full" />
                      )}
                      
                      <Icon 
                        width={20}
                        height={20}
                        className={`transition-transform duration-200 ${
                          isActive ? "scale-110" : "group-hover:scale-110"
                        } ${!sidebarOpen && "mx-auto"}`} 
                      />
                      
                      {sidebarOpen && (
                        <>
                          <span className={`flex-1 text-left text-sm font-medium transition-colors ${
                            isActive ? "text-slate-900" : ""
                          }`}>
                            {item.label}
                          </span>
                          {count !== undefined && (
                            <Badge 
                              variant="secondary" 
                              className={`ml-auto font-bold px-1.5 h-5 min-w-[20px] justify-center ${
                                isActive ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {count}
                            </Badge>
                          )}
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right" className="bg-slate-900 text-white border-none">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>
        </ScrollArea>
      </TooltipProvider>

      {/* Footer Section (User Profile & Logout) */}
      <div className="p-3 border-t bg-white/50">
        {sidebarOpen ? (
          <div className="mb-4 p-2 rounded-xl bg-slate-100/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-900 leading-none mb-1">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">{userRole || "Administrator"}</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex justify-center">
             <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          onClick={onLogout} 
          className={`w-full gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl ${
            !sidebarOpen && "px-0 justify-center"
          }`}
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
        </Button>
      </div>
    </aside>
  )
}