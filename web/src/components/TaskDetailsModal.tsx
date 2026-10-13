import React from 'react';
import { motion } from 'motion/react';
import { X, Clock, Calendar, Edit2, Trash2, RotateCcw, Tag } from 'lucide-react';
import { Task } from '../types';
import { toPersianDigits, formatFullJalaliDate, parseJalaliString } from '../utils/jalali';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !task) return null;

  const priorityMeta =
    task.priority === 'high'
      ? { label: '🔴 اولویت قرمز (فوری و مهم)', bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900' }
      : task.priority === 'medium'
      ? { label: '🟢 اولویت سبز (عادی و روزمره)', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' }
      : { label: '🔵 اولویت آبی (کم‌اهمیت و آزاد)', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${priorityMeta.bg}`}>
            {priorityMeta.label}
          </span>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          {/* Title */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h3>
          </div>

          {/* Description */}
          {task.description && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 leading-relaxed">
              {task.description}
            </div>
          )}

          {/* Date & Time info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{formatFullJalaliDate(parseJalaliString(task.jalaliDate))}</span>
            </div>

            {task.time && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>ساعت {toPersianDigits(task.time)}</span>
              </div>
            )}

            {task.rolloverCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px]">
                <RotateCcw className="w-3 h-3" />
                <span>منتقل‌شده از قبل ({toPersianDigits(task.rolloverCount)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: ONLY Edit & Delete */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onEdit(task);
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف کار</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
