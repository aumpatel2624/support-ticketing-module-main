import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get the number of days since a date
 */
export function getDaysOld(date) {
  if (!date) return 0;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 0;
  return differenceInDays(new Date(), parsedDate);
}

/**
 * Get ticket age color based on creation date
 * @param {string|Date} createdAt - Ticket creation date
 * @returns {string} Tailwind color class
 */
export function getTicketAgeColor(createdAt) {
  const daysOld = getDaysOld(createdAt);

  if (daysOld < 1) return 'border-ticket-fresh'; // Green (0-24h)
  if (daysOld < 4) return 'border-ticket-recent'; // Blue (1-3d)
  if (daysOld < 8) return 'border-ticket-aging'; // Yellow (4-7d)
  if (daysOld < 15) return 'border-ticket-old'; // Orange (8-14d)
  return 'border-ticket-critical'; // Red (15+d)
}

/**
 * Get ticket age badge color
 */
export function getTicketAgeBadgeColor(createdAt) {
  const daysOld = getDaysOld(createdAt);

  if (daysOld < 1) return 'bg-success/10 text-success border-success/20';
  if (daysOld < 4) return 'bg-primary/10 text-primary border-primary/20';
  if (daysOld < 8) return 'bg-warning/10 text-warning border-warning/20';
  if (daysOld < 15) return 'bg-secondary/10 text-secondary border-secondary/20';
  return 'bg-destructive/10 text-destructive border-destructive/20';
}

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  const statusColors = {
    new: 'bg-status-new/10 text-status-new border-status-new/20',
    assigned: 'bg-status-assigned/10 text-status-assigned border-status-assigned/20',
    'in-progress': 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
    pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    resolved: 'bg-status-completed/10 text-status-completed border-status-completed/20',
    reopened: 'bg-orange-500/10 text-orange-600 border-orange-500/20',

    escalated: 'bg-status-escalated/10 text-status-escalated border-status-escalated/20',
  };

  return statusColors[status?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority) {
  const priorityColors = {
    low: 'bg-priority-low/10 text-priority-low border-priority-low/20',
    medium: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
    high: 'bg-priority-high/10 text-priority-high border-priority-high/20',
    urgent: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
  };

  return priorityColors[priority?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

/**
 * Format date to standard format
 */
export function formatDate(date, formatString = 'MMM dd, yyyy') {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';
  return format(parsedDate, formatString);
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';
  return format(parsedDate, 'MMM dd, yyyy HH:mm');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random color for avatar
 */
export function getAvatarColor(name) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
}
