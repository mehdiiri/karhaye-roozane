import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Compass,
  Download,
  Upload,
  Link,
  CheckCircle2,
  AlertCircle,
  FileText,
  Server,
  RefreshCw,
} from 'lucide-react';
import { Task } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { parseBadeSabaICS } from '../utils/badeSaba';

interface BadeSabaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTasks: (newTasks: Task[]) => void;
}

export const BadeSabaModal: React.FC<BadeSabaModalProps> = ({
  isOpen,
  onClose,
  onImportTasks,
}) => {
  const [calendarUrl, setCalendarUrl] = useState('');
  const [icsContent, setIcsContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('در حال بررسی ارتباط بک‌اند...');

  // Check backend service status on open
  useEffect(() => {
    if (!isOpen) return;
    if (window.DailyTasksNative) {
      setBackendStatus('پردازش محلی روی گوشی فعال است');
      return;
    }
    fetch('/api/badesaba/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'active') {
          setBackendStatus('بک‌اند متصل و آماده همگام‌سازی است');
        } else {
          setBackendStatus('وضعیت سرویس بک‌اند: فعال');
        }
      })
      .catch(() => {
        setBackendStatus('سرور تقویم پاسخ نداد');
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncFromBackend = async () => {
    if (!(window.DailyTasksNative ? icsContent.trim() : (calendarUrl.trim() || icsContent.trim()))) {
      setStatusMessage({
        type: 'error',
        text: window.DailyTasksNative ? 'لطفاً فایل یا محتوای تقویم .ics را از گوشی وارد کنید.' : 'لطفاً لینک یا فایل تقویم را وارد کنید.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      let importedTasks: Task[];
      if (window.DailyTasksNative) {
        // The standalone APK must not depend on the Express server.
        const content = icsContent.trim();
        if (!content) throw new Error('برای استفاده آفلاین، فایل تقویم را از حافظه گوشی انتخاب کنید.');
        importedTasks = parseBadeSabaICS(content).map((task) => ({
          ...task,
          id: `badesaba-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          completed: false,
          createdAt: new Date().toISOString(),
          rolloverCount: 0,
        }));
      } else {
        const response = await fetch('/api/badesaba/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarUrl: calendarUrl.trim() || undefined, icsContent: icsContent.trim() || undefined }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'خطا در ارتباط با بک‌اند');
        importedTasks = data.tasks || [];
      }
      if (importedTasks.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'رویدادی در تقویم ارسالی یافت نشد.',
        });
      } else {
        onImportTasks(importedTasks);
        setStatusMessage({
          type: 'success',
          text: `تعداد ${toPersianDigits(importedTasks.length)} کار با موفقیت از تقویم شخصی باد صبا دریافت و افزوده شد.`,
        });
        setIcsContent('');
        setCalendarUrl('');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطا در دریافت تقویم از بک‌اند باد صبا',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIcsContent(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">دریافت تقویم‌های شخصی از باد صبا</h3>
              <p className="text-xs text-slate-400">پردازش امن اطلاعات تقویم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Backend Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Server className="w-4 h-4 text-blue-500" />
              <span>وضعیت سرور بک‌اند:</span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {backendStatus}
            </span>
          </div>

          {/* Option 1: available only for the online web version */}
          {!window.DailyTasksNative && <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-500" />
              <span>لینک تقویم شخصی باد صبا (اختیاری)</span>
            </label>
            <input
              type="url"
              dir="ltr"
              placeholder="https://example.com/badesaba-calendar.ics"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>}

          {window.DailyTasksNative && <p className="text-xs text-slate-500 dark:text-slate-400">نسخه اندروید کاملاً آفلاین است؛ تقویم فقط از فایل ذخیره‌شده روی گوشی وارد می‌شود.</p>}
          {/* Option 2: Upload or Paste .ics Calendar from Bade Saba */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>فایل یا متن تقویم شخصی باد صبا (.ics)</span>
              </label>
              <label className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>بارگذاری فایل .ics</span>
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              dir="ltr"
              rows={4}
              placeholder="BEGIN:VCALENDAR&#10;BEGIN:VEVENT&#10;SUMMARY:جلسه کاری...&#10;END:VEVENT&#10;END:VCALENDAR"
              value={icsContent}
              onChange={(e) => setIcsContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSyncFromBackend}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال دریافت و پردازش...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>دریافت و ثبت کارهای تقویم در برنامه</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
};
