// Import moment from our shim to ensure proper bundling
import moment from './moment-shim';

/**
 * Format a date as a string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  return moment(date).format(format);
}

/**
 * Get a relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date): string {
  return moment(date).fromNow();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return moment(date).isBefore(moment());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return moment(date).isAfter(moment());
} 