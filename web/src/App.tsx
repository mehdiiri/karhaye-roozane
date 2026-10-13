/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import './native/androidBridge';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Plus,
  Moon,
  Sun,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Compass,
  LayoutGrid,
  CheckSquare,
  Search,
} from 'lucide-react';

import { Task, Priority } from './types';
import {
  getTodayJalaliString,
  getTodayJalali,
  formatFullJalaliDate,
  toPersianDigits,
  parseJalaliString,
  addDaysToJalali,
  getFriendlyJalaliLabel,
  isBeforeJalali,
} from './utils/jalali';

import { TaskItem } from './components/TaskItem';
import { TaskInputModal } from './components/TaskInputModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { JalaliDatePicker } from './components/JalaliDatePicker';
import { AndroidWidget } from './components/AndroidWidget';
import { BadeSabaModal } from './components/BadeSabaModal';
import { CompletedArchiveModal } from './components/CompletedArchiveModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { readNativeState } from './native/androidBridge';

const STORAGE_KEY_TASKS = 'taskyar_tasks_v1';
const STORAGE_KEY_COMPLETED = 'taskyar_completed_archive_v1';
const STORAGE_KEY_THEME = 'taskyar_theme_mode';
// The native snapshot is authoritative after launcher-widget interactions.
const initialNativeState = readNativeState();

// Initial sample tasks on first launch
const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 'demo-1',
    title: 'بررسی ایمیل‌ها و هماهنگی جلسه کاری',
    description: 'جلسه ساعت ۱۱ با تیم طراحی',
    priority: 'high', // 🔴 قرمز
    jalaliDate: getTodayJalaliString(),
    time: '11:00',
    completed: false,
    createdAt: new Date().toISOString(),
    rolloverCount: 0,
  },
  {
    id: 'demo-2',
    title: 'پیاده‌روی عصرگاهی و خرید مایحتاج خانه',
    description: 'نان سنگک و میوه تازه',
    priority: 'medium', // 🟢 سبز
    jalaliDate: getTodayJalaliString(),
    time: '18:30',
    completed: false,
    createdAt: new Date().toISOString(),
    rolloverCount: 0,
  },
  {
    id: 'demo-3',
    title: 'مطالعه ۳۰ صفحه از کتاب جدید',
    description: 'کتاب عادت‌های اتمی',
    priority: 'low', // 🔵 آبی
    jalaliDate: getTodayJalaliString(),
    time: '21:00',
    completed: false,
    createdAt: new Date().toISOString(),
    rolloverCount: 0,
  },
];

