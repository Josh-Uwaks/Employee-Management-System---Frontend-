// activity-calendar.tsx - MODERN REDESIGN
// Replace your existing activity-calendar.tsx with this code

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Circle } from "lucide-react";
import { useState } from "react";

interface ActivityCalendarProps {
  employeeId: string;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  maxDate: Date;
  activityDates: Date[];
}

export default function ActivityCalendar({
  selectedDate,
  onDateSelect,
  maxDate,
  activityDates,
}: ActivityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(selectedDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isActivityDay = (date: Date): boolean => {
    return activityDates.some((activityDate) => isSameDay(activityDate, date));
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date): boolean => {
    return isSameDay(date, selectedDate);
  };

  const isFutureDate = (date: Date): boolean => {
    return date > maxDate;
  };

  const handleDateClick = (date: Date) => {
    if (!isFutureDate(date)) {
      onDateSelect(date);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (nextMonth <= maxDate) {
      setCurrentMonth(nextMonth);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth();
  const isNextMonthDisabled = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > maxDate;

  return (
    <div className="w-full">
      <Card className="shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-0">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevMonth}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-white hover:bg-white/20 hover:text-white rounded-lg transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/90" />
                <span className="text-xl font-bold text-white">
                  {monthName}
                </span>
              </div>

              <Button
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 rounded-lg transition-all duration-200",
                  isNextMonthDisabled
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/20 hover:text-white"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="h-9" />;
                }

                const hasActivity = isActivityDay(day);
                const today = isToday(day);
                const selected = isSelected(day);
                const isFuture = isFutureDate(day);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    disabled={isFuture}
                    className={cn(
                      "relative h-9 rounded-lg text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center",
                      "focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1",
                      "text-slate-700 hover:bg-slate-100",
                      selected && "bg-red-600 text-white shadow-md shadow-red-200 scale-105 transform",
                      today && !selected && "ring-2 ring-red-500 bg-red-50 text-red-700 font-bold",
                      isFuture && "opacity-40 cursor-not-allowed",
                      !isFuture && !selected && "hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="relative z-10">{day.getDate()}</span>
                    
                    {/* Activity Indicator */}
                    {hasActivity && (
                      <Circle
                        className={cn(
                          "absolute bottom-0.5 w-1 h-1 fill-current",
                          selected ? "text-white" : "text-red-500"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Legend */}
         
    <div className="px-6 py-4 bg-gradient-to-br from-slate-50 to-slate-100 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-red-600 rounded-full"></div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Calendar Legend</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-600">{new Date().getDate()}</span>
                  </div>
                  <Circle className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 fill-current text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Has Activity</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg ring-2 ring-red-500 bg-red-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-700">{new Date().getDate()}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Today</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-red-600 shadow-md flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{new Date().getDate()}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Selected</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center opacity-40">
                    <span className="text-xs font-semibold text-slate-600">{new Date().getDate() + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Future</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

