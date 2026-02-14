import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertExpense, 
  type InsertSaving, 
  type InsertReminder,
  type Expense,
  type Saving,
  type Reminder 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === EXPENSES ===
export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await fetch(api.expenses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await fetch(api.expenses.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({ title: "Expense Added", description: "Your transaction has been recorded." });
    },
    onError: () => toast({ title: "Error", description: "Could not add expense.", variant: "destructive" }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({ title: "Expense Deleted", description: "The transaction has been removed." });
    },
  });
}

// === SAVINGS ===
export function useSavings() {
  return useQuery<Saving[]>({
    queryKey: [api.savings.list.path],
    queryFn: async () => {
      const res = await fetch(api.savings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch savings");
      return res.json();
    },
  });
}

export function useCreateSaving() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertSaving) => {
      const res = await fetch(api.savings.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savings.list.path] });
      toast({ title: "Goal Created", description: "Time to start saving!" });
    },
  });
}

export function useUpdateSaving() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertSaving>) => {
      const url = buildUrl(api.savings.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savings.list.path] });
      toast({ title: "Goal Updated", description: "Keep up the good work." });
    },
  });
}

export function useDeleteSaving() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.savings.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savings.list.path] });
      toast({ title: "Goal Removed", description: "Savings goal has been deleted." });
    },
  });
}

// === REMINDERS ===
export function useReminders() {
  return useQuery<Reminder[]>({
    queryKey: [api.reminders.list.path],
    queryFn: async () => {
      const res = await fetch(api.reminders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertReminder) => {
      const res = await fetch(api.reminders.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create reminder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Reminder Set", description: "We'll help you remember that bill." });
    },
  });
}

export function useToggleReminderPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, isPaid }: { id: number; isPaid: boolean }) => {
      const url = buildUrl(api.reminders.togglePaid.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ 
        title: variables.isPaid ? "Marked as Paid" : "Marked as Unpaid",
        description: variables.isPaid ? "Great job paying that bill!" : "Status reverted.",
        variant: variables.isPaid ? "default" : "secondary"
      });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reminders.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete reminder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reminders.list.path] });
      toast({ title: "Reminder Deleted", description: "Bill reminder removed." });
    },
  });
}
