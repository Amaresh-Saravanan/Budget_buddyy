import { useAuth } from "@/hooks/use-auth";
import { useExpenses, useSavings } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, LogOut, TrendingUp, TrendingDown, User as UserIcon, Wallet, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

const budgetSchema = z.object({
  monthlyBudget: z.string().min(1, "Budget is required"),
});

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      monthlyBudget: user?.monthlyBudget || "1000.00",
    },
  });

  const updateBudgetMutation = async (values: z.infer<typeof budgetSchema>) => {
    try {
      await apiRequest("PATCH", api.auth.updateBudget.path, values);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({
        title: "Success",
        description: "Monthly budget updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget.",
        variant: "destructive",
      });
    }
  };

  if (expensesLoading || savingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalSaved = savings?.reduce((sum, s) => sum + Number(s.currentAmount), 0) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your account and view your impact.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{user?.username}</h3>
                <p className="text-sm text-muted-foreground italic">Active Budget Buddy</p>
              </div>
              <Button 
                variant="outline" 
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Monthly Budget
            </CardTitle>
            <CardDescription>Set your monthly spending limit.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(updateBudgetMutation)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Lifetime Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalSpent.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Lifetime Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalSaved.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
