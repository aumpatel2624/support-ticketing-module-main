import { differenceInDays } from 'date-fns';

/**
 * Ticket age thresholds (in days)
 */
export const AGE_THRESHOLDS = {
  FRESH: 1,      // 0-24 hours
  RECENT: 4,     // 1-3 days
  AGING: 8,      // 4-7 days
  OLD: 15,       // 8-14 days
  CRITICAL: 15,  // 15+ days
};

/**
 * Get age category based on days old
 */
export function getAgeCategory(createdAt) {
  const daysOld = differenceInDays(new Date(), new Date(createdAt));

  if (daysOld < 1) return 'fresh';
  if (daysOld < 4) return 'recent';
  if (daysOld < 8) return 'aging';
  if (daysOld < 15) return 'old';
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
 * Get human-readable age label
 */
export function getAgeLabel(createdAt) {
  const daysOld = differenceInDays(new Date(), new Date(createdAt));

  if (daysOld < 1) return 'Fresh';
  if (daysOld < 4) return 'Recent';
  if (daysOld < 8) return 'Aging';
  if (daysOld < 15) return 'Old';
  return 'Critical';
}

/**
 * Get age description for tooltip
 */
export function getAgeDescription(createdAt) {
  const daysOld = differenceInDays(new Date(), new Date(createdAt));

  if (daysOld === 0) return 'Created today';
  if (daysOld === 1) return 'Created 1 day ago';
  return `Created ${daysOld} days ago`;
}

/**
 * Get days old
 */
export function getDaysOld(createdAt) {
  return differenceInDays(new Date(), new Date(createdAt));
}
