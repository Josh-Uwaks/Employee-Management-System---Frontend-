import { Button } from "@/components/ui/button"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  Clock, 
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
  
  const formatViewTitle = (view: string) => {
    return view
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <TooltipProvider>
      <header className="h-16 flex items-center justify-between px-6 lg:px-8 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30">
        
        {/* Left Side: Professional Breadcrumbs */}
        <div className="flex flex-col">
          <nav className="flex items-center gap-2 text-[12px] tracking-tight">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="p-1 rounded bg-slate-50 border border-slate-100">
                <LayoutDashboard size={12} className="text-slate-400" />
              </div>
              <span className="font-medium">Kadick</span>
            </div>
            
            <ChevronRight size={12} className="text-slate-300" />
            
            <span className="text-slate-400 font-medium px-1">Admin Panel</span>
            
            <ChevronRight size={12} className="text-slate-300" />
            
            <div className="flex items-center gap-2 px-1">
              <span className="text-[#ec3338] font-semibold">
                {formatViewTitle(activeView)}
              </span>
              
              {/* Status Indicators - Compact & Quiet */}
              <div className="flex gap-1 ml-2">
                {isLoading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Syncing</span>
                  </div>
                )}
                {isActionLoading && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Active</span>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Right Side: Actions & Utilities */}
        <div className="flex items-center gap-3">
          
          {/* Time Display - Reduced weight, tabular numbers for stability */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <Clock size={14} className="text-slate-400" />
            <div className="flex flex-col leading-none">
              <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">
                {currentTime.toLocaleTimeString("en-NG", { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                WAT / GMT+1
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden lg:block" />

          {/* Utility Icons - Harmonized sizing */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-lg h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <HelpCircle size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white text-[11px] font-medium">Support</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-lg h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Settings size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white text-[11px] font-medium">Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative rounded-lg h-9 w-9 text-slate-500 hover:text-[#ec3338] hover:bg-red-50 transition-all group"
                >
                  <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#ec3338] rounded-full ring-2 ring-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white text-[11px] font-medium">Alerts</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}