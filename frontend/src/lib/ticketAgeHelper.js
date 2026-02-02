import { differenceInMinutes, differenceInDays } from 'date-fns';

/**
 * ⚠️ TESTING MODE - Using MINUTES instead of days!
 * TODO: Revert to days after testing
 * 
 * Ticket age thresholds (in MINUTES for testing)
 * Original values were in days: FRESH: 1, RECENT: 4, AGING: 8, OLD: 15
 */
export const AGE_THRESHOLDS = {
  FRESH: 1,      // 0-1 minute
  RECENT: 2,     // 1-2 minutes  
  AGING: 3,      // 2-3 minutes
  OLD: 4,        // 3-4 minutes
  CRITICAL: 5,   // 4+ minutes
};

/**
 * Get age category based on MINUTES old (TESTING MODE)
 * TODO: Revert to differenceInDays after testing
 */
export function getAgeCategory(createdAt) {
  const minutesOld = differenceInMinutes(new Date(), new Date(createdAt));

  if (minutesOld < 1) return 'fresh';
  if (minutesOld < 2) return 'recent';
  if (minutesOld < 3) return 'aging';
  if (minutesOld < 4) return 'old';
  return 'critical';
}

/**
 * Get border color class for ticket age
 * Returns Tailwind color class
 */
export function getAgeColorClass(createdAt) {
  const category = getAgeCategory(createdAt);

  const colorMap = {
    fresh: 'border-l-4 border-l-green-500',    // Green
    recent: 'border-l-4 border-l-blue-500',    // Blue
    aging: 'border-l-4 border-l-yellow-500',   // Yellow
    old: 'border-l-4 border-l-orange-500',     // Orange
    critical: 'border-l-4 border-l-red-500',   // Red
  };

  return colorMap[category];
}

/**
 * Get badge color styles for ticket age
 */
export function getAgeBadgeColor(createdAt) {
  const category = getAgeCategory(createdAt);

  const styleMap = {
    fresh: 'bg-green-500/10 text-green-700 border-green-500/20',
    recent: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    aging: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    old: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-700 border-red-500/20',
  };

  return styleMap[category];
}

/**
 * Get human-readable age label (TESTING MODE - uses minutes)
 * TODO: Revert to differenceInDays after testing
 */
export function getAgeLabel(createdAt) {
  const minutesOld = differenceInMinutes(new Date(), new Date(createdAt));

  if (minutesOld < 1) return 'Fresh';
  if (minutesOld < 2) return 'Recent';
  if (minutesOld < 3) return 'Aging';
  if (minutesOld < 4) return 'Old';
  return 'Critical';
}

/**
 * Get age description for tooltip (TESTING MODE - uses minutes)
 * TODO: Revert to differenceInDays after testing
 */
export function getAgeDescription(createdAt) {
  const minutesOld = differenceInMinutes(new Date(), new Date(createdAt));

  if (minutesOld === 0) return 'Created just now';
  if (minutesOld === 1) return 'Created 1 minute ago';
  return `Created ${minutesOld} minutes ago`;
}

/**
 * Get days old
 */
export function getDaysOld(createdAt) {
  return differenceInDays(new Date(), new Date(createdAt));
}
