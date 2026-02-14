import { useReminders, useCreateReminder, useDeleteReminder, useToggleReminderPaid } from "@/hooks/use-resources";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Plus, Bell, CheckCircle2, Circle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReminderSchema, type InsertReminder } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function AddReminderDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateReminder();
  
  const form = useForm<InsertReminder>({
    resolver: zodResolver(insertReminderSchema),
    defaultValues: { title: "", amount: "0", dueDate: new Date() },
  });

  const onSubmit = (data: InsertReminder) => {
    createMutation.mutate({
      ...data,
      amount: data.amount.toString(),
      dueDate: new Date(data.dueDate),
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>New Bill Reminder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Rent, Netflix, Internet..." {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} 
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className="bg-background border-input" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Set Reminder"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function RemindersPage() {
  const { data: reminders, isLoading } = useReminders();
  const deleteMutation = useDeleteReminder();
  const togglePaidMutation = useToggleReminderPaid();

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const sortedReminders = [...(reminders || [])].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bill Reminders</h2>
          <p className="text-muted-foreground">Stay on top of your upcoming payments.</p>
        </div>
        <AddReminderDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {sortedReminders.map((reminder, i) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                "p-5 transition-all border shadow-md relative overflow-hidden group",
                reminder.isPaid 
                  ? "bg-muted/30 border-border/30 opacity-70" 
                  : "bg-card border-blue-500/20 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
              )}>
                {reminder.isPaid && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">PAID</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4 relative z-20">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    reminder.isPaid ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-500"
                  )}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 px-2 transition-colors",
                        reminder.isPaid ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-green-500"
                      )}
                      onClick={() => togglePaidMutation.mutate({ id: reminder.id, isPaid: !reminder.isPaid })}
                    >
                      {reminder.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(reminder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative z-20">
                  <h3 className={cn("text-lg font-semibold", reminder.isPaid && "line-through text-muted-foreground")}>
                    {reminder.title}
                  </h3>
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-sm text-muted-foreground">
                      Due: <span className={cn(
                        "font-medium",
                        !reminder.isPaid && new Date(reminder.dueDate) < new Date() ? "text-destructive" : ""
                      )}>
                        {format(new Date(reminder.dueDate), 'MMM dd')}
                      </span>
                    </div>
                    <div className={cn("text-xl font-bold font-mono", reminder.isPaid ? "text-muted-foreground" : "text-foreground")}>
                      {Number(reminder.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sortedReminders.length === 0 && (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
            <h3 className="text-lg font-medium">No bills? Lucky you!</h3>
            <p className="text-muted-foreground">Add a reminder if you have upcoming payments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
