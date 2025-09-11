/**
 * Date utility functions for mountain completion dates
 */

/**
 * Format a date string (YYYY-MM-DD) for display in the given locale
 */
export function formatDateLocalized(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00Z'); // safe normalization
  return new Intl.DateTimeFormat(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(d);
}

/**
 * Check if a date string represents a future date
 */
export function isFutureDate(dateStr: string): boolean {
  const inputDate = new Date(dateStr + 'T00:00:00'); // Use local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return inputDate > today;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

/**
 * Validate a date string (YYYY-MM-DD format)
 */
export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toISOString().slice(0, 10) === dateStr;
}
