import { Task, Priority, BadeSabaCalendarEvent } from '../types';
import { gregorianToJalali, formatJalaliString, getTodayJalaliString } from './jalali';

/**
 * Backend API helpers for syncing personal calendars from Bade Saba
 */
export async function syncPersonalCalendarFromBackend(source: {
  calendarUrl?: string;
  icsContent?: string;
}): Promise<Task[]> {
  const res = await fetch('/api/badesaba/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(source),
  });

  if (!res.ok) {
    throw new Error('خطا در دریافت تقویم از سرور باد صبا');
  }

  const data = await res.json();
  return data.tasks || [];
}

/**
 * Parse an iCalendar (.ics) string (from Bade Saba personal calendar export)
 * Client-side fallback or inspection utility
 */
export function parseBadeSabaICS(icsText: string): Array<Omit<Task, 'id' | 'createdAt' | 'completed' | 'rolloverCount'>> {
  const lines = icsText.split(/\r\n|\n|\r/);
  const tasks: Array<Omit<Task, 'id' | 'createdAt' | 'completed' | 'rolloverCount'>> = [];
  let inEvent = false;
  let currentSummary = '';
  let currentDate = '';
  let currentTime = '';
  let currentDesc = '';
  let currentPriority: Priority = 'medium';

  for (let line of lines) {
    line = line.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentSummary = '';
      currentDate = '';
      currentTime = '';
      currentDesc = '';
      currentPriority = 'medium';
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentSummary) {
        tasks.push({
          title: currentSummary,
          description: currentDesc || undefined,
          priority: currentPriority,
          jalaliDate: currentDate || getTodayJalaliString(),
          time: currentTime || undefined,
        });
      }
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentSummary = line.replace('SUMMARY:', '').trim();
        // Detect priority hints if any
        if (currentSummary.includes('[فوری]') || currentSummary.includes('🔴') || currentSummary.includes('قرمز')) {
          currentPriority = 'high';
          currentSummary = currentSummary.replace(/\[فوری\]|🔴/g, '').trim();
        } else if (currentSummary.includes('[کم]') || currentSummary.includes('🔵') || currentSummary.includes('آبی')) {
          currentPriority = 'low';
          currentSummary = currentSummary.replace(/\[کم\]|🔵/g, '').trim();
        }
      } else if (line.startsWith('DESCRIPTION:')) {
        currentDesc = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('PRIORITY:')) {
        const pVal = parseInt(line.replace('PRIORITY:', '').trim(), 10);
        if (pVal <= 2) currentPriority = 'high';
        else if (pVal >= 8) currentPriority = 'low';
      } else if (line.startsWith('DTSTART')) {
        // e.g. DTSTART:20261013T090000Z or DTSTART;VALUE=DATE:20261013
        const val = line.split(':')[1] || '';
        const match = val.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
        if (match) {
          const gy = parseInt(match[1], 10);
          const gm = parseInt(match[2], 10);
          const gd = parseInt(match[3], 10);
          const jDate = gregorianToJalali(gy, gm, gd);
          currentDate = formatJalaliString(jDate);
          if (match[4] && match[5]) {
            currentTime = `${match[4]}:${match[5]}`;
          }
        }
      }
    }
  }

  return tasks;
}
