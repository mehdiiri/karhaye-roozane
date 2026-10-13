export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority; // high: قرمز, medium: سبز, low: آبی
  jalaliDate: string; // YYYY/MM/DD
  time?: string; // HH:mm
  completed: boolean;
  completedAt?: string;
  completedJalaliDate?: string;
  createdAt: string;
  rolloverCount: number; // تعداد دفعاتی که به روز بعد منتقل شده
  originalDate?: string; // تاریخ اولیه ایجاد
  category?: string;
}

export type WidgetSize = '2x2' | '4x1' | '4x2' | '4x4' | 'custom';

export type WidgetTheme = 'glass' | 'dark' | 'light' | 'amoled' | 'material';

export interface BadeSabaCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  priority?: Priority;
}

