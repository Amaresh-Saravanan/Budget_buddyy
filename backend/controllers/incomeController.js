import { db } from '../config/db.js'
import { incomes } from '../models/schema.js'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

// @desc    Get all income entries for a user
// @route   GET /api/income
// @access  Private
export const getIncomes = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const conditions = [eq(incomes.userId, req.userId)]
    if (startDate) conditions.push(gte(incomes.date, new Date(startDate)))
    if (endDate) conditions.push(lte(incomes.date, new Date(endDate)))

    const result = await db.select()
      .from(incomes)
      .where(and(...conditions))
      .orderBy(desc(incomes.date))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

// @desc    Create an income entry
// @route   POST /api/income
// @access  Private
export const createIncome = async (req, res) => {
  try {
    const { amount, source, category, note, date } = req.body

    const result = await db.insert(incomes)
      .values({
        userId: req.userId,
        amount,
        source: source || 'Income',
        category: category || 'Other',
        note: note || '',
        date: date ? new Date(date) : new Date()
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

// @desc    Update an income entry
// @route   PUT /api/income/:id
// @access  Private
export const updateIncome = async (req, res) => {
  try {
    const { amount, source, category, note, date } = req.body

    const result = await db.update(incomes)
      .set({
        ...(amount !== undefined && { amount }),
        ...(source && { source }),
        ...(category && { category }),
        ...(note !== undefined && { note }),
        ...(date && { date: new Date(date) }),
        updatedAt: new Date()
      })
      .where(and(
        eq(incomes.id, parseInt(req.params.id)),
        eq(incomes.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Income entry not found' })
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

// @desc    Delete an income entry
// @route   DELETE /api/income/:id
// @access  Private
export const deleteIncome = async (req, res) => {
  try {
    const result = await db.delete(incomes)
      .where(and(
        eq(incomes.id, parseInt(req.params.id)),
        eq(incomes.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Income entry not found' })
    }

    res.json({ success: true, message: 'Income entry deleted' })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

export default {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome
}
