// Helper utility functions

/**
 * Get Unix timestamp for N hours ago
 */
export function getTimeHoursAgo(hours) {
  const now = new Date();
  const hoursAgo = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return Math.floor(hoursAgo.getTime() / 1000);
}

/**
 * Format date for display
 */
export function formatDate(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

/**
 * Delay/pause execution
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate text to max length
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
