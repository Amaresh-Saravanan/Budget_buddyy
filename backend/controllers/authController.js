import { db } from '../config/db.js'
import { users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

// @desc    Sync user from Clerk (create or update)
// @route   POST /api/auth/sync
// @access  Private
export const syncUser = async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = req.body

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)

    let user
    if (existingUser.length > 0) {
      // Update existing user
      const updated = await db.update(users)
        .set({
          email: email || existingUser[0].email,
          firstName: firstName || existingUser[0].firstName,
          lastName: lastName || existingUser[0].lastName,
          imageUrl: imageUrl || existingUser[0].imageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.clerkId, clerkId))
        .returning()
      user = updated[0]
    } else {
      // Create new user
      const inserted = await db.insert(users)
        .values({
          clerkId,
          email,
          firstName,
          lastName,
          imageUrl
        })
        .returning()
      user = inserted[0]
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error syncing user', 
      error: error.message 
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const result = await db.select().from(users).where(eq(users.clerkId, req.userId)).limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
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

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const { monthlyBudget, currency, categoryBudgets, notifications } = req.body

    const result = await db.select().from(users).where(eq(users.clerkId, req.userId)).limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    const currentSettings = result[0].settings || {}
    
    // Merge settings
    const newSettings = {
      ...currentSettings,
      ...(monthlyBudget !== undefined && { monthlyBudget }),
      ...(currency && { currency }),
      ...(categoryBudgets && { categoryBudgets: { ...currentSettings.categoryBudgets, ...categoryBudgets } }),
      ...(notifications && { notifications: { ...currentSettings.notifications, ...notifications } })
    }

    const updated = await db.update(users)
      .set({ settings: newSettings, updatedAt: new Date() })
      .where(eq(users.clerkId, req.userId))
      .returning()

    res.json({ success: true, data: updated[0].settings })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating settings', 
      error: error.message 
    })
  }
}

// @desc    Update gamification stats
// @route   PUT /api/auth/gamification
// @access  Private
export const updateGamification = async (req, res) => {
  try {
    const { points, badge, achievement, streak } = req.body

    const result = await db.select().from(users).where(eq(users.clerkId, req.userId)).limit(1)

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    const currentGamification = result[0].gamification || {
      totalPoints: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      achievements: []
    }

    // Add points and calculate level
    if (points) {
      currentGamification.totalPoints += points
      currentGamification.level = Math.floor(currentGamification.totalPoints / 1000) + 1
    }

    // Add badge
    if (badge) {
      const existingBadge = currentGamification.badges.find(b => b.id === badge.id)
      if (!existingBadge) {
        currentGamification.badges.push({
          ...badge,
          earnedAt: new Date()
        })
      }
    }

    // Update achievement
    if (achievement) {
      const existingIndex = currentGamification.achievements.findIndex(a => a.id === achievement.id)
      if (existingIndex >= 0) {
        currentGamification.achievements[existingIndex].progress = achievement.progress
        if (achievement.progress >= currentGamification.achievements[existingIndex].target) {
          currentGamification.achievements[existingIndex].completed = true
          currentGamification.achievements[existingIndex].completedAt = new Date()
        }
      } else {
        currentGamification.achievements.push(achievement)
      }
    }

    // Update streak
    if (streak !== undefined) {
      currentGamification.currentStreak = streak
      if (streak > currentGamification.longestStreak) {
        currentGamification.longestStreak = streak
      }
      currentGamification.lastActivityDate = new Date()
    }

    const updated = await db.update(users)
      .set({ gamification: currentGamification, updatedAt: new Date() })
      .where(eq(users.clerkId, req.userId))
      .returning()

    res.json({ success: true, data: updated[0].gamification })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating gamification', 
      error: error.message 
    })
  }
}

// @desc    Handle Clerk webhook events
// @route   POST /api/auth/webhook
// @access  Public (verified by webhook signature)
export const handleWebhook = async (req, res) => {
  try {
    const evt = req.webhookEvent
    const { type, data } = evt

    switch (type) {
      case 'user.created':
        await db.insert(users).values({
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          imageUrl: data.image_url || ''
        })
        break

      case 'user.updated':
        await db.update(users)
          .set({
            email: data.email_addresses?.[0]?.email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            imageUrl: data.image_url,
            updatedAt: new Date()
          })
          .where(eq(users.clerkId, data.id))
        break

      case 'user.deleted':
        await db.delete(users).where(eq(users.clerkId, data.id))
        break
    }

    res.json({ success: true, received: true })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Webhook handler error', 
      error: error.message 
    })
  }
}

export default {
  syncUser,
  getMe,
  updateSettings,
  updateGamification,
  handleWebhook
}