// Single source of truth for expense categories. Every page that lets a
// user pick, budget against, or display an expense category must import
// from here — a category the form can't produce but budgets track (or vice
// versa) is a bug, not a feature difference.
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Other'
]

export const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛒',
  Entertainment: '🎬',
  Bills: '📄',
  Health: '💊',
  Other: '📦'
}

export const CATEGORY_COLORS = {
  Food: '#ff6b6b',
  Transport: '#4ecdc4',
  Shopping: '#bb86fc',
  Entertainment: '#FFD700',
  Bills: '#00ff88',
  Health: '#ff9f43',
  Other: '#a0a0a0'
}

// Combined icon + color, for components that want both in one lookup.
export const CATEGORY_META = Object.fromEntries(
  EXPENSE_CATEGORIES.map((cat) => [cat, { icon: CATEGORY_ICONS[cat], color: CATEGORY_COLORS[cat] }])
)

export const DEFAULT_CATEGORY_BUDGETS = {
  Food: 6000,
  Transport: 3000,
  Shopping: 4000,
  Entertainment: 2000,
  Bills: 5000,
  Health: 2000,
  Other: 3000
}
