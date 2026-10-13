import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, RotateCcw, Trash2, Calendar, Award } from 'lucide-react';
import { Task } from '../types';
import { toPersianDigits, getFriendlyJalaliLabel } from '../utils/jalali';

interface CompletedArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: Task[];
  onRestoreTask: (taskId: string) => void;
  onClearArchive: () => void;
}

export const CompletedArchiveModal: React.FC<CompletedArchiveModalProps> = ({
  isOpen,
  onClose,
  completedTasks,
  onRestoreTask,
  onClearArchive,
}) => {
  if (!isOpen) return null;

  const highDone = completedTasks.filter((t) => t.priority === 'high').length;
  const mediumDone = completedTasks.filter((t) => t.priority === 'medium').length;
  const lowDone = completedTasks.filter((t) => t.priority === 'low').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                آرشیو کارهای انجام‌شده
              </h3>
              <p className="text-xs text-slate-500">
                {toPersianDigits(completedTasks.length)} کار با موفقیت تکمیل و از لیست روزانه حذف شده است
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats summary banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
              <span className="block font-medium text-red-700 dark:text-red-300">🔴 فوری و مهم</span>
              <span className="text-base font-extrabold text-red-600 dark:text-red-400">
                {toPersianDigits(highDone)} کار
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
              <span className="block font-medium text-emerald-700 dark:text-emerald-300">🟢 عادی و روزمره</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {toPersianDigits(mediumDone)} کار
              </span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
              <span className="block font-medium text-blue-700 dark:text-blue-300">🔵 کم‌اهمیت و آزاد</span>
              <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                {toPersianDigits(lowDone)} کار
              </span>
            </div>
          </div>
        </div>

        {/* List of completed tasks */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {completedTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">هنوز هیچ کاری انجام و تیک نخورده است.</p>
              <p className="text-xs mt-1">با تیک زدن هر کار در لیست یا ویجت، کار از صفحه حذف و به اینجا منتقل می‌شود.</p>
            </div>
          ) : (
            completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      task.priority === 'high'
                        ? 'bg-red-500'
                        : task.priority === 'medium'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 line-through truncate block">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      تاریخ کار: {getFriendlyJalaliLabel(task.jalaliDate)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRestoreTask(task.id)}
                  title="بازگرداندن این کار به لیست امروز"
                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center gap-1 font-medium transition flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازگردانی</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {completedTasks.length > 0 && (
            <button
              onClick={onClearArchive}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی کل تاریخچه آرشیو</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition mr-auto"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
};
