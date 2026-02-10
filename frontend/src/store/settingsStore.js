import { create } from 'zustand';
import useAuthStore from './authStore';
import {
  getSystemSettings,
  updateSystemSettings,
  getUserPreferences,
  updateUserPreferences as updateUserPrefsAPI,
  getSavedFilters,
  saveFilter as saveFilterAPI,
  deleteFilter as deleteFilterAPI
} from '../lib/services/settingsService';

/**
 * Settings Store - Manages system settings and user preferences state
 */
const useSettingsStore = create((set, get) => ({
  // System Settings State
  systemSettings: null,
  systemSettingsLoading: false,
  systemSettingsError: null,

  // User Preferences State
  userPreferences: null,
  userPreferencesLoading: false,
  userPreferencesError: null,

  // Saved Filters
  savedFilters: [],
  savedFiltersLoading: false,

  // ============ SYSTEM SETTINGS ACTIONS ============

  /**
   * Fetch system settings (SuperAdmin only)
   */
  fetchSystemSettings: async () => {
    // Check if user is SuperAdmin
    const user = useAuthStore.getState().user;
    if (user?.role !== 'SuperAdmin') return;

    set({ systemSettingsLoading: true, systemSettingsError: null });
    try {
      const settings = await getSystemSettings();
      set({ systemSettings: settings, systemSettingsLoading: false });
      return settings;
    } catch (error) {
      set({
        systemSettingsError: error.response?.data?.error || error.message,
        systemSettingsLoading: false
      });
      throw error;
    }
  },

  /**
   * Fetch public settings (Unauthenticated)
   */
  fetchPublicSettings: async () => {
    // Don't set global loading state to avoid flickering admin forms
    try {
      // Dynamic import to avoid circular dependencies if any
      const { getPublicSettings } = await import('../lib/services/settingsService');
      const settings = await getPublicSettings();

      // Update store but preserve existing keys if we have full settings
      set((state) => ({
        systemSettings: state.systemSettings ? { ...state.systemSettings, ...settings } : settings
      }));
      return settings;
    } catch (error) {
      console.warn('Failed to fetch public settings:', error);
      return null;
    }
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (settings) => {
    set({ systemSettingsLoading: true, systemSettingsError: null });
    try {
      const updated = await updateSystemSettings(settings);
      set({ systemSettings: updated, systemSettingsLoading: false });
      return updated;
    } catch (error) {
      set({
        systemSettingsError: error.response?.data?.error || error.message,
        systemSettingsLoading: false
      });
      throw error;
    }
  },

  // ============ USER PREFERENCES ACTIONS ============

  /**
   * Fetch user preferences
   */
  fetchUserPreferences: async (userId) => {
    set({ userPreferencesLoading: true, userPreferencesError: null });
    try {
      const prefs = await getUserPreferences(userId);
      set({ userPreferences: prefs, userPreferencesLoading: false });
      return prefs;
    } catch (error) {
      set({
        userPreferencesError: error.response?.data?.error || error.message,
        userPreferencesLoading: false
      });
      throw error;
    }
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: async (userId, preferences) => {
    set({ userPreferencesLoading: true, userPreferencesError: null });
    try {
      const updated = await updateUserPrefsAPI(userId, preferences);
      set({ userPreferences: updated, userPreferencesLoading: false });
      return updated;
    } catch (error) {
      set({
        userPreferencesError: error.response?.data?.error || error.message,
        userPreferencesLoading: false
      });
      throw error;
    }
  },

  /**
   * Update specific preference section (e.g., theme, notifications)
   */
  updatePreference: (key, value) => {
    set((state) => ({
      userPreferences: {
        ...state.userPreferences,
        [key]: value
      }
    }));
  },

  /**
   * Update nested preference (e.g., notifications.emailNotifications)
   */
  updateNestedPreference: (path, value) => {
    set((state) => {
      const keys = path.split('.');
      const updated = { ...state.userPreferences };
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return { userPreferences: updated };
    });
  },

  // ============ SAVED FILTERS ACTIONS ============

  /**
   * Fetch saved filters
   */
  fetchSavedFilters: async (userId) => {
    set({ savedFiltersLoading: true });
    try {
      const filters = await getSavedFilters(userId);
      set({ savedFilters: filters, savedFiltersLoading: false });
      return filters;
    } catch (error) {
      set({ savedFiltersLoading: false });
      throw error;
    }
  },

  /**
   * Save a new filter
   */
  saveFilter: async (userId, name, filters) => {
    try {
      const result = await saveFilterAPI(userId, name, filters);
      set((state) => ({
        savedFilters: result // API returns updated filters array
      }));
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a saved filter
   */
  deleteFilter: async (userId, filterId) => {
    try {
      await deleteFilterAPI(userId, filterId);
      set((state) => ({
        savedFilters: state.savedFilters.filter(f => f._id !== filterId)
      }));
    } catch (error) {
      throw error;
    }
  },

  // ============ UTILITY ACTIONS ============

  /**
   * Reset all settings state
   */
  reset: () => {
    set({
      systemSettings: null,
      systemSettingsLoading: false,
      systemSettingsError: null,
      userPreferences: null,
      userPreferencesLoading: false,
      userPreferencesError: null,
      savedFilters: [],
      savedFiltersLoading: false
    });
  },

  /**
   * Clear error messages
   */
  clearErrors: () => {
    set({
      systemSettingsError: null,
      userPreferencesError: null
    });
  }
}));

export default useSettingsStore;
