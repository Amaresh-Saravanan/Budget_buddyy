import { useSavings, useCreateSaving, useDeleteSaving, useUpdateSaving } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trash2, Plus, Target, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSavingSchema, type InsertSaving } from "@shared/schema";
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
import { motion, AnimatePresence } from "framer-motion";

function AddSavingDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateSaving();
  
  const form = useForm<InsertSaving>({
    resolver: zodResolver(insertSavingSchema),
    defaultValues: { name: "", targetAmount: "1000", currentAmount: "0" },
  });

  const onSubmit = (data: InsertSaving) => {
    createMutation.mutate({
      ...data,
      targetAmount: data.targetAmount.toString(),
      currentAmount: data.currentAmount.toString(),
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
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>New Savings Goal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="New Car, Vacation..." {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Already Saved</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateAmountDialog({ saving }: { saving: any }) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateSaving();
  const [amount, setAmount] = useState("");

  const handleUpdate = () => {
    if (!amount) return;
    const newAmount = parseFloat(saving.currentAmount) + parseFloat(amount);
    updateMutation.mutate({
      id: saving.id,
      currentAmount: newAmount.toString()
    }, {
      onSuccess: () => {
        setOpen(false);
        setAmount("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">Add Funds</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add to {saving.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to add</label>
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="bg-background border-input"
              placeholder="0.00" 
            />
          </div>
          <Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Add Funds"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SavingsPage() {
  const { data: savings, isLoading } = useSavings();
  const deleteMutation = useDeleteSaving();

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Savings Goals</h2>
          <p className="text-muted-foreground">Visualize and reach your financial targets.</p>
        </div>
        <AddSavingDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {savings?.map((saving, i) => {
            const progress = Math.min((Number(saving.currentAmount) / Number(saving.targetAmount)) * 100, 100);
            return (
              <motion.div
                key={saving.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card border-border/50 hover:border-accent/30 transition-all shadow-lg overflow-hidden group relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                        <Target className="w-5 h-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(saving.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-xl">{saving.name}</CardTitle>
                    <CardDescription>
                      {Number(saving.currentAmount).toLocaleString()} of {Number(saving.targetAmount).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-accent" />
                    </div>
                    <UpdateAmountDialog saving={saving} />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {savings?.length === 0 && (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No savings goals</h3>
            <p className="text-muted-foreground">Create a goal to start saving for your dreams.</p>
          </div>
        )}
      </div>
    </div>
  );
}
