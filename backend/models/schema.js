import { pgTable, text, integer, boolean, timestamp, real, jsonb, serial, varchar, date } from 'drizzle-orm/pg-core'

// ==================== USERS TABLE ====================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  imageUrl: text('image_url'),
  
  // Settings as JSONB
  settings: jsonb('settings').default({
    monthlyBudget: 25000,
    currency: '₹',
    categoryBudgets: {
      Food: 6000,
      Transport: 3000,
      Shopping: 4000,
      Entertainment: 2000,
      Bills: 5000,
      Health: 2000,
      Other: 3000
    },
    notifications: {
      email: true,
      push: true,
      budgetAlerts: true
    }
  }),
  
  // Gamification as JSONB
  gamification: jsonb('gamification').default({
    totalPoints: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    badges: [],
    achievements: []
  }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== EXPENSES TABLE ====================
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  amount: real('amount').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  note: text('note'),
  date: timestamp('date').notNull().defaultNow(),
  
  // Recurring expense settings
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }),
  nextDate: timestamp('next_date'),
  
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== SAVINGS TABLE ====================
export const savings = pgTable('savings', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  amount: real('amount').notNull(),
  note: text('note').default('Savings'),
  date: timestamp('date').notNull().defaultNow(),
  goalId: integer('goal_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== SAVING GOALS TABLE ====================
export const savingGoals = pgTable('saving_goals', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0),
  deadline: timestamp('deadline'),
  icon: varchar('icon', { length: 10 }).default('🎯'),
  color: varchar('color', { length: 20 }).default('#00ff88'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== INCOMES TABLE ====================
export const incomes = pgTable('incomes', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  amount: real('amount').notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).default('Other'),
  note: text('note'),
  date: timestamp('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== EMAIL CONNECTIONS TABLE ====================
// One row per user, mapping them to the unique inbox tag
// (base+<syncToken>@gmail.com) their forwarded bank alerts arrive at.
// status: 'pending' (token issued, nothing seen yet) ->
//         'code_ready' (Gmail's forwarding-confirmation email arrived,
//         code captured) -> 'active' (at least one transaction imported).
export const emailConnections = pgTable('email_connections', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  syncToken: varchar('sync_token', { length: 32 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  confirmationCode: text('confirmation_code'),
  confirmationRawText: text('confirmation_raw_text'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ==================== SYNCED EMAILS TABLE (dedupe ledger) ====================
export const syncedEmails = pgTable('synced_emails', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 998 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  amount: real('amount'),
  createdAt: timestamp('created_at').defaultNow()
})

// ==================== REMINDERS TABLE ====================
export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount: real('amount').default(0),
  date: timestamp('date').notNull(),
  time: varchar('time', { length: 10 }).default('09:00'),
  category: varchar('category', { length: 50 }).default('Other'),
  
  // Recurring settings
  isRecurring: boolean('is_recurring').default(false),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }),
  
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  notificationSent: boolean('notification_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
