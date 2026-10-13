import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Maximize2,
  Minimize2,
  Plus,
  Check,
  Calendar,
  Sparkles,
  Settings2,
  Clock,
  RotateCcw,
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Compass,
} from 'lucide-react';
import { Task, WidgetSize, WidgetTheme, Priority } from '../types';
import {
  getTodayJalaliString,
  getTodayJalali,
  formatFullJalaliDate,
  toPersianDigits,
  getFriendlyJalaliLabel,
  addDaysToJalali,
  parseJalaliString,
} from '../utils/jalali';
import confetti from 'canvas-confetti';

interface AndroidWidgetProps {
  tasks: Task[];
  completedTasks?: Task[];
  onToggleComplete: (id: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'rolloverCount'>) => void;
  onMoveTask?: (fromId: string, toId: string) => void;
  onOpenAppView?: () => void;
  isDarkTheme?: boolean;
}

const WALLPAPERS = [
  { id: 'light-gradient', name: 'روشن متریال', bg: 'bg-gradient-to-tr from-sky-200 via-indigo-100 to-amber-100', isLight: true },
  { id: 'light-minimal', name: 'روشن برفی', bg: 'bg-gradient-to-b from-slate-100 to-blue-100', isLight: true },
  { id: 'material', name: 'متریال اندروید تیره', bg: 'bg-gradient-to-tr from-indigo-900 via-purple-950 to-slate-900', isLight: false },
  { id: 'nature', name: 'طبیعت کوهستان', bg: 'bg-gradient-to-b from-sky-800 via-teal-900 to-emerald-950', isLight: false },
  { id: 'sunset', name: 'غروب آفتاب', bg: 'bg-gradient-to-tr from-amber-900 via-rose-950 to-purple-950', isLight: false },
  { id: 'dark', name: 'مشکی خالص AMOLED', bg: 'bg-neutral-950', isLight: false },
];

