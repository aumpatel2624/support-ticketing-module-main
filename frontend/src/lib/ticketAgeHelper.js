import { differenceInMinutes, differenceInDays } from 'date-fns';
import { SLA_DEFAULTS, TICKET_PRIORITY } from './constants';

/**
 * Ticket age categories based on SLA consumption percentage
 */
export const AGE_CATEGORIES = {
  FRESH: 'fresh',      // 0-25% of SLA
  RECENT: 'recent',    // 25-50% of SLA
  AGING: 'aging',      // 50-75% of SLA
  OLD: 'old',          // 75-100% of SLA
  CRITICAL: 'critical' // >100% (SLA Breached)
};

/**
 * Get total SLA minutes for a priority
 */
function getSLAMinutes(priority) {
  // Default to Medium if priority is missing or invalid
  const hours = SLA_DEFAULTS[priority] || SLA_DEFAULTS[TICKET_PRIORITY.MEDIUM];
  return hours * 60;
}

/**
 * Get age category based on SLA percentage consumed
 * @param {string|Date} createdAt - Ticket creation date
 * @param {string} priority - Ticket priority (Low, Medium, High, Urgent)
 */
export function getAgeCategory(createdAt, priority) {
  const minutesOld = differenceInMinutes(new Date(), new Date(createdAt));
  const slaMinutes = getSLAMinutes(priority);

  const percentage = (minutesOld / slaMinutes) * 100;

  if (percentage < 25) return AGE_CATEGORIES.FRESH;
  if (percentage < 50) return AGE_CATEGORIES.RECENT;
  if (percentage < 75) return AGE_CATEGORIES.AGING;
  if (percentage < 100) return AGE_CATEGORIES.OLD;
  return AGE_CATEGORIES.CRITICAL;
}

/**
 * Get border color class for ticket age
 * Returns Tailwind color class
 */
export function getAgeColorClass(createdAt, priority) {
  const category = getAgeCategory(createdAt, priority);

  const colorMap = {
    [AGE_CATEGORIES.FRESH]: 'border-l-4 border-l-green-500',    // On Track (Early)
    [AGE_CATEGORIES.RECENT]: 'border-l-4 border-l-blue-500',    // On Track (Mid)
    [AGE_CATEGORIES.AGING]: 'border-l-4 border-l-yellow-500',   // Warning
    [AGE_CATEGORIES.OLD]: 'border-l-4 border-l-orange-500',     // At Risk
    [AGE_CATEGORIES.CRITICAL]: 'border-l-4 border-l-red-500',   // Breached
  };

  return colorMap[category];
}

/**
 * Get badge color styles for ticket age
 */
export function getAgeBadgeColor(createdAt, priority) {
  const category = getAgeCategory(createdAt, priority);

  const styleMap = {
    [AGE_CATEGORIES.FRESH]: 'bg-green-500/10 text-green-700 border-green-500/20',
    [AGE_CATEGORIES.RECENT]: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    [AGE_CATEGORIES.AGING]: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    [AGE_CATEGORIES.OLD]: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    [AGE_CATEGORIES.CRITICAL]: 'bg-red-500/10 text-red-700 border-red-500/20',
  };

  return styleMap[category] || styleMap[AGE_CATEGORIES.FRESH];
}

/**
 * Get human-readable age label
 */
export function getAgeLabel(createdAt, priority) {
  const category = getAgeCategory(createdAt, priority);

  const labelMap = {
    [AGE_CATEGORIES.FRESH]: 'On Track',
    [AGE_CATEGORIES.RECENT]: 'Stable',
    [AGE_CATEGORIES.AGING]: 'Aging',
    [AGE_CATEGORIES.OLD]: 'Check', // Close to breach
    [AGE_CATEGORIES.CRITICAL]: 'Breached',
  };

  return labelMap[category];
}

/**
 * Get age description for tooltip
 */
export function getAgeDescription(createdAt, priority) {
  const minutesOld = differenceInMinutes(new Date(), new Date(createdAt));
  const slaMinutes = getSLAMinutes(priority);
  const percentage = Math.round((minutesOld / slaMinutes) * 100);
  const daysOld = differenceInDays(new Date(), new Date(createdAt));

  let timeText;
  if (daysOld === 0) timeText = 'Created today';
  else if (daysOld === 1) timeText = 'Created yesterday';
  else timeText = `Created ${daysOld} days ago`;

  if (percentage >= 100) {
    return `${timeText} (${percentage}% of SLA used - BREACHED)`;
  }
  return `${timeText} (${percentage}% of SLA used)`;
}

/**
 * Get days old (helper)
 */
export function getDaysOld(createdAt) {
  return differenceInDays(new Date(), new Date(createdAt));
}
