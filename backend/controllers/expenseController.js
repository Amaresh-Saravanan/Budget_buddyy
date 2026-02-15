import { db } from '../config/db.js'
import { expenses } from '../models/schema.js'
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm'

// @desc    Get all expenses for a user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, limit = 50, page = 1 } = req.query
    
    const conditions = [eq(expenses.userId, req.userId)]

    // Date filters
    if (startDate) {
      conditions.push(gte(expenses.date, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(expenses.date, new Date(endDate)))
    }
    if (category) {
      conditions.push(eq(expenses.category, category))
    }

    const offset = (page - 1) * limit

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(expenses)
      .where(and(...conditions))
    const total = totalResult[0]?.count || 0

    // Get expenses
    const result = await db.select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date))
      .limit(parseInt(limit))
      .offset(offset)

    res.json({
      success: true,
      data: result,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res) => {
  try {
    const result = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.id, parseInt(req.params.id)),
        eq(expenses.userId, req.userId)
      ))
      .limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      })
    }

    res.json({ success: true, data: result[0] })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { amount, category, description, note, date, tags } = req.body

    const result = await db.insert(expenses)
      .values({
        userId: req.userId,
        amount,
        category,
        description: description || note || category,
        note: note || description || '',
        date: date ? new Date(date) : new Date(),
        tags: tags || []
      })
      .returning()

    res.status(201).json({ success: true, data: result[0] })
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid data', 
      error: error.message 
    })
  }
}

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { amount, category, description, note, date, tags } = req.body

    const result = await db.update(expenses)
      .set({
        ...(amount !== undefined && { amount }),
        ...(category && { category }),
        ...(description && { description }),
        ...(note && { note }),
        ...(date && { date: new Date(date) }),
        ...(tags && { tags }),
        updatedAt: new Date()
      })
      .where(and(
        eq(expenses.id, parseInt(req.params.id)),
        eq(expenses.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      })
    }

    res.json({ success: true, data: result[0] })
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid data', 
      error: error.message 
    })
  }
}

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const result = await db.delete(expenses)
      .where(and(
        eq(expenses.id, parseInt(req.params.id)),
        eq(expenses.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Expense not found' 
      })
    }

    res.json({ success: true, message: 'Expense deleted' })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
export const getExpenseStats = async (req, res) => {
  try {
    const { month, year } = req.query
    const currentDate = new Date()
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth()
    const targetYear = year ? parseInt(year) : currentDate.getFullYear()

    // Start and end of month
    const startOfMonth = new Date(targetYear, targetMonth, 1)
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

    // Get monthly expenses
    const monthlyExpenses = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, req.userId),
        gte(expenses.date, startOfMonth),
        lte(expenses.date, endOfMonth)
      ))

    // Calculate total spent
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    // Category breakdown
    const categoryBreakdown = {}
    monthlyExpenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0
      }
      categoryBreakdown[exp.category] += exp.amount
    })

    // Daily breakdown
    const dailyBreakdown = {}
    monthlyExpenses.forEach(exp => {
      const day = new Date(exp.date).getDate()
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = 0
      }
      dailyBreakdown[day] += exp.amount
    })

    // Weekly stats (last 4 weeks)
    const weeklyStats = []
    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() - (i * 7))
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 7)

      const weekExpenses = await db.select()
        .from(expenses)
        .where(and(
          eq(expenses.userId, req.userId),
          gte(expenses.date, weekStart),
          lte(expenses.date, weekEnd)
        ))

      weeklyStats.push({
        week: i + 1,
        total: weekExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        count: weekExpenses.length
      })
    }

    res.json({
      success: true,
      data: {
        totalSpent,
        expenseCount: monthlyExpenses.length,
        categoryBreakdown,
        dailyBreakdown,
        weeklyStats,
        month: targetMonth + 1,
        year: targetYear
      }
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

export default {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
}