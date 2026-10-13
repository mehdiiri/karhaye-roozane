import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar as CalendarIcon, Tag, AlertTriangle, CheckCircle, Check, Info } from 'lucide-react';
import { Task, Priority } from '../types';
import { getTodayJalaliString, addDaysToJalali, getFriendlyJalaliLabel, parseJalaliString, formatFullJalaliDate } from '../utils/jalali';
import { JalaliDatePicker } from './JalaliDatePicker';

interface TaskInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'rolloverCount'>) => void;
  editingTask?: Task | null;
  defaultDate?: string;
}

export const TaskInputModal: React.FC<TaskInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  defaultDate,
}) => {
  const todayStr = getTodayJalaliString();
  const tomorrowStr = addDaysToJalali(todayStr, 1);
  const dayAfterTomorrowStr = addDaysToJalali(todayStr, 2);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [jalaliDate, setJalaliDate] = useState(defaultDate || todayStr);
  const [time, setTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setJalaliDate(editingTask.jalaliDate);
      setTime(editingTask.time || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setJalaliDate(defaultDate || todayStr);
      setTime('');
    }
    setShowCalendar(false);
  }, [editingTask, defaultDate, todayStr, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      jalaliDate,
      time: time || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{editingTask ? 'ویرایش کار' : 'ثبت کار جدید'}</span>
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان کار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خرید نان، تماس با همکار، مطالعه فصل ۲..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Priority Selection - ONLY Color Buttons */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              رنگ اولویت کار:
            </label>
            <div className="flex items-center justify-center gap-5 py-2 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              {/* Red Color Button */}
              <button
                type="button"
                onClick={() => setPriority('high')}
                title="قرمز"
                aria-label="قرمز"
                className={`relative w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center shadow-xs ${
                  priority === 'high'
                    ? 'ring-3 ring-red-400 dark:ring-red-500 scale-110 shadow-red-500/30'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
              >
                {priority === 'high' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Green Color Button */}
              <button
                type="button"
                onClick={() => setPriority('medium')}
                title="سبز"
                aria-label="سبز"
                className={`relative w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center shadow-xs ${
                  priority === 'medium'
                    ? 'ring-3 ring-emerald-400 dark:ring-emerald-500 scale-110 shadow-emerald-500/30'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
              >
                {priority === 'medium' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Blue Color Button */}
              <button
                type="button"
                onClick={() => setPriority('low')}
                title="آبی"
                aria-label="آبی"
                className={`relative w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center shadow-xs ${
                  priority === 'low'
                    ? 'ring-3 ring-blue-400 dark:ring-blue-500 scale-110 shadow-blue-500/30'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
              >
                {priority === 'low' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* Date & Quick chips */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تاریخ انجام (تقویم شمسی)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setJalaliDate(todayStr);
                  setShowCalendar(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  jalaliDate === todayStr
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                امروز ({getFriendlyJalaliLabel(todayStr)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setJalaliDate(tomorrowStr);
                  setShowCalendar(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  jalaliDate === tomorrowStr
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                فردا
              </button>

              <button
                type="button"
                onClick={() => {
                  setJalaliDate(dayAfterTomorrowStr);
                  setShowCalendar(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  jalaliDate === dayAfterTomorrowStr
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                پس‌فردا
              </button>

              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                  showCalendar
                    ? 'bg-amber-500 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>انتخاب از تقویم</span>
              </button>
            </div>

            {/* Display selected date nicely */}
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              تاریخ انتخاب‌شده: {formatFullJalaliDate(parseJalaliString(jalaliDate))}
            </div>

            {/* Embedded Calendar Picker dropdown */}
            <AnimatePresence>
              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <JalaliDatePicker
                    selectedDate={jalaliDate}
                    onSelectDate={(newDate) => {
                      setJalaliDate(newDate);
                      setShowCalendar(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>ساعت انجام (اختیاری)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                توضیحات یا یادداشت (اختیاری)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="یادداشت تکمیلی..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingTask ? 'ذخیره تغییرات' : 'افزودن به لیست'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
