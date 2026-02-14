import passport from "passport";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // === Auth Routes ===
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const { username, password } = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    try {
      api.auth.login.input.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return next(err);
    }
  }, (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.sendStatus(401);
    }
  });

  app.patch(api.auth.updateBudget.path, requireAuth, async (req, res) => {
    try {
      const { monthlyBudget } = api.auth.updateBudget.input.parse(req.body);
      const user = await storage.updateUserBudget(req.user!.id, monthlyBudget);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  // === Expenses Routes ===
  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses(req.user!.id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    try {
      const bodySchema = api.expenses.create.input.extend({
        date: z.coerce.date(),
      });
      const input = bodySchema.parse(req.body);
      const expense = await storage.createExpense({ ...input, userId: req.user!.id });
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.delete(api.expenses.delete.path, requireAuth, async (req, res) => {
    await storage.deleteExpense(Number(req.params.id), req.user!.id);
    res.sendStatus(204);
  });

  // === Savings Routes ===
  app.get(api.savings.list.path, requireAuth, async (req, res) => {
    const savings = await storage.getSavings(req.user!.id);
    res.json(savings);
  });

  app.post(api.savings.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.savings.create.input.parse(req.body);
      const saving = await storage.createSaving({ ...input, userId: req.user!.id });
      res.status(201).json(saving);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.patch(api.savings.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.savings.update.input.parse(req.body);
      const updated = await storage.updateSaving(Number(req.params.id), req.user!.id, input);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.delete(api.savings.delete.path, requireAuth, async (req, res) => {
    await storage.deleteSaving(Number(req.params.id), req.user!.id);
    res.sendStatus(204);
  });

  // === Reminders Routes ===
  app.get(api.reminders.list.path, requireAuth, async (req, res) => {
    const reminders = await storage.getReminders(req.user!.id);
    res.json(reminders);
  });

  app.post(api.reminders.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reminders.create.input.parse(req.body);
      const reminder = await storage.createReminder({ ...input, userId: req.user!.id });
      res.status(201).json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.patch(api.reminders.togglePaid.path, requireAuth, async (req, res) => {
    try {
      const { isPaid } = api.reminders.togglePaid.input.parse(req.body);
      const updated = await storage.updateReminder(Number(req.params.id), req.user!.id, { isPaid });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.delete(api.reminders.delete.path, requireAuth, async (req, res) => {
    await storage.deleteReminder(Number(req.params.id), req.user!.id);
    res.sendStatus(204);
  });

  // Seed Data
  if (app.get("env") === "development") {
    await seedDatabase();
  }

  return httpServer;
}

async function seedDatabase() {
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    const hashedPassword = await hashPassword("password");
    const user = await storage.createUser({ username: "demo", password: hashedPassword });
    console.log("Seeded demo user");

    await storage.createExpense({
      userId: user.id,
      amount: "45.50",
      category: "Food",
      description: "Grocery shopping",
      date: new Date(),
    });
    await storage.createExpense({
      userId: user.id,
      amount: "120.00",
      category: "Transport",
      description: "Monthly train ticket",
      date: new Date(),
    });

    await storage.createSaving({
      userId: user.id,
      name: "New Laptop",
      targetAmount: "1500.00",
      currentAmount: "450.00",
      color: "#00ff88",
    });

    await storage.createReminder({
      userId: user.id,
      title: "Internet Bill",
      amount: "60.00",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
      isPaid: false,
    });
    
    console.log("Seeded sample data");
  }
}
