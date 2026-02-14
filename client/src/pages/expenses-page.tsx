import { useExpenses, useDeleteExpense } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { ExpenseDialog } from "@/components/forms/expense-dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const deleteMutation = useDeleteExpense();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">Detailed list of your transactions.</p>
        </div>
        <ExpenseDialog />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {expenses?.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:bg-muted/30 transition-all border-border/50 hover:border-primary/30 group">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                      <Tag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{expense.description || expense.category}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                          {expense.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <span className="text-xl font-bold text-destructive font-mono">
                      -{Number(expense.amount).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(expense.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {expenses?.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
            <h3 className="text-lg font-medium">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">Add your first expense to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}
