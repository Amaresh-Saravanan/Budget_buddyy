import {
  users,
  expenses,
  savings,
  reminders,
  type User,
  type InsertUser,
  type Expense,
  type InsertExpense,
  type Saving,
  type InsertSaving,
  type Reminder,
  type InsertReminder,
  type UpdateSavingRequest,
  type UpdateReminderRequest,
} from "@shared/schema";
import { db, pool, isDatabaseConfigured } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";


export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBudget(id: number, budget: string): Promise<User | undefined>;

  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense & { userId: number }): Promise<Expense>;
  deleteExpense(id: number, userId: number): Promise<void>;

  getSavings(userId: number): Promise<Saving[]>;
  createSaving(saving: InsertSaving & { userId: number }): Promise<Saving>;
  updateSaving(id: number, userId: number, updates: UpdateSavingRequest): Promise<Saving | undefined>;
  deleteSaving(id: number, userId: number): Promise<void>;

  getReminders(userId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder & { userId: number }): Promise<Reminder>;
  updateReminder(id: number, userId: number, updates: UpdateReminderRequest): Promise<Reminder | undefined>;
  deleteReminder(id: number, userId: number): Promise<void>;

  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

const coerceDecimal = (value: unknown, fallback: string) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return typeof value === "string" ? value : String(value);
};

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (!pool || !db) {
      throw new Error("Database is not configured.");
    }
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBudget(id: number, budget: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ monthlyBudget: budget })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async deleteExpense(id: number, userId: number): Promise<void> {
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  }

  async getSavings(userId: number): Promise<Saving[]> {
    return db.select().from(savings).where(eq(savings.userId, userId));
  }

  async createSaving(saving: InsertSaving & { userId: number }): Promise<Saving> {
    const [newSaving] = await db.insert(savings).values(saving).returning();
    return newSaving;
  }

  async updateSaving(id: number, userId: number, updates: UpdateSavingRequest): Promise<Saving | undefined> {
    const [updated] = await db.update(savings)
      .set(updates)
      .where(and(eq(savings.id, id), eq(savings.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSaving(id: number, userId: number): Promise<void> {
    await db.delete(savings).where(and(eq(savings.id, id), eq(savings.userId, userId)));
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async createReminder(reminder: InsertReminder & { userId: number }): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, userId: number, updates: UpdateReminderRequest): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders)
      .set(updates)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();
    return updated;
  }

  async deleteReminder(id: number, userId: number): Promise<void> {
    await db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
  }
}


class MemoryStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private expenses: Expense[] = [];
  private savings: Saving[] = [];
  private reminders: Reminder[] = [];
  private userId = 1;
  private expenseId = 1;
  private savingId = 1;
  private reminderId = 1;

  constructor() {
    this.sessionStore = new session.MemoryStore();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.userId++,
      username: user.username,
      password: user.password,
      monthlyBudget: coerceDecimal(user.monthlyBudget, "1000.00"),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserBudget(id: number, budget: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    user.monthlyBudget = coerceDecimal(budget, user.monthlyBudget);
    return user;
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return this.expenses.filter((expense) => expense.userId === userId);
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    const newExpense: Expense = {
      id: this.expenseId++,
      userId: expense.userId,
      amount: coerceDecimal(expense.amount, "0"),
      category: expense.category,
      description: expense.description ?? null,
      date: expense.date ? new Date(expense.date) : new Date(),
    };
    this.expenses.push(newExpense);
    return newExpense;
  }

  async deleteExpense(id: number, userId: number): Promise<void> {
    this.expenses = this.expenses.filter(
      (expense) => !(expense.id === id && expense.userId === userId),
    );
  }

  async getSavings(userId: number): Promise<Saving[]> {
    return this.savings.filter((saving) => saving.userId === userId);
  }

  async createSaving(saving: InsertSaving & { userId: number }): Promise<Saving> {
    const newSaving: Saving = {
      id: this.savingId++,
      userId: saving.userId,
      name: saving.name,
      targetAmount: coerceDecimal(saving.targetAmount, "0"),
      currentAmount: coerceDecimal(saving.currentAmount ?? "0", "0"),
      color: saving.color ?? "#00ff88",
    };
    this.savings.push(newSaving);
    return newSaving;
  }

  async updateSaving(
    id: number,
    userId: number,
    updates: UpdateSavingRequest,
  ): Promise<Saving | undefined> {
    const saving = this.savings.find(
      (item) => item.id === id && item.userId === userId,
    );
    if (!saving) return undefined;
    if (updates.name !== undefined) saving.name = updates.name;
    if (updates.targetAmount !== undefined) {
      saving.targetAmount = coerceDecimal(updates.targetAmount, saving.targetAmount);
    }
    if (updates.currentAmount !== undefined) {
      saving.currentAmount = coerceDecimal(updates.currentAmount, saving.currentAmount);
    }
    if (updates.color !== undefined) saving.color = updates.color;
    return saving;
  }

  async deleteSaving(id: number, userId: number): Promise<void> {
    this.savings = this.savings.filter(
      (saving) => !(saving.id === id && saving.userId === userId),
    );
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return this.reminders.filter((reminder) => reminder.userId === userId);
  }

  async createReminder(reminder: InsertReminder & { userId: number }): Promise<Reminder> {
    const newReminder: Reminder = {
      id: this.reminderId++,
      userId: reminder.userId,
      title: reminder.title,
      amount: coerceDecimal(reminder.amount, "0"),
      dueDate: new Date(reminder.dueDate),
      isPaid: reminder.isPaid ?? false,
    };
    this.reminders.push(newReminder);
    return newReminder;
  }

  async updateReminder(
    id: number,
    userId: number,
    updates: UpdateReminderRequest,
  ): Promise<Reminder | undefined> {
    const reminder = this.reminders.find(
      (item) => item.id === id && item.userId === userId,
    );
    if (!reminder) return undefined;
    if (updates.title !== undefined) reminder.title = updates.title;
    if (updates.amount !== undefined) {
      reminder.amount = coerceDecimal(updates.amount, reminder.amount);
    }
    if (updates.dueDate !== undefined) {
      reminder.dueDate = new Date(updates.dueDate);
    }
    if (updates.isPaid !== undefined) reminder.isPaid = updates.isPaid;
    return reminder;
  }

  async deleteReminder(id: number, userId: number): Promise<void> {
    this.reminders = this.reminders.filter(
      (reminder) => !(reminder.id === id && reminder.userId === userId),
    );
  }
}

export const storage = isDatabaseConfigured ? new DatabaseStorage() : new MemoryStorage();
