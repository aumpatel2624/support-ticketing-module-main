/**
 * Application Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',

    // Users
    USERS: '/users',
    CURRENT_USER: '/users/me',

    // Tickets
    TICKETS: '/tickets',
    MY_TICKETS: '/tickets/my-tickets',
    ASSIGNED_TICKETS: '/tickets/assigned',

    // Departments
    DEPARTMENTS: '/departments',

    // Categories
    CATEGORIES: '/categories',

    // Comments
    COMMENTS: '/comments',

    // Analytics
    ANALYTICS: '/stats',


};

// User Roles
export const USER_ROLES = {
    NORMAL_USER: 'NormalUser',
    TEAM_MEMBER: 'TeamMember',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'SuperAdmin',
};

// Ticket Statuses
export const TICKET_STATUS = {
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'InProgress',
    COMPLETED: 'Completed',
    REOPENED: 'Reopened',
    CLOSED: 'Closed',
    ESCALATED: 'Escalated',
};

// Ticket Priorities
export const TICKET_PRIORITY = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
};

// SLA Defaults (in hours) - matches backend SystemSettings defaults
export const SLA_DEFAULTS = {
    [TICKET_PRIORITY.LOW]: 72,      // 3 days
    [TICKET_PRIORITY.MEDIUM]: 48,   // 2 days
    [TICKET_PRIORITY.HIGH]: 24,     // 1 day
    [TICKET_PRIORITY.URGENT]: 4,    // 4 hours
};

// View Modes
export const VIEW_MODES = {
    TABLE: 'table',
    CARD: 'card',
    KANBAN: 'kanban',
};

// Date Formats
export const DATE_FORMATS = {
    SHORT: 'MMM dd, yyyy',
    LONG: 'MMMM dd, yyyy',
    WITH_TIME: 'MMM dd, yyyy HH:mm',
    TIME_ONLY: 'HH:mm',
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// File Upload
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ],
    ALLOWED_EXTENSIONS: [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.txt',
    ],
};

// Local Storage Keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebarCollapsed',
    VIEW_MODE: 'viewMode',
};

// Toast Duration (in milliseconds)
export const TOAST_DURATION = {
    SUCCESS: 1000,
    ERROR: 1000,
    INFO: 1000,
    WARNING: 1000,
};

// Debounce Delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
    SEARCH: 300,
    INPUT: 500,
    RESIZE: 200,
};

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
};

// Navigation Items (role-based)
export const NAVIGATION_ITEMS = {
    [USER_ROLES.NORMAL_USER]: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'My Tickets', href: '/tickets', icon: 'Ticket' },
        { name: 'Create Ticket', href: '/tickets/new', icon: 'Plus' },
        { name: 'Notifications', href: '/notifications', icon: 'Bell' },
    ],
    [USER_ROLES.TEAM_MEMBER]: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'My Tickets', href: '/tickets', icon: 'Ticket' },
        { name: 'Assigned Tickets', href: '/tickets/assigned', icon: 'ClipboardList' },
        { name: 'Create Ticket', href: '/tickets/new', icon: 'Plus' },
        { name: 'Notifications', href: '/notifications', icon: 'Bell' },
    ],
    [USER_ROLES.ADMIN]: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'All Tickets', href: '/tickets', icon: 'Ticket' },
        { name: 'Assigned Tickets', href: '/tickets/assigned', icon: 'ClipboardList' },
        { name: 'Team Members', href: '/users', icon: 'Users' },
        { name: 'Categories', href: '/categories', icon: 'Tags' },
        { name: 'Notifications', href: '/notifications', icon: 'Bell' },
        // { name: 'Settings', href: '/settings', icon: 'Settings' },
    ],
    [USER_ROLES.SUPER_ADMIN]: [
        { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'All Tickets', href: '/tickets', icon: 'Ticket' },
        { name: 'Departments', href: '/departments', icon: 'Building2' },
        { name: 'Categories', href: '/categories', icon: 'Tags' },
        { name: 'Users', href: '/users', icon: 'Users' },
        { name: 'Notifications', href: '/notifications', icon: 'Bell' },
        // { name: 'Settings', href: '/settings', icon: 'Settings' },
    ],
};

// System Settings Constants
export const SYSTEM_SETTINGS_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
export const SYSTEM_SETTINGS_TIME_FORMATS = ['12h', '24h'];
export const ESCALATION_TARGETS = ['supervisor', 'manager', 'admin'];
export const NOTIFY_VIA_OPTIONS = ['email', 'inApp', 'both'];

// Common Timezones
export const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Pacific/Auckland',
];

// File type options for system settings
export const FILE_TYPE_OPTIONS = [
    { label: 'Images', value: 'image' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Word Docs', value: 'doc' },
    { label: 'Excel Sheets', value: 'xls' },
    { label: 'Text Files', value: 'txt' },
];

// Default System Settings
// Default System Settings
export const DEFAULT_SYSTEM_SETTINGS = {
    companyName: 'My Company',
    companyLogo: '',
    emailFrom: 'noreply@company.com',
    emailReplyTo: '',
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    fileUploadMaxSize: 5,
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
};
