// API Service for BudgetBuddy
// Connects frontend to backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Helper to get auth token from Clerk
const getAuthToken = async () => {
  // This will be called from components that have access to Clerk's useAuth
  // For now, we'll get it from the passed token parameter
  return null
}

// Generic API request function
const apiRequest = async (endpoint, options = {}, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'API request failed')
    }

    return data
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

// ==================== AUTH API ====================

export const authAPI = {
  // Sync user from Clerk to backend
  syncUser: async (userData, token) => {
    return apiRequest('/auth/sync', {
      method: 'POST',
      body: JSON.stringify(userData)
    }, token)
  },

  // Get current user profile
  getMe: async (token) => {
    return apiRequest('/auth/me', { method: 'GET' }, token)
  },

  // Update user settings
  updateSettings: async (settings, token) => {
    return apiRequest('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }, token)
  },

  // Update gamification stats
  updateGamification: async (data, token) => {
    return apiRequest('/auth/gamification', {
      method: 'PUT',
      body: JSON.stringify(data)
    }, token)
  }
}

// ==================== EXPENSES API ====================

export const expensesAPI = {
  // Get all expenses
  getAll: async (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/expenses?${queryString}` : '/expenses'
    return apiRequest(endpoint, { method: 'GET' }, token)
  },

  // Get single expense
  getOne: async (id, token) => {
    return apiRequest(`/expenses/${id}`, { method: 'GET' }, token)
  },

  // Create expense
  create: async (expense, token) => {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    }, token)
  },

  // Update expense
  update: async (id, expense, token) => {
    return apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense)
    }, token)
  },

  // Delete expense
  delete: async (id, token) => {
    return apiRequest(`/expenses/${id}`, { method: 'DELETE' }, token)
  },

  // Get expense statistics
  getStats: async (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/expenses/stats?${queryString}` : '/expenses/stats'
    return apiRequest(endpoint, { method: 'GET' }, token)
  }
}

// ==================== SAVINGS API ====================

export const savingsAPI = {
  // Get all savings
  getAll: async (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/savings?${queryString}` : '/savings'
    return apiRequest(endpoint, { method: 'GET' }, token)
  },

  // Create saving
  create: async (saving, token) => {
    return apiRequest('/savings', {
      method: 'POST',
      body: JSON.stringify(saving)
    }, token)
  },

  // Update saving
  update: async (id, saving, token) => {
    return apiRequest(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saving)
    }, token)
  },

  // Delete saving
  delete: async (id, token) => {
    return apiRequest(`/savings/${id}`, { method: 'DELETE' }, token)
  },

  // ===== Saving Goals =====
  
  // Get all saving goals
  getGoals: async (token) => {
    return apiRequest('/savings/goals', { method: 'GET' }, token)
  },

  // Create saving goal
  createGoal: async (goal, token) => {
    return apiRequest('/savings/goals', {
      method: 'POST',
      body: JSON.stringify(goal)
    }, token)
  },

  // Update saving goal
  updateGoal: async (id, goal, token) => {
    return apiRequest(`/savings/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal)
    }, token)
  },

  // Delete saving goal
  deleteGoal: async (id, token) => {
    return apiRequest(`/savings/goals/${id}`, { method: 'DELETE' }, token)
  }
}

// ==================== REMINDERS API ====================

export const remindersAPI = {
  // Get all reminders
  getAll: async (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/reminders?${queryString}` : '/reminders'
    return apiRequest(endpoint, { method: 'GET' }, token)
  },

  // Get single reminder
  getOne: async (id, token) => {
    return apiRequest(`/reminders/${id}`, { method: 'GET' }, token)
  },

  // Create reminder
  create: async (reminder, token) => {
    return apiRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder)
    }, token)
  },

  // Update reminder
  update: async (id, reminder, token) => {
    return apiRequest(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminder)
    }, token)
  },

  // Mark reminder as complete
  complete: async (id, token) => {
    return apiRequest(`/reminders/${id}/complete`, { method: 'PUT' }, token)
  },

  // Delete reminder
  delete: async (id, token) => {
    return apiRequest(`/reminders/${id}`, { method: 'DELETE' }, token)
  },

  // Get upcoming reminders
  getUpcoming: async (token) => {
    return apiRequest('/reminders/upcoming', { method: 'GET' }, token)
  }
}

// ==================== HEALTH CHECK ====================

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

// Export all APIs
export default {
  auth: authAPI,
  expenses: expensesAPI,
  savings: savingsAPI,
  reminders: remindersAPI,
  healthCheck
}