export const AndroidWidget: React.FC<AndroidWidgetProps> = ({
  tasks,
  completedTasks = [],
  onToggleComplete,
  onAddTask,
  onMoveTask,
  onOpenAppView,
  isDarkTheme = false,
}) => {
  const todayStr = getTodayJalaliString();

  // Widget date navigation state (allow going to yesterday/tomorrow)
  const [widgetDate, setWidgetDate] = useState<string>(todayStr);

  // Widget size state: '2x2' | '4x1' | '4x2' | '4x4' | 'custom'
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('4x2');
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>(() => {
    try { return JSON.parse(window.DailyTasksNative?.getWidgetPrefs() || '{}').theme || (isDarkTheme ? 'dark' : 'light'); }
    catch { return isDarkTheme ? 'dark' : 'light'; }
  });
  const [opacity, setOpacity] = useState<number>(() => {
    try { return JSON.parse(window.DailyTasksNative?.getWidgetPrefs() || '{}').opacity ?? 95; }
    catch { return 95; }
  });
  useEffect(() => {
    window.DailyTasksNative?.syncWidgetPrefs(JSON.stringify({ theme: widgetTheme, opacity }));
  }, [widgetTheme, opacity]);
  const [wallpaperIndex, setWallpaperIndex] = useState<number>(isDarkTheme ? 2 : 0);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Custom resize state
  const [customWidth, setCustomWidth] = useState<number>(360);
  const [customHeight, setCustomHeight] = useState<number>(340);

  // Filter tasks for this widget date
  const isPast = widgetDate < todayStr;
  const isToday = widgetDate === todayStr;

  const pendingForDate = tasks.filter((t) => t.jalaliDate === widgetDate && !t.completed);
  const completedForDate = completedTasks.filter(
    (t) => (t.completedJalaliDate || t.jalaliDate) === widgetDate
  );

  const displayedTasks = isPast ? [...pendingForDate, ...completedForDate] : pendingForDate;

  // Priority count stats
  const highCount = displayedTasks.filter((t) => t.priority === 'high' && !t.completed).length;
  const mediumCount = displayedTasks.filter((t) => t.priority === 'medium' && !t.completed).length;
  const lowCount = displayedTasks.filter((t) => t.priority === 'low' && !t.completed).length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    onAddTask({
      title: quickTitle.trim(),
      priority: quickPriority,
      jalaliDate: widgetDate,
    });

    setQuickTitle('');
    setShowQuickAdd(false);
  };

  const handleWidgetCheck = (taskId: string, priority: Priority) => {
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
        colors:
          priority === 'high'
            ? ['#ef4444', '#f87171']
            : priority === 'medium'
            ? ['#10b981', '#34d399']
            : ['#3b82f6', '#60a5fa'],
      });
    } catch {
      // Ignore
    }
    onToggleComplete(taskId);
  };

  // Theme styles for widget card (fully supports Light and Dark)
  const getThemeClasses = () => {
    switch (widgetTheme) {
      case 'light':
        return 'bg-white/95 text-slate-800 border-slate-200/90 shadow-xl';
      case 'dark':
        return 'bg-slate-900 text-white border-slate-700 shadow-xl';
      case 'amoled':
        return 'bg-black text-white border-neutral-800 shadow-2xl';
      case 'glass':
        return isDarkTheme
          ? 'backdrop-blur-xl bg-slate-900/80 text-white border-white/20 shadow-2xl'
          : 'backdrop-blur-xl bg-white/85 text-slate-800 border-slate-300 shadow-2xl';
      case 'material':
        return isDarkTheme
          ? 'backdrop-blur-md bg-indigo-950/85 text-white border-indigo-500/30 shadow-2xl'
          : 'backdrop-blur-md bg-indigo-50/90 text-indigo-950 border-indigo-200 shadow-2xl';
      default:
        return 'bg-white text-slate-800 border-slate-200 shadow-xl';
    }
  };

  const getSizeContainerStyle = () => {
    switch (widgetSize) {
      case '2x2':
        return { width: '220px', minHeight: '220px' };
      case '4x1':
        return { width: '100%', maxWidth: '440px', minHeight: '90px' };
      case '4x2':
        return { width: '100%', maxWidth: '440px', minHeight: '300px' };
      case '4x4':
        return { width: '100%', maxWidth: '440px', minHeight: '480px' };
      case 'custom':
        return { width: `${customWidth}px`, height: `${customHeight}px` };
    }
  };

  const getPriorityBorder = (p: Priority) => {
    if (p === 'high') return 'border-r-3 border-r-red-500';
    if (p === 'medium') return 'border-r-3 border-r-emerald-500';
    return 'border-r-3 border-r-blue-500';
  };

  const currentWallpaper = WALLPAPERS[wallpaperIndex] || WALLPAPERS[0];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Controls Bar */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
            ویجت اندروید
          </span>
        </div>

        {/* Size Selection Pill Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setWidgetSize('2x2')}
            className={`px-2.5 py-1 rounded-lg transition ${
              widgetSize === '2x2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ۲×۲
          </button>
          <button
            onClick={() => setWidgetSize('4x1')}
            className={`px-2.5 py-1 rounded-lg transition ${
              widgetSize === '4x1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ۴×۱
          </button>
          <button
            onClick={() => setWidgetSize('4x2')}
            className={`px-2.5 py-1 rounded-lg transition ${
              widgetSize === '4x2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ۴×۲
          </button>
          <button
            onClick={() => setWidgetSize('4x4')}
            className={`px-2.5 py-1 rounded-lg transition ${
              widgetSize === '4x4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ۴×۴
          </button>
        </div>

        {/* Theme and appearance config toggle */}
        <button
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition ${
            showConfigPanel ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="تنظیم تم و والپیپر ویجت"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings configuration drawer */}
      <AnimatePresence>
        {showConfigPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5 shadow-sm text-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Wallpaper */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  والپیپر گوشی
                </label>
                <select
                  value={wallpaperIndex}
                  onChange={(e) => setWallpaperIndex(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  {WALLPAPERS.map((w, idx) => (
                    <option key={w.id} value={idx}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  تم رنگی ویجت
                </label>
                <select
                  value={widgetTheme}
                  onChange={(e) => setWidgetTheme(e.target.value as WidgetTheme)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="light">روشن برفی (Light)</option>
                  <option value="glass">شیشه‌ای (Glass)</option>
                  <option value="dark">تیره (Dark)</option>
                  <option value="amoled">مشکی خالص (AMOLED)</option>
                  <option value="material">متریال یو</option>
                </select>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  شفافیت ({toPersianDigits(opacity)}٪)
                </label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android Device Mockup */}
      <div className="relative w-full max-w-[460px] rounded-[44px] border-[9px] border-slate-850 dark:border-slate-900 shadow-2xl p-4 overflow-hidden min-h-[600px] flex flex-col justify-between select-none">
        {/* Device Wallpaper Background */}
        <div className={`absolute inset-0 ${currentWallpaper.bg} transition-colors duration-500`} />

        {/* Android Punch Hole Camera & Status Bar */}
        <div
          className={`relative z-20 flex items-center justify-between px-3 py-1 text-xs font-mono ${
            currentWallpaper.isLight ? 'text-slate-800' : 'text-white/90'
          }`}
        >
          <span>{new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/20 mx-auto" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <span>۹۸٪</span>
          </div>
        </div>

        {/* Home Screen Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-start py-3 w-full">
          {/* THE RESIZABLE ANDROID WIDGET */}
          <motion.div
            layout
            style={{
              ...getSizeContainerStyle(),
              opacity: opacity / 100,
            }}
            className={`relative rounded-3xl border ${getThemeClasses()} p-3.5 flex flex-col transition-all duration-300 overflow-hidden shadow-xl`}
          >
            {/* Widget Top Header: "کارهای روزانه" & Day Navigation */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-xs tracking-tight">کارهای روزانه</span>
                <span className="text-[10px] opacity-70">
                  ({toPersianDigits(displayedTasks.length)})
                </span>
              </div>

              {/* Day Navigation within the Widget */}
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setWidgetDate(addDaysToJalali(widgetDate, -1))}
                  title="روز قبل"
                  className="p-0.5 hover:opacity-100 opacity-70"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold px-1">
                  {widgetDate === todayStr ? 'امروز' : getFriendlyJalaliLabel(widgetDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setWidgetDate(addDaysToJalali(widgetDate, 1))}
                  title="روز بعد"
                  className="p-0.5 hover:opacity-100 opacity-70"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Add Button */}
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                type="button"
                title="افزودن کار در ویجت"
                className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Add Input in Widget */}
            <AnimatePresence>
              {showQuickAdd && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleQuickAdd}
                  className="mb-2 pb-2 border-b border-current/10 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="عنوان کار جدید..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-black/5 dark:bg-black/30 text-current placeholder-current/50 border border-current/20 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500"
                    >
                      ثبت
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="opacity-75">رنگ:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuickPriority('high')}
                        aria-label="قرمز"
                        className={`w-5 h-5 rounded-full bg-red-500 transition-all flex items-center justify-center ${
                          quickPriority === 'high' ? 'ring-2 ring-current scale-110 shadow-xs' : 'opacity-60'
                        }`}
                      >
                        {quickPriority === 'high' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPriority('medium')}
                        aria-label="سبز"
                        className={`w-5 h-5 rounded-full bg-emerald-500 transition-all flex items-center justify-center ${
                          quickPriority === 'medium' ? 'ring-2 ring-current scale-110 shadow-xs' : 'opacity-60'
                        }`}
                      >
                        {quickPriority === 'medium' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPriority('low')}
                        aria-label="آبی"
                        className={`w-5 h-5 rounded-full bg-blue-500 transition-all flex items-center justify-center ${
                          quickPriority === 'low' ? 'ring-2 ring-current scale-110 shadow-xs' : 'opacity-60'
                        }`}
                      >
                        {quickPriority === 'low' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Widget Content - Ultra Compact */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
              {displayedTasks.length === 0 ? (
                <div className="h-full min-h-[70px] flex flex-col items-center justify-center text-center p-2 opacity-60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                  <p className="text-xs font-medium">کاری برای این تاریخ نیست</p>
                </div>
              ) : (
                displayedTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-black/5 dark:bg-black/25 hover:bg-black/10 dark:hover:bg-black/40 border border-current/10 transition-all ${getPriorityBorder(
                      task.priority
                    )}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleWidgetCheck(task.id, task.priority)}
                        type="button"
                        title={task.completed ? 'بازگردانی' : 'تکمیل'}
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-current/40 hover:border-emerald-500'
                        }`}
                      >
                        {task.completed ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1 h-1 rounded-full opacity-60" />
                        )}
                      </button>

                      {/* Priority Dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          task.priority === 'high'
                            ? 'bg-red-500'
                            : task.priority === 'medium'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />

                      {/* Title */}
                      <span
                        className={`text-xs font-medium truncate text-right ${
                          task.completed ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Time */}
                    {task.time && (
                      <span className="text-[10px] opacity-70 flex items-center gap-0.5 flex-shrink-0 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {toPersianDigits(task.time)}
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Widget Footer */}
            <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] opacity-75">
              <span>{formatFullJalaliDate(parseJalaliString(widgetDate))}</span>

              {onOpenAppView && (
                <button
                  onClick={onOpenAppView}
                  className="hover:underline flex items-center gap-0.5 font-bold text-blue-500"
                >
                  <span>باز کردن برنامه</span>
                  <span>←</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Android Dock Icons */}
        <div
          className={`relative z-20 pt-3 pb-1 border-t border-current/10 flex items-center justify-around px-2 ${
            currentWallpaper.isLight ? 'text-slate-800' : 'text-white'
          }`}
        >
          <div
            onClick={onOpenAppView}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="text-[10px] font-medium">کارهای روزانه</span>
          </div>

          <div className="flex flex-col items-center gap-1 opacity-70">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[10px]">تلفن</span>
          </div>

          <div className="flex flex-col items-center gap-1 opacity-70">
            <div className="w-10 h-10 rounded-2xl bg-rose-800 flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px]">تقویم</span>
          </div>
        </div>

        {/* Android Gesture Bar */}
        <div className="w-28 h-1 bg-current opacity-30 rounded-full mx-auto mt-1" />
      </div>
    </div>
  );
};
