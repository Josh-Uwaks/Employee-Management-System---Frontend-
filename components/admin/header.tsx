import { Button } from "@/components/ui/button"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  Clock, 
  RefreshCw, 
  Bell, 
  ChevronRight, 
  LayoutDashboard,
  Settings,
  HelpCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  activeView: string
  currentTime: Date
  isLoading: boolean
  isActionLoading: boolean
  onReloadData: () => void
}

export default function Header({
  activeView,
  currentTime,
  isLoading,
  isActionLoading,
  onReloadData,
}: HeaderProps) {
  // Format view title with proper casing
  const formatViewTitle = (view: string) => {
    return view
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <TooltipProvider>
      <header className="h-20 flex items-center justify-between px-6 lg:px-8 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        
        {/* Left Side: Breadcrumbs & View Title */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <LayoutDashboard size={12} className="text-red-600" />
              </div>
              <span className="font-bold text-slate-700">KADICK</span>
              <ChevronRight size={12} className="text-slate-300 mx-1" />
              <span className="text-slate-600">Admin Panel</span>
              <ChevronRight size={12} className="text-slate-300 mx-1" />
              <span className="text-red-600 font-semibold">{formatViewTitle(activeView)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatViewTitle(activeView)}
            </h1> */}
            {isLoading && (
              <Badge variant="outline" className="h-6 px-2 text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 animate-pulse">
                Syncing...
              </Badge>
            )}
            {isActionLoading && (
              <Badge variant="outline" className="h-6 px-2 text-xs font-medium border-amber-200 bg-amber-50 text-amber-700 animate-pulse">
                Processing...
              </Badge>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Utilities */}
        <div className="flex items-center gap-4">
          {/* Time Display */}
          <div className="hidden lg:flex items-center gap-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm">
            <div className="relative">
              <Clock size={16} className="text-red-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                {currentTime.toLocaleTimeString("en-NG", { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                GMT+1
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-1 hidden md:block" />

          {/* Utility Icons */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200"
                >
                  <HelpCircle size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5">
                Support & Documentation
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200"
                >
                  <Settings size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5">
                System Settings
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 text-slate-500 hover:text-red-600 hover:bg-red-50/80 relative transition-all duration-200 group"
                >
                  <Bell size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5">
                Notifications
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Primary Action: Sync Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onReloadData} 
                disabled={isLoading || isActionLoading} 
                className={`
                  relative overflow-hidden group rounded-xl px-5 h-11 gap-3 
                  transition-all duration-300 shadow-sm border
                  ${isLoading || isActionLoading 
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-br from-slate-900 to-slate-800 hover:from-red-600 hover:to-red-700 text-white border-slate-700 hover:border-red-500 active:scale-[0.98]"
                  }
                `}
              >
                <div className="relative">
                  <RefreshCw 
                    size={18} 
                    className={`
                      transition-all duration-500
                      ${isLoading || isActionLoading 
                        ? "animate-spin" 
                        : "group-hover:rotate-180"
                      }
                    `} 
                  />
                  {!isLoading && !isActionLoading && (
                    <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                  )}
                </div>
                <span className="font-bold text-sm tracking-tight">
                  {isLoading || isActionLoading ? "Syncing..." : "Sync"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5">
              Refresh all dashboard data
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}