export default function App() {
  const todayStr = getTodayJalaliString();
  const todayObj = getTodayJalali();

  // Active view: 'app' | 'widget'
  const [activeView, setActiveView] = useState<'app' | 'widget'>('app');

  // Selected date for viewing tasks
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isBadeSabaOpen, setIsBadeSabaOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Task Details Modal state (clicked task)
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [undoToast, setUndoToast] = useState<{ id: string; title: string } | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = initialNativeState?.theme || localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (initialNativeState) return initialNativeState.tasks as Task[];
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return window.DailyTasksNative ? [] : INITIAL_DEMO_TASKS;
  });

  // Completed Archive state
  const [completedArchive, setCompletedArchive] = useState<Task[]>(() => {
    try {
      if (initialNativeState) return initialNativeState.completedArchive as Task[];
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Apply dark class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDark]);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  // Save completed archive
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedArchive));
  }, [completedArchive]);

  // Persist a consistent single snapshot for the real launcher widget.
  useEffect(() => {
    try { window.DailyTasksNative?.syncState(JSON.stringify({tasks, completedArchive, theme: isDark ? 'dark' : 'light'})); }
    catch (e) { console.warn('Widget sync failed', e); }
  }, [tasks, completedArchive, isDark]);

  // A tap in the launcher widget can complete a task while the app is suspended.
  useEffect(() => {
    const refreshFromNative = () => {
      const incoming = readNativeState();
      if (!incoming) return;
      setTasks(incoming.tasks as Task[]);
      setCompletedArchive(incoming.completedArchive as Task[]);
    };
    const showAddTask = () => {
      setEditingTask(null);
      setActiveView('app');
      setIsTaskModalOpen(true);
    };
    window.addEventListener('daily-tasks-native-refresh', refreshFromNative);
    window.addEventListener('daily-tasks-open-add', showAddTask);
    return () => {
      window.removeEventListener('daily-tasks-native-refresh', refreshFromNative);
      window.removeEventListener('daily-tasks-open-add', showAddTask);
    };
  }, []);

  // Automatic Day Rollover Logic:
  // Incomplete tasks from past days are automatically added to today
  useEffect(() => {
    let hasRolled = false;
    const updated = tasks.map((t) => {
      if (!t.completed && isBeforeJalali(t.jalaliDate, todayStr)) {
        hasRolled = true;
        return {
          ...t,
          originalDate: t.originalDate || t.jalaliDate,
          jalaliDate: todayStr,
          rolloverCount: (t.rolloverCount || 0) + 1,
        };
      }
      return t;
    });

    if (hasRolled) {
      setTasks(updated);
    }
  }, [todayStr]);

  // Handlers
  const handleToggleComplete = (id: string) => {
    // 1. If currently in active tasks:
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      const completedTask: Task = {
        ...task,
        completed: true,
        completedAt: new Date().toISOString(),
        completedJalaliDate: selectedDate || task.jalaliDate || todayStr,
      };

      setTasks((prev) => prev.filter((t) => t.id !== id));
      setCompletedArchive((prev) => [completedTask, ...prev]);

      setUndoToast({ id: task.id, title: task.title });
      setTimeout(() => {
        setUndoToast((curr) => (curr?.id === task.id ? null : curr));
      }, 4000);
      return;
    }

    // 2. If it is already in completed archive (e.g. unchecking when viewing past day):
    const archivedIndex = completedArchive.findIndex((t) => t.id === id);
    if (archivedIndex !== -1) {
      const task = completedArchive[archivedIndex];
      const activeRestored: Task = {
        ...task,
        completed: false,
        completedAt: undefined,
        jalaliDate: todayStr,
      };
      setCompletedArchive((prev) => prev.filter((t) => t.id !== id));
      setTasks((prev) => [activeRestored, ...prev]);
    }
  };

  const handleUndoComplete = () => {
    if (!undoToast) return;
    const restored = completedArchive.find((t) => t.id === undoToast.id);
    if (restored) {
      const activeRestored: Task = {
        ...restored,
        completed: false,
        completedAt: undefined,
      };
      setCompletedArchive((prev) => prev.filter((t) => t.id !== undoToast.id));
      setTasks((prev) => [activeRestored, ...prev]);
    }
    setUndoToast(null);
  };

  const handleRestoreFromArchive = (taskId: string) => {
    const item = completedArchive.find((t) => t.id === taskId);
    if (item) {
      const activeItem: Task = {
        ...item,
        completed: false,
        completedAt: undefined,
        jalaliDate: todayStr,
      };
      setCompletedArchive((prev) => prev.filter((t) => t.id !== taskId));
      setTasks((prev) => [activeItem, ...prev]);
    }
  };

  const handleClearArchive = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تمام آرشیو کارهای انجام‌شده را پاک کنید؟')) {
      setCompletedArchive([]);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setCompletedArchive((prev) => prev.filter((t) => t.id !== id));
    if (selectedDetailTask?.id === id) {
      setIsDetailsOpen(false);
      setSelectedDetailTask(null);
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedDetailTask(task);
    setIsDetailsOpen(true);
  };

  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'rolloverCount'>
  ) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...taskData,
              }
            : t
        )
      );
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        completed: false,
        rolloverCount: 0,
        ...taskData,
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  // Reorder tasks by drag and drop
  const handleReorderTasks = (newOrder: Task[]) => {
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => !newOrder.some((n) => n.id === t.id));
      return [...newOrder, ...otherTasks];
    });
  };

  // Move task by ID (for widget reordering)
  const handleMoveTaskById = (fromId: string, toId: string) => {
    if (!fromId || !toId) return;
    setTasks((prev) => {
      const copy = [...prev];
      const indexA = copy.findIndex((t) => t.id === fromId);
      const indexB = copy.findIndex((t) => t.id === toId);
      if (indexA !== -1 && indexB !== -1) {
        const temp = copy[indexA];
        copy[indexA] = copy[indexB];
        copy[indexB] = temp;
      }
      return copy;
    });
  };

  // Import personal tasks received from Bade Saba backend
  const handleImportTasksFromBadeSaba = (newTasks: Task[]) => {
    setTasks((prev) => [...newTasks, ...prev]);
  };

  // Tasks for selected date:
  // If navigating to past days: display the completed tasks of that day!
  const isPastDate = selectedDate < todayStr;
  const isTodayDate = selectedDate === todayStr;

  const pendingForDate = tasks.filter((t) => t.jalaliDate === selectedDate && !t.completed);
  const completedForDate = completedArchive.filter(
    (t) => (t.completedJalaliDate || t.jalaliDate) === selectedDate
  );

  const tasksForSelectedDate = isPastDate ? [...pendingForDate, ...completedForDate] : pendingForDate;

  const filteredTasks = tasksForSelectedDate.filter((t) => {
    if (searchQuery.trim() && !t.title.includes(searchQuery.trim())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  کارهای روزانه
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatFullJalaliDate(parseJalaliString(todayStr))}
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Switcher: App View vs Android Widget */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-0.5 text-xs font-semibold">
              <button
                onClick={() => setActiveView('app')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  activeView === 'app'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">کارها</span>
              </button>

              <button
                onClick={() => setActiveView('widget')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  activeView === 'widget'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>ویجت</span>
              </button>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Bade Saba Backend Sync */}
            <button
              onClick={() => setIsBadeSabaOpen(true)}
              className="p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1 text-xs font-medium"
              title="دریافت تقویم شخصی از باد صبا"
            >
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">باد صبا</span>
            </button>

            {/* Completed Tasks Archive Button */}
            <button
              onClick={() => setIsArchiveOpen(true)}
              className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1.5 text-xs font-semibold"
              title="مشاهده کارهای انجام‌شده و بازگرداندن آنها"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>کارهای انجام‌شده ({toPersianDigits(completedArchive.length)})</span>
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تیره'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {/* Undo Toast */}
        <AnimatePresence>
          {undoToast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-slate-200 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>کار «{undoToast.title}» تیک خورد و از لیست حذف شد.</span>
              <button
                onClick={handleUndoComplete}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition mr-2"
              >
                بازگردانی
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW 1: ANDROID WIDGET SIMULATOR */}
        {activeView === 'widget' ? (
          <AndroidWidget
            tasks={tasks}
            completedTasks={completedArchive}
            onToggleComplete={handleToggleComplete}
            onAddTask={handleSaveTask}
            onMoveTask={handleMoveTaskById}
            onOpenAppView={() => setActiveView('app')}
            isDarkTheme={isDark}
          />
        ) : (
          /* VIEW 2: CLEAN APP VIEW */
          <div className="space-y-3.5">
            {/* Jalali Date Navigator Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-2xs border border-slate-200/90 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDate(addDaysToJalali(selectedDate, -1))}
                    type="button"
                    title="روز قبل"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 px-1">
                    <button
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      <span>{formatFullJalaliDate(parseJalaliString(selectedDate))}</span>
                    </button>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {getFriendlyJalaliLabel(selectedDate)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedDate(addDaysToJalali(selectedDate, 1))}
                    type="button"
                    title="روز بعد"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Date Chips */}
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      selectedDate === todayStr
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    امروز
                  </button>
                  <button
                    onClick={() => setSelectedDate(addDaysToJalali(todayStr, 1))}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      selectedDate === addDaysToJalali(todayStr, 1)
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    فردا
                  </button>
                  <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition flex items-center gap-1"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>تقویم</span>
                  </button>
                </div>
              </div>

              {/* Embedded Calendar Picker Drawer */}
              <AnimatePresence>
                {isCalendarOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center"
                  >
                    <JalaliDatePicker
                      selectedDate={selectedDate}
                      onSelectDate={(newDate) => {
                        setSelectedDate(newDate);
                        setIsCalendarOpen(false);
                      }}
                      tasks={tasks}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Add Bar & Search */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="جستجو در کارها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>افزودن کار</span>
              </button>
            </div>

            {/* Past Day Indicator (if viewing a past day) */}
            {isPastDate && (
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-between">
                <span>نمایش کارهای ثبت‌شده و انجام‌شده در این روز گذشته</span>
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  بازگشت به امروز
                </button>
              </div>
            )}

            {/* Tasks List - Drag and Drop Reorderable */}
            <div className="pt-0.5">
              {filteredTasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 text-center border border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">کاری برای این تاریخ وجود ندارد</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={filteredTasks}
                  onReorder={handleReorderTasks}
                  className="space-y-1"
                >
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onClickDetails={handleTaskClick}
                    />
                  ))}
                </Reorder.Group>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {activeView === 'app' && (
        <button
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          type="button"
          aria-label="افزودن کار جدید"
          className="fixed bottom-6 left-6 z-40 w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Modals */}
      <TaskInputModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultDate={selectedDate}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        task={selectedDetailTask}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDetailTask(null);
        }}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTask}
      />

      <BadeSabaModal
        isOpen={isBadeSabaOpen}
        onClose={() => setIsBadeSabaOpen(false)}
        onImportTasks={handleImportTasksFromBadeSaba}
      />

      <CompletedArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        completedTasks={completedArchive}
        onRestoreTask={handleRestoreFromArchive}
        onClearArchive={handleClearArchive}
      />
    </div>
  );
}
