import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gregorian to Jalali converter for backend
function gregorianToJalali(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy > 1600 ? 979 : 0;
  gy -= gy > 1600 ? 1600 : 621;
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

function parseICSEvents(icsText: string) {
  const lines = icsText.split(/\r\n|\n|\r/);
  const tasks: any[] = [];
  let inEvent = false;
  let currentSummary = '';
  let currentDate = '';
  let currentTime = '';
  let currentDesc = '';
  let currentPriority = 'medium';

  const today = new Date();
  const todayJ = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const todayStr = `${todayJ.year}/${String(todayJ.month).padStart(2, '0')}/${String(todayJ.day).padStart(2, '0')}`;

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
          id: `badesaba-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: currentSummary,
          description: currentDesc || undefined,
          priority: currentPriority,
          jalaliDate: currentDate || todayStr,
          time: currentTime || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
          rolloverCount: 0,
        });
      }
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentSummary = line.replace('SUMMARY:', '').trim();
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
        const val = line.split(':')[1] || '';
        const match = val.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
        if (match) {
          const gy = parseInt(match[1], 10);
          const gm = parseInt(match[2], 10);
          const gd = parseInt(match[3], 10);
          const jDate = gregorianToJalali(gy, gm, gd);
          currentDate = `${jDate.year}/${String(jDate.month).padStart(2, '0')}/${String(jDate.day).padStart(2, '0')}`;
          if (match[4] && match[5]) {
            currentTime = `${match[4]}:${match[5]}`;
          }
        }
      }
    }
  }

  return tasks;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // CORS headers middleware to allow PWABuilder and external tools to fetch manifest and assets
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });


  app.get('/api/badesaba/status', (_req: Request, res: Response) => {
    res.json({ status: 'active' });
  });

  // Backend endpoint: Import personal calendar from Bade Saba
  app.post('/api/badesaba/import', async (req: Request, res: Response) => {
    try {
      const { calendarUrl, icsContent } = req.body;

      let contentToParse = icsContent || '';

      if (!contentToParse && calendarUrl) {
        // Fetch personal calendar ICS from Bade Saba URL on backend
        const response = await fetch(calendarUrl);
        if (!response.ok) {
          return res.status(400).json({
            error: 'امکان دریافت تقویم از آدرس باد صبا وجود ندارد',
          });
        }
        contentToParse = await response.text();
      }

      if (!contentToParse) {
        return res.status(400).json({
          error: 'هیچ محتوا یا لینکی برای تقویم ارسال نشده است',
        });
      }

      const tasks = parseICSEvents(contentToParse);
      return res.json({
        success: true,
        message: 'تقویم شخصی باد صبا با موفقیت در بک‌اند پردازش و دریافت شد',
        count: tasks.length,
        tasks,
      });
    } catch (err: any) {
      console.error('Bade Saba backend import error:', err);
      return res.status(500).json({
        error: 'خطا در پردازش تقویم باد صبا در بک‌اند: ' + (err?.message || 'نامشخص'),
      });
    }
  });

  // Explicitly serve manifest.json and manifest.webmanifest with correct headers for PWABuilder
  app.get(['/manifest.json', '/manifest.webmanifest'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
  });

  // Setup Vite development server or production static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
