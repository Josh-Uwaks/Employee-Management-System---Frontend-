import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ActionIconProps {
  tip: string
  icon: any
  color: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

export default function ActionIcon({ 
  tip, 
  icon: Icon, 
  color, 
  onClick, 
  disabled, 
  className 
}: ActionIconProps) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 hover:bg-blue-50 border-blue-200",
    red: "text-red-600 hover:bg-red-50 border-red-200",
    green: "text-green-600 hover:bg-green-50 border-green-200",
    amber: "text-amber-600 hover:bg-amber-50 border-amber-200",
    emerald: "text-emerald-600 hover:bg-emerald-50 border-emerald-200",
    rose: "text-rose-600 hover:bg-rose-50 border-rose-200"
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-8 w-8 rounded-lg border transition-all duration-200",
            colorMap[color],
            className
          )} 
          onClick={onClick} 
          disabled={disabled}
        >
          <Icon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-medium">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}