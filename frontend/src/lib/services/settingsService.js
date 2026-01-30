import api from '../api';

/**
 * Settings Service - Handles system and user preference API calls
 */

// ============ SYSTEM SETTINGS ============

/**
 * Get global system settings (SuperAdmin only)
 */
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/admin/settings');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update global system settings (SuperAdmin only)
 */
export const updateSystemSettings = async (settings) => {
  try {
    const response = await api.put('/admin/settings', settings);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get public settings (no authentication required)
 * Used for branding, maintenance mode, etc.
 */
export const getPublicSettings = async () => {
  try {
    const response = await api.get('/settings/public');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ============ USER PREFERENCES ============

/**
 * Get user preferences
 * @param {string} userId - User ID to fetch preferences for
 */
export const getUserPreferences = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/preferences`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Partial preferences object to update
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const response = await api.put(`/users/${userId}/preferences`, preferences);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {object} notificationPrefs - Notification preference settings
 */
export const updateNotificationPreferences = async (userId, notificationPrefs) => {
  try {
    const response = await api.put(`/users/${userId}/preferences/notifications`, notificationPrefs);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ============ SAVED FILTERS ============

/**
 * Get all saved filter presets for user
 * @param {string} userId - User ID
 */
export const getSavedFilters = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/preferences/filters`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Save a filter preset
 * @param {string} userId - User ID
 * @param {string} name - Filter preset name
 * @param {object} filters - Filter criteria object
 */
export const saveFilter = async (userId, name, filters) => {
  try {
    const response = await api.post(`/users/${userId}/preferences/filters`, {
      name,
      filters
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a saved filter
 * @param {string} userId - User ID
 * @param {string} filterId - Filter ID to delete
 */
export const deleteFilter = async (userId, filterId) => {
  try {
    const response = await api.delete(`/users/${userId}/preferences/filters/${filterId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============ SECURITY & 2FA ============

/**
 * Enable two-factor authentication
 * @param {string} userId - User ID
 */
export const enable2FA = async (userId) => {
  try {
    const response = await api.post(`/users/${userId}/preferences/2fa/enable`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Disable two-factor authentication
 * @param {string} userId - User ID
 */
export const disable2FA = async (userId) => {
  try {
    const response = await api.post(`/users/${userId}/preferences/2fa/disable`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
