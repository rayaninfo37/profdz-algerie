/**
 * Utility functions for Africa/Algiers timezone (UTC+1, strictly no DST)
 */

export function getAlgiersNow(): Date {
  // Current real time
  return new Date();
}

/**
 * Returns a Date object representing 00:00:00.000 today in Africa/Algiers timezone
 */
export function getAlgiersStartOfDay(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  // Format: YYYY-MM-DD in Algiers
  const parts = formatter.format(date); // e.g. "2026-09-03"
  const [year, month, day] = parts.split('-').map(Number);

  // In Algiers (UTC+1), midnight local time is (month-1, day, 0, 0, 0) in UTC minus 1 hour
  // Which corresponds to Date.UTC(year, month - 1, day, -1, 0, 0, 0)
  return new Date(Date.UTC(year, month - 1, day, -1, 0, 0, 0));
}

/**
 * Returns formatted date string "YYYY-MM-DD" in Africa/Algiers timezone
 */
export function getAlgiersDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns formatted date string "YYYY-MM-DD" for yesterday in Africa/Algiers timezone
 */
export function getAlgiersYesterdayDateString(date: Date = new Date()): string {
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getAlgiersDateString(yesterday);
}

/**
 * Returns start of month Date in Africa/Algiers timezone
 */
export function getAlgiersStartOfMonth(date: Date = new Date()): Date {
  const dateStr = getAlgiersDateString(date);
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1, -1, 0, 0, 0));
}
