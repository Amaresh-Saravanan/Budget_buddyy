import { useExpenses, useReminders } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Wallet, Bell } from "lucide-react";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPage() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: reminders, isLoading: remindersLoading } = useReminders();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  if (expensesLoading || remindersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const selectedExpenses = expenses?.filter(e => isSameDay(new Date(e.date), selectedDate || new Date())) || [];
  const selectedReminders = reminders?.filter(r => isSameDay(new Date(r.dueDate), selectedDate || new Date())) || [];

  const getDayContent = (day: Date) => {
    const dayExpenses = expenses?.filter(e => isSameDay(new Date(e.date), day)) || [];
    const dayReminders = reminders?.filter(r => isSameDay(new Date(r.dueDate), day)) || [];
    
    const totalSpent = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <span className="text-xs">{day.getDate()}</span>
        <div className="flex gap-0.5 mt-0.5">
          {totalSpent > 0 && <div className="w-1 h-1 rounded-full bg-destructive" />}
          {dayReminders.length > 0 && <div className="w-1 h-1 rounded-full bg-blue-400" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">Track your daily spending and upcoming bills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border bg-card w-full"
              components={{
                DayContent: ({ date }) => getDayContent(date)
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate?.toISOString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Expenses
                    </h4>
                    {selectedExpenses.length > 0 ? (
                      <div className="space-y-2">
                        {selectedExpenses.map(e => (
                          <div key={e.id} className="flex justify-between text-sm p-2 rounded bg-muted/30 border border-border/50">
                            <span>{e.description || e.category}</span>
                            <span className="text-destructive font-medium">-{Number(e.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No expenses recorded.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Bell className="w-3 h-3" /> Reminders
                    </h4>
                    {selectedReminders.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReminders.map(r => (
                          <div key={r.id} className="flex justify-between text-sm p-2 rounded bg-blue-400/10 border border-blue-400/20">
                            <span>{r.title}</span>
                            <span className="text-blue-400 font-medium">{Number(r.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No reminders for this day.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
