import { useExpenses, useSavings, useReminders } from "@/hooks/use-resources";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Target, Bell, Wallet } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: savings, isLoading: savingsLoading } = useSavings();
  const { data: reminders, isLoading: remindersLoading } = useReminders();

  if (expensesLoading || savingsLoading || remindersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate Stats
  const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const totalSavings = savings?.reduce((sum, item) => sum + Number(item.currentAmount), 0) || 0;
  const activeReminders = reminders?.filter(r => !r.isPaid)?.length || 0;
  const monthlyBudget = Number(user?.monthlyBudget) || 1000;
  const budgetProgress = Math.min((totalExpenses / monthlyBudget) * 100, 100);

  // Chart Data: Category Breakdown
  const categoryData = expenses?.reduce((acc: any[], item) => {
    const existing = acc.find(c => c.name === item.category);
    if (existing) {
      existing.value += Number(item.amount);
    } else {
      acc.push({ name: item.category, value: Number(item.amount) });
    }
    return acc;
  }, []) || [];

  const COLORS = ['#bb86fc', '#00ff88', '#4da6ff', '#ff4444', '#f59e0b', '#64748b'];

  // Chart Data: Savings Progress
  const savingsData = savings?.map(s => ({
    name: s.name,
    saved: Number(s.currentAmount),
    target: Number(s.targetAmount)
  })) || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Your financial health at a glance.</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="bg-card/30 border-primary/10 px-4 py-2 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Budget</span>
              <span className="text-sm font-bold">{monthlyBudget.toFixed(0)}</span>
            </div>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  budgetProgress > 90 ? "bg-destructive" : budgetProgress > 70 ? "bg-yellow-500" : "bg-primary"
                )}
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
          </Card>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold text-sm">Health Score: 85</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur-sm border-accent/20 hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Across {savings?.length} goals</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="bg-card/50 backdrop-blur-sm border-blue-400/20 hover:border-blue-400/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
              <Bell className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeReminders}</div>
              <p className="text-xs text-muted-foreground">Bills due soon</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Where your money went this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Savings Goals</CardTitle>
              <CardDescription>Progress towards your targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={savingsData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fill: '#a0a0a0', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="saved" stackId="a" fill="#00ff88" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="target" stackId="b" fill="#333" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses?.slice(0, 5).map((expense, i) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{expense.description || expense.category}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="font-bold text-destructive">
                    -{Number(expense.amount).toFixed(2)}
                  </div>
                </div>
              ))}
              {(!expenses || expenses.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent transactions found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
