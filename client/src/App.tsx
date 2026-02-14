import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";

import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import ExpensesPage from "@/pages/expenses-page";
import SavingsPage from "@/pages/savings-page";
import RemindersPage from "@/pages/reminders-page";
import AnalyticsPage from "@/pages/analytics-page";
import CalendarPage from "@/pages/calendar-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner
  
  // If not logged in, redirect handled by auth page logic or conditional rendering
  if (!user) return <AuthPage />;

  return <Component {...rest} />;
}

function Router() {
  return (
    <LayoutShell>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} />} />
        <Route path="/savings" component={() => <ProtectedRoute component={SavingsPage} />} />
        <Route path="/reminders" component={() => <ProtectedRoute component={RemindersPage} />} />
        <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
        <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
        <Route component={NotFound} />
      </Switch>
    </LayoutShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
