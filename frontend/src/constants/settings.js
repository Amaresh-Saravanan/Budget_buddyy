import { DEFAULT_CATEGORY_BUDGETS } from './categories'

// Mirrors the `settings` JSONB default in backend/models/schema.js.
export const DEFAULT_SETTINGS = {
  monthlyBudget: 25000,
  currency: '₹',
  categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
  notifications: {
    budgetAlerts: true,
    dailySummary: true,
    reminderNotifications: true,
    weeklyReport: false,
    savingsMilestones: true
  }
}

// The server is the source of truth for settings; this cache only exists so
// the first paint after a reload isn't the default budget flashing before the
// real one arrives. Never write to it as a substitute for saving.
const CACHE_KEY = 'budgetbuddy_settings_cache'

export function readCachedSettings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return mergeSettings(DEFAULT_SETTINGS, JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeCachedSettings(settings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works
    // from server state — the cache is only a first-paint optimisation.
  }
}

export function clearCachedSettings() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // See above.
  }
}

// Merges a partial settings object over a base, one level deep for the two
// nested objects so a patch touching only monthlyBudget doesn't wipe budgets.
export function mergeSettings(base, patch) {
  if (!patch) return base
  return {
    ...base,
    ...patch,
    categoryBudgets: { ...base.categoryBudgets, ...(patch.categoryBudgets || {}) },
    notifications: { ...base.notifications, ...(patch.notifications || {}) }
  }
}
