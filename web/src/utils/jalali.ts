/**
 * Solar Hijri (Jalali) Calendar Utilities
 * Accurate Gregorian <-> Jalali Conversion Algorithm
 */

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

export const SHORT_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

export interface JalaliDateObj {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

/**
 * Checks if a Jalali year is a leap year
 */
export function isJalaliLeapYear(year: number): boolean {
  // Approximate standard 33-year cycle algorithm
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (year < jm) break;
    jp = jm;
  }
  let n = year - jp;
  if (jump - n < 6) n = n - jump + (Math.floor((jump + 4) / 33) * 33);
  let leap = ((n + 1) % 33) - 1;
  if (leap === -1) leap = 32;
  return leap % 4 === 0 && leap !== 32;
}

/**
 * Returns number of days in a Jalali month
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

/**
 * Gregorian date to Jalali Date conversion
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDateObj {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { year: jy, month: jm, day: jd };
}

/**
 * Jalali date to Gregorian Date conversion
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return { year: gy, month: gm, day: gd };
}

/**
 * Returns today's Jalali date object
 */
export function getTodayJalali(): JalaliDateObj {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Formats JalaliDateObj to "YYYY/MM/DD" with 2-digit padding
 */
export function formatJalaliString(obj: JalaliDateObj): string {
  const m = String(obj.month).padStart(2, '0');
  const d = String(obj.day).padStart(2, '0');
  return `${obj.year}/${m}/${d}`;
}

/**
 * Returns today as "YYYY/MM/DD"
 */
export function getTodayJalaliString(): string {
  return formatJalaliString(getTodayJalali());
}

/**
 * Parses "YYYY/MM/DD" string to JalaliDateObj
 */
export function parseJalaliString(str: string): JalaliDateObj {
  const parts = str.split('/').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return getTodayJalali();
}

/**
 * Computes weekday index (0 = شنبه, 1 = یکشنبه, ..., 6 = جمعه)
 */
export function getJalaliWeekdayIndex(jDate: JalaliDateObj): number {
  const g = jalaliToGregorian(jDate.year, jDate.month, jDate.day);
  const gDate = new Date(g.year, g.month - 1, g.day);
  const day = gDate.getDay(); // 0 is Sunday, 6 is Saturday
  // In Persian: Saturday is 0, Sunday is 1, ..., Friday is 6
  return (day + 1) % 7;
}

/**
 * Full readable Persian date: e.g. "دوشنبه، ۲۱ مهر ۱۴۰۵"
 */
export function formatFullJalaliDate(jDate: JalaliDateObj): string {
  const weekday = WEEKDAYS[getJalaliWeekdayIndex(jDate)];
  const monthName = JALALI_MONTHS[jDate.month - 1];
  return `${weekday}، ${toPersianDigits(jDate.day)} ${monthName} ${toPersianDigits(jDate.year)}`;
}

/**
 * Short friendly label: "امروز"، "فردا"، "دیروز"، or "۲۱ مهر"
 */
export function getFriendlyJalaliLabel(jDateStr: string): string {
  const todayStr = getTodayJalaliString();
  const today = parseJalaliString(todayStr);
  const target = parseJalaliString(jDateStr);

  if (jDateStr === todayStr) return 'امروز';

  // Compare diff in days
  const gToday = jalaliToGregorian(today.year, today.month, today.day);
  const gTarget = jalaliToGregorian(target.year, target.month, target.day);
  const msDiff = new Date(gTarget.year, gTarget.month - 1, gTarget.day).getTime() -
    new Date(gToday.year, gToday.month - 1, gToday.day).getTime();
  const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));

  if (daysDiff === 1) return 'فردا';
  if (daysDiff === -1) return 'دیروز';
  if (daysDiff < -1) return `${toPersianDigits(Math.abs(daysDiff))} روز قبل`;
  if (daysDiff > 1 && daysDiff <= 7) return `${toPersianDigits(daysDiff)} روز دیگر`;

  return `${toPersianDigits(target.day)} ${JALALI_MONTHS[target.month - 1]}`;
}

/**
 * Check if dateA is strictly before dateB (YYYY/MM/DD)
 */
export function isBeforeJalali(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}

/**
 * Add or subtract days from a Jalali date string
 */
export function addDaysToJalali(dateStr: string, daysToAdd: number): string {
  const obj = parseJalaliString(dateStr);
  const g = jalaliToGregorian(obj.year, obj.month, obj.day);
  const d = new Date(g.year, g.month - 1, g.day);
  d.setDate(d.getDate() + daysToAdd);
  const newJalali = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return formatJalaliString(newJalali);
}
