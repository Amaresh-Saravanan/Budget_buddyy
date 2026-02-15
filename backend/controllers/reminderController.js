import { db } from '../config/db.js'
import { reminders } from '../models/schema.js'
import { eq, and, gte, lte, asc, desc } from 'drizzle-orm'

// @desc    Get all reminders for a user
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    const { upcoming, completed, limit = 50, page = 1 } = req.query
    
    const conditions = [eq(reminders.userId, req.userId)]

    // Filter by completion status
    if (upcoming === 'true') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      conditions.push(gte(reminders.date, today))
      conditions.push(eq(reminders.isCompleted, false))
    }
    if (completed === 'true') {
      conditions.push(eq(reminders.isCompleted, true))
    }

    const offset = (page - 1) * limit

    // Get reminders
    const result = await db.select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(asc(reminders.date))
      .limit(parseInt(limit))
      .offset(offset)

    // Get count
    const allReminders = await db.select()
      .from(reminders)
      .where(and(...conditions))
    const total = allReminders.length

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

// @desc    Get a single reminder
// @route   GET /api/reminders/:id
// @access  Private
export const getReminder = async (req, res) => {
  try {
    const result = await db.select()
      .from(reminders)
      .where(and(
        eq(reminders.id, parseInt(req.params.id)),
        eq(reminders.userId, req.userId)
      ))
      .limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
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

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req, res) => {
  try {
    const { title, description, amount, date, time, category, isRecurring, recurringFrequency } = req.body

    const result = await db.insert(reminders)
      .values({
        userId: req.userId,
        title,
        description,
        amount: amount || 0,
        date: new Date(date),
        time: time || '09:00',
        category: category || 'Other',
        isRecurring: isRecurring || false,
        recurringFrequency: recurringFrequency || null
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

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
export const updateReminder = async (req, res) => {
  try {
    const { title, description, amount, date, time, category, isRecurring, recurringFrequency } = req.body

    const result = await db.update(reminders)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(date && { date: new Date(date) }),
        ...(time && { time }),
        ...(category && { category }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurringFrequency !== undefined && { recurringFrequency }),
        updatedAt: new Date()
      })
      .where(and(
        eq(reminders.id, parseInt(req.params.id)),
        eq(reminders.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
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

// @desc    Mark reminder as completed
// @route   PUT /api/reminders/:id/complete
// @access  Private
export const completeReminder = async (req, res) => {
  try {
    // Get reminder first
    const existing = await db.select()
      .from(reminders)
      .where(and(
        eq(reminders.id, parseInt(req.params.id)),
        eq(reminders.userId, req.userId)
      ))
      .limit(1)

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      })
    }

    const reminder = existing[0]

    // Mark as completed
    await db.update(reminders)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reminders.id, parseInt(req.params.id)))

    // If recurring, create next reminder
    if (reminder.isRecurring && reminder.recurringFrequency) {
      const nextDate = new Date(reminder.date)
      
      switch (reminder.recurringFrequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1)
          break
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          break
      }

      await db.insert(reminders)
        .values({
          userId: req.userId,
          title: reminder.title,
          description: reminder.description,
          amount: reminder.amount,
          date: nextDate,
          time: reminder.time,
          category: reminder.category,
          isRecurring: reminder.isRecurring,
          recurringFrequency: reminder.recurringFrequency
        })
    }

    const updated = await db.select()
      .from(reminders)
      .where(eq(reminders.id, parseInt(req.params.id)))
      .limit(1)

    res.json({ success: true, data: updated[0] })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    const result = await db.delete(reminders)
      .where(and(
        eq(reminders.id, parseInt(req.params.id)),
        eq(reminders.userId, req.userId)
      ))
      .returning()

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found' 
      })
    }

    res.json({ success: true, message: 'Reminder deleted' })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    })
  }
}

// @desc    Get upcoming reminders for today/this week
// @route   GET /api/reminders/upcoming
// @access  Private
export const getUpcomingReminders = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    // Today's reminders
    const todayReminders = await db.select()
      .from(reminders)
      .where(and(
        eq(reminders.userId, req.userId),
        gte(reminders.date, today),
        lte(reminders.date, todayEnd),
        eq(reminders.isCompleted, false)
      ))
      .orderBy(asc(reminders.time))

    // This week's reminders (excluding today)
    const tomorrowStart = new Date(today)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    
    const weekReminders = await db.select()
      .from(reminders)
      .where(and(
        eq(reminders.userId, req.userId),
        gte(reminders.date, tomorrowStart),
        lte(reminders.date, weekFromNow),
        eq(reminders.isCompleted, false)
      ))
      .orderBy(asc(reminders.date), asc(reminders.time))

    res.json({
      success: true,
      data: {
        today: todayReminders,
        thisWeek: weekReminders,
        totalUpcoming: todayReminders.length + weekReminders.length
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
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  getUpcomingReminders
}
