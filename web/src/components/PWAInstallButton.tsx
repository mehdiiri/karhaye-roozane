import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // Native APK is already installed: hide the browser's PWA installation prompt.
  if (window.DailyTasksNative || isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition active:scale-95 cursor-pointer"
        title="نصب مستقیم روی گوشی"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>نصب مستقیم اپلیکیشن</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>نصب روی آیفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                نصب روی گوشی (آیفون / سافاری)
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ۱. دکمه <strong>Share</strong> (اشتراک‌گذاری) را در نوار پایین مرورگر لمس کنید.<br />
                ۲. به پایین اسکرول کرده و گزینه <strong>Add to Home Screen</strong> (افزودن به صفحه اصلی) را انتخاب کنید.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // General fallback button explaining how to install on Android without APK
  return (
    <>
      <button
        onClick={() => setShowAndroidGuide(true)}
        className="flex items-center gap-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1.5 text-xs font-medium transition active:scale-95 cursor-pointer"
        title="راهنمای نصب سریع روی گوشی"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>راهنمای نصب در گوشی</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right" dir="rtl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <span>نصب اپلیکیشن روی اندروید</span>
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              نیازی به دانلود فایل و خطاهای امنیتی نیست! در کمتر از ۵ ثانیه اپلیکیشن را روی گوشی داشته باشید:
            </p>

            <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <li>این صفحه را در مرورگر <strong>Chrome</strong> گوشی خود باز کنید.</li>
              <li>منوی ۳ نقطه (بالا سمت راست یا چپ کروم) را لمس کنید.</li>
              <li>گزینه <strong>«نصب برنامه» (Install app)</strong> یا <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> را انتخاب کنید.</li>
              <li>برنامه به صورت خودکار و مستقل با آیکون کارهای روزانه روی صفحه و منوی برنامه‌های گوشی شما نصب می‌شود.</li>
            </ol>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
