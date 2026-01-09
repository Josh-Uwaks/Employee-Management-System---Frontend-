// components/admin/StatCard.tsx
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: "blue" | "green" | "red" | "amber" | "purple" | "indigo"
  description?: string
  trend?: number
  loading?: boolean
}

const colorClasses = {
  blue: {
    bg: "from-blue-100 to-blue-200",
    icon: "text-blue-600",
    text: "text-blue-700",
    gradient: "from-blue-400 to-blue-500"
  },
  green: {
    bg: "from-emerald-100 to-emerald-200",
    icon: "text-emerald-600",
    text: "text-emerald-700",
    gradient: "from-emerald-400 to-emerald-500"
  },
  red: {
    bg: "from-red-100 to-red-200",
    icon: "text-red-600",
    text: "text-red-700",
    gradient: "from-red-400 to-red-500"
  },
  amber: {
    bg: "from-amber-100 to-amber-200",
    icon: "text-amber-600",
    text: "text-amber-700",
    gradient: "from-amber-400 to-amber-500"
  },
  purple: {
    bg: "from-purple-100 to-purple-200",
    icon: "text-purple-600",
    text: "text-purple-700",
    gradient: "from-purple-400 to-purple-500"
  },
  indigo: {
    bg: "from-indigo-100 to-indigo-200",
    icon: "text-indigo-600",
    text: "text-indigo-700",
    gradient: "from-indigo-400 to-indigo-500"
  }
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
  loading = false
}: StatCardProps) {
  const colors = colorClasses[color]

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          {trend !== undefined && (
            <span className={`text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>

        {/* Progress bar (optional) */}
        {typeof value === 'number' && (
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div 
              className={`bg-gradient-to-r ${colors.gradient} h-1.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.min((Number(value) / 100) * 100, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}