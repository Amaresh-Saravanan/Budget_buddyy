import { db } from '../config/db.js'
import { savings, savingGoals } from '../models/schema.js'
import { eq, and, gte, lte, desc, sql, sum } from 'drizzle-orm'

// @desc    Get all savings for a user
// @route   GET /api/savings
// @access  Private
export const getSavings = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query
    
    const conditions = [eq(savings.userId, req.userId)]

    // Date filters
    if (startDate) {
      conditions.push(gte(savings.date, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(savings.date, new Date(endDate)))
    }

    const offset = (page - 1) * limit

    // Get savings
    const result = await db.select()
      .from(savings)
      .where(and(...conditions))
      .orderBy(desc(savings.date))
      .limit(parseInt(limit))
      .offset(offset)

    // Get total saved
    const totalResult = await db.select({ total: sum(savings.amount) })
      .from(savings)
      .where(eq(savings.userId, req.userId))
    const totalSaved = totalResult[0]?.total || 0

    // Get count
    const allSavings = await db.select()
      .from(savings)
      .where(and(...conditions))
    const total = allSavings.length

    res.json({
      success: true,
      data: result,
      totalSaved: parseFloat(totalSaved),
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

// @desc    Create a saving entry
// @route   POST /api/savings
// @access  Private
export const createSaving = async (req, res) => {
  try {
    const { amount, note, date, goalId } = req.body

    const result = await db.insert(savings)
      .values({
        userId: req.userId,
        amount,
        note: note || 'Savings',
        date: date ? new Date(date) : new Date(),
        goalId: goalId || null
      })
      .returning()

    // If linked to a goal, update the goal's current amount
    if (goalId) {
      const goal = await db.select().from(savingGoals).where(eq(savingGoals.id, goalId)).limit(1)
      if (goal.length > 0) {
        await db.update(savingGoals)
          .set({ 
            currentAmount: (goal[0].currentAmount || 0) + amount,
            updatedAt: new Date()
          })
          .where(eq(savingGoals.id, goalId))
      }
    }

    res.status(201).json({ success: true, data: result[0] })
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid data', 
      error: error.message 
    })
  }
}

// @desc    Update a saving entry
// @route   PUT /api/savings/:id
// @access  Private
export const updateSaving = async (req, res) => {
  try {
    const { amount, note, date } = req.body

    // Get old saving first
    const oldSaving = await db.select()
      .from(savings)
      .where(and(
        eq(savings.id, parseInt(req.params.id)),
        eq(savings.userId, req.userId)
      ))
      .limit(1)

    if (oldSaving.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Saving not found' 
      })
    }

    // If amount changed and linked to goal, update goal
    if (amount && oldSaving[0].goalId) {
      const amountDiff = amount - oldSaving[0].amount
      const goal = await db.select().from(savingGoals).where(eq(savingGoals.id, oldSaving[0].goalId)).limit(1)
      if (goal.length > 0) {
        await db.update(savingGoals)
          .set({ 
            currentAmount: (goal[0].currentAmount || 0) + amountDiff,
            updatedAt: new Date()
          })
          .where(eq(savingGoals.id, oldSaving[0].goalId))
      }
    }

    const result = await db.update(savings)
      .set({
        ...(amount !== undefined && { amount }),
        ...(note && { note }),
        ...(date && { date: new Date(date) }),
        updatedAt: new Date()
      })
      .where(and(
        eq(savings.id, parseInt(req.params.id)),
        eq(savings.userId, req.userId)
      ))
      .returning()

    res.json({ success: true, data: result[0] })
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid data', 
      error: error.message 
    })
  }
}

// @desc    Delete a saving entry
// @route   DELETE /api/savings/:id
// @access  Private
export const deleteSaving = async (req, res) => {
  try {
    // Get saving first
    const saving = await db.select()
      .from(savings)
      .where(and(
        eq(savings.id, parseInt(req.params.id)),
        eq(savings.userId, req.userId)
      ))
      .limit(1)

    if (saving.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Saving not found' 
      })
    }

    // If linked to goal, subtract from goal's current amount
    if (saving[0].goalId) {
      const goal = await db.select().from(savingGoals).where(eq(savingGoals.id, saving[0].goalId)).limit(1)
      if (goal.length > 0) {
        await db.update(savingGoals)
          .set({ 
            currentAmount: Math.max(0, (goal[0].currentAmount || 0) - saving[0].amount),
            updatedAt: new Date()
          })
          .where(eq(savingGoals.id, saving[0].goalId))
      }
    }

    await db.delete(savings)
      .where(and(
        eq(savings.id, parseInt(req.params.id)),
        eq(savings.userId, req.userId)
      ))

    res.json({ success: true, message: 'Saving deleted' })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// ================== SAVING GOALS ==================

// @desc    Get all saving goals
// @route   GET /api/savings/goals
// @access  Private
export const getSavingGoals = async (req, res) => {
  try {
    const goals = await db.select()
      .from(savingGoals)
      .where(eq(savingGoals.userId, req.userId))
      .orderBy(desc(savingGoals.createdAt))

    res.json({ success: true, data: goals })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Create a saving goal
// @route   POST /api/savings/goals
// @access  Private
export const createSavingGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, icon, color } = req.body

    const result = await db.insert(savingGoals)
      .values({
        userId: req.userId,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || '🎯',
        color: color || '#00ff88'
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

// @desc    Update a saving goal
// @route   PUT /api/savings/goals/:id
// @access  Private
export const updateSavingGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, icon, color, currentAmount } = req.body

    const updateData = {
      ...(name && { name }),
      ...(targetAmount !== undefined && { targetAmount }),
      ...(deadline && { deadline: new Date(deadline) }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(currentAmount !== undefined && { currentAmount }),
      updatedAt: new Date()
    }

    const result = await db.update(savingGoals)
      .set(updateData)
      .where(and(
        eq(savingGoals.id, parseInt(req.params.id)),
        eq(savingGoals.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Goal not found' 
      })
    }

    // Check if goal is completed
    if (result[0].currentAmount >= result[0].targetAmount && !result[0].isCompleted) {
      await db.update(savingGoals)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(eq(savingGoals.id, parseInt(req.params.id)))
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

// @desc    Delete a saving goal
// @route   DELETE /api/savings/goals/:id
// @access  Private
export const deleteSavingGoal = async (req, res) => {
  try {
    const result = await db.delete(savingGoals)
      .where(and(
        eq(savingGoals.id, parseInt(req.params.id)),
        eq(savingGoals.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Goal not found' 
      })
    }

    // Unlink all savings from this goal
    await db.update(savings)
      .set({ goalId: null })
      .where(eq(savings.goalId, parseInt(req.params.id)))

    res.json({ success: true, message: 'Goal deleted' })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

export default {
  getSavings,
  createSaving,
  updateSaving,
  deleteSaving,
  getSavingGoals,
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal
}
