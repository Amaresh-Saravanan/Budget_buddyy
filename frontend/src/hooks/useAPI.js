// Custom hook for API calls with Clerk authentication
import { useAuth } from '@clerk/clerk-react'
import { useCallback, useState } from 'react'
import { authAPI, expensesAPI, savingsAPI, remindersAPI } from '../services/api'

export const useAPI = () => {
  const { getToken, userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get auth token from Clerk
  const fetchToken = useCallback(async () => {
    try {
      const token = await getToken()
      return token
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }, [getToken])

  // Wrapper for API calls with loading state
  const callAPI = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)
    try {
      const token = await fetchToken()
      const result = await apiCall(token)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchToken])

  // ==================== AUTH ====================
  const syncUser = useCallback(async (userData) => {
    return callAPI((token) => authAPI.syncUser(userData, token))
  }, [callAPI])

  const getMe = useCallback(async () => {
    return callAPI((token) => authAPI.getMe(token))
  }, [callAPI])

  const updateSettings = useCallback(async (settings) => {
    return callAPI((token) => authAPI.updateSettings(settings, token))
  }, [callAPI])

  const updateGamification = useCallback(async (data) => {
    return callAPI((token) => authAPI.updateGamification(data, token))
  }, [callAPI])

  // ==================== EXPENSES ====================
  const getExpenses = useCallback(async (params) => {
    return callAPI((token) => expensesAPI.getAll(params, token))
  }, [callAPI])

  const createExpense = useCallback(async (expense) => {
    return callAPI((token) => expensesAPI.create(expense, token))
  }, [callAPI])

  const updateExpense = useCallback(async (id, expense) => {
    return callAPI((token) => expensesAPI.update(id, expense, token))
  }, [callAPI])

  const deleteExpense = useCallback(async (id) => {
    return callAPI((token) => expensesAPI.delete(id, token))
  }, [callAPI])

  const getExpenseStats = useCallback(async (params) => {
    return callAPI((token) => expensesAPI.getStats(params, token))
  }, [callAPI])

  // ==================== SAVINGS ====================
  const getSavings = useCallback(async (params) => {
    return callAPI((token) => savingsAPI.getAll(params, token))
  }, [callAPI])

  const createSaving = useCallback(async (saving) => {
    return callAPI((token) => savingsAPI.create(saving, token))
  }, [callAPI])

  const updateSaving = useCallback(async (id, saving) => {
    return callAPI((token) => savingsAPI.update(id, saving, token))
  }, [callAPI])

  const deleteSaving = useCallback(async (id) => {
    return callAPI((token) => savingsAPI.delete(id, token))
  }, [callAPI])

  const getSavingGoals = useCallback(async () => {
    return callAPI((token) => savingsAPI.getGoals(token))
  }, [callAPI])

  const createSavingGoal = useCallback(async (goal) => {
    return callAPI((token) => savingsAPI.createGoal(goal, token))
  }, [callAPI])

  const updateSavingGoal = useCallback(async (id, goal) => {
    return callAPI((token) => savingsAPI.updateGoal(id, goal, token))
  }, [callAPI])

  const deleteSavingGoal = useCallback(async (id) => {
    return callAPI((token) => savingsAPI.deleteGoal(id, token))
  }, [callAPI])

  // ==================== REMINDERS ====================
  const getReminders = useCallback(async (params) => {
    return callAPI((token) => remindersAPI.getAll(params, token))
  }, [callAPI])

  const createReminder = useCallback(async (reminder) => {
    return callAPI((token) => remindersAPI.create(reminder, token))
  }, [callAPI])

  const updateReminder = useCallback(async (id, reminder) => {
    return callAPI((token) => remindersAPI.update(id, reminder, token))
  }, [callAPI])

  const completeReminder = useCallback(async (id) => {
    return callAPI((token) => remindersAPI.complete(id, token))
  }, [callAPI])

  const deleteReminder = useCallback(async (id) => {
    return callAPI((token) => remindersAPI.delete(id, token))
  }, [callAPI])

  const getUpcomingReminders = useCallback(async () => {
    return callAPI((token) => remindersAPI.getUpcoming(token))
  }, [callAPI])

  return {
    // State
    loading,
    error,
    userId,
    
    // Auth
    syncUser,
    getMe,
    updateSettings,
    updateGamification,
    
    // Expenses
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    
    // Savings
    getSavings,
    createSaving,
    updateSaving,
    deleteSaving,
    getSavingGoals,
    createSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    
    // Reminders
    getReminders,
    createReminder,
    updateReminder,
    completeReminder,
    deleteReminder,
    getUpcomingReminders
  }
}

export default useAPI
