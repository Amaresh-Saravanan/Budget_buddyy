import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }).default("1000.00").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Linked to users.id manually in storage
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
});

export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  color: text("color").default("#00ff88"), // Default to accent green
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, userId: true });
export const insertSavingSchema = createInsertSchema(savings).omit({ id: true, userId: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, userId: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Saving = typeof savings.$inferSelect;
export type InsertSaving = z.infer<typeof insertSavingSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Request types
export type CreateExpenseRequest = InsertExpense;
export type CreateSavingRequest = InsertSaving;
export type CreateReminderRequest = InsertReminder;
export type UpdateSavingRequest = Partial<InsertSaving>;
export type UpdateReminderRequest = Partial<InsertReminder>;
