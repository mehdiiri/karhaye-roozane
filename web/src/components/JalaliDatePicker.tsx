import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Check } from 'lucide-react';
import {
  JALALI_MONTHS,
  SHORT_WEEKDAYS,
  JalaliDateObj,
  getDaysInJalaliMonth,
  getTodayJalali,
  formatJalaliString,
  parseJalaliString,
  jalaliToGregorian,
  toPersianDigits,
} from '../utils/jalali';
import { Task } from '../types';

interface JalaliDatePickerProps {
  selectedDate: string; // YYYY/MM/DD
  onSelectDate: (dateStr: string) => void;
  tasks?: Task[];
  onClose?: () => void;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  selectedDate,
  onSelectDate,
  tasks = [],
  onClose,
}) => {
  const currentSelected = parseJalaliString(selectedDate);
  const today = getTodayJalali();
  const todayStr = formatJalaliString(today);

  const [viewYear, setViewYear] = useState<number>(currentSelected.year);
  const [viewMonth, setViewMonth] = useState<number>(currentSelected.month);

  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);

  // Determine starting weekday of the 1st of the month (0 = شنبه, ..., 6 = جمعه)
  const gFirst = jalaliToGregorian(viewYear, viewMonth, 1);
  const gDate = new Date(gFirst.year, gFirst.month - 1, gFirst.day);
  const startWeekday = (gDate.getDay() + 1) % 7; // Saturday = 0

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(today.year);
    setViewMonth(today.month);
    onSelectDate(todayStr);
    if (onClose) onClose();
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatJalaliString({ year: viewYear, month: viewMonth, day });
    onSelectDate(formatted);
    if (onClose) onClose();
  };

  // Get task priorities for each day in this month to show dots
  const getDayDots = (day: number) => {
    const dayStr = formatJalaliString({ year: viewYear, month: viewMonth, day });
    const dayTasks = tasks.filter((t) => t.jalaliDate === dayStr && !t.completed);
    const hasHigh = dayTasks.some((t) => t.priority === 'high');
    const hasMedium = dayTasks.some((t) => t.priority === 'medium');
    const hasLow = dayTasks.some((t) => t.priority === 'low');
    return { count: dayTasks.length, hasHigh, hasMedium, hasLow };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm select-none">
      {/* Header Month / Year controls */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <span>{JALALI_MONTHS[viewMonth - 1]}</span>
          <span className="text-slate-500 text-sm font-normal">{toPersianDigits(viewYear)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNextMonth}
            type="button"
            title="ماه بعد"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleGoToday}
            type="button"
            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
          >
            امروز
          </button>
          <button
            onClick={handlePrevMonth}
            type="button"
            title="ماه قبل"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers: ش، ی، د، س، چ، پ، ج */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
        {SHORT_WEEKDAYS.map((w, idx) => (
          <div key={idx} className={idx === 6 ? 'text-rose-500' : ''}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before start weekday */}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayStr = formatJalaliString({ year: viewYear, month: viewMonth, day });
          const isSelected = dayStr === selectedDate;
          const isToday = dayStr === todayStr;
          const dots = getDayDots(day);
          const isFriday = (startWeekday + i) % 7 === 6;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`relative h-9 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold scale-105'
                  : isToday
                  ? 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                  : isFriday
                  ? 'text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{toPersianDigits(day)}</span>

              {/* Task Indicators */}
              {dots.count > 0 && !isSelected && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  {dots.hasHigh && <span className="w-1 h-1 rounded-full bg-red-500" />}
                  {dots.hasMedium && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                  {dots.hasLow && <span className="w-1 h-1 rounded-full bg-blue-500" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
