import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Calendar from './components/Calendar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Savings from './components/Savings'
import Reminders from './components/Reminders'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

// Sample expense data
const sampleExpenses = [
  { id: 1, description: 'Lunch at Restaurant', amount: 280, category: 'Food', date: new Date().toISOString() },
  { id: 2, description: 'Uber Ride to Office', amount: 180, category: 'Transport', date: new Date().toISOString() },
  { id: 3, description: 'Groceries at BigBazaar', amount: 1850, category: 'Food', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, description: 'Coffee & Snacks', amount: 220, category: 'Food', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 5, description: 'Auto Rickshaw', amount: 150, category: 'Transport', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 6, description: 'Dinner with Friends', amount: 1200, category: 'Food', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 7, description: 'Movie Night - PVR', amount: 850, category: 'Entertainment', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 8, description: 'Popcorn & Drinks', amount: 450, category: 'Entertainment', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 9, description: 'Electricity Bill', amount: 2200, category: 'Bills', date: new Date(Date.now() - 259200000).toISOString() },
  { id: 10, description: 'Swiggy Order', amount: 380, category: 'Food', date: new Date(Date.now() - 259200000).toISOString() },
  { id: 11, description: 'Metro Card Recharge', amount: 500, category: 'Transport', date: new Date(Date.now() - 345600000).toISOString() },
  { id: 12, description: 'Zomato Dinner', amount: 520, category: 'Food', date: new Date(Date.now() - 345600000).toISOString() },
  { id: 13, description: 'Amazon Shopping', amount: 2800, category: 'Shopping', date: new Date(Date.now() - 432000000).toISOString() },
  { id: 14, description: 'Petrol', amount: 1200, category: 'Transport', date: new Date(Date.now() - 432000000).toISOString() },
  { id: 15, description: 'Gym Membership', amount: 1500, category: 'Health', date: new Date(Date.now() - 518400000).toISOString() },
  { id: 16, description: 'Medicines', amount: 650, category: 'Health', date: new Date(Date.now() - 518400000).toISOString() },
  { id: 17, description: 'Netflix Subscription', amount: 649, category: 'Entertainment', date: new Date(Date.now() - 604800000).toISOString() },
  { id: 18, description: 'Mobile Recharge', amount: 599, category: 'Bills', date: new Date(Date.now() - 691200000).toISOString() },
  { id: 19, description: 'Myntra Shopping', amount: 1800, category: 'Shopping', date: new Date(Date.now() - 777600000).toISOString() },
  { id: 20, description: 'Birthday Gift', amount: 1500, category: 'Shopping', date: new Date(Date.now() - 864000000).toISOString() },
]

function AppContent() {
  const [expenses, setExpenses] = useState(sampleExpenses)
  const [savings, setSavings] = useState([])
  const [reminders, setReminders] = useState([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const location = useLocation()

  // Expense handlers
  const handleAddExpense = (newExpense) => {
    setExpenses([newExpense, ...expenses])
  }

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id))
  }

  const handleUpdateExpense = (updatedExpense) => {
    setExpenses(expenses.map(exp => 
      exp.id === updatedExpense.id ? updatedExpense : exp
    ))
  }

  // Saving handlers
  const handleAddSaving = (newSaving) => {
    setSavings([newSaving, ...savings])
  }

  const handleDeleteSaving = (id) => {
    setSavings(savings.filter(sav => sav.id !== id))
  }

  const handleUpdateSaving = (updatedSaving) => {
    setSavings(savings.map(sav => 
      sav.id === updatedSaving.id ? updatedSaving : sav
    ))
  }

  // Reminder handlers
  const handleAddReminder = (newReminder) => {
    setReminders([newReminder, ...reminders])
  }

  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter(rem => rem.id !== id))
  }

  const handleUpdateReminder = (updatedReminder) => {
    setReminders(reminders.map(rem => 
      rem.id === updatedReminder.id ? updatedReminder : rem
    ))
  }

  // Settings handlers
  const handleClearAllData = () => {
    setExpenses([])
    setSavings([])
    setReminders([])
  }

  const handleImportExpenses = (importedExpenses) => {
    setExpenses(prev => [...importedExpenses, ...prev])
  }

  const handleUpdateBudgets = (categoryBudgets, monthlyBudget) => {
    // Store budgets in localStorage (already handled in Settings)
    console.log('Budgets updated:', categoryBudgets, monthlyBudget)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e0e0e0]">
      {/* Header with Navigation */}
      <nav className="bg-[#1a1a1a] border-b border-[#333] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#bb86fc]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              BudgetBuddy
            </h1>
            
            <button
              onClick={() => setShowExpenseForm(true)}
              className="bg-[#bb86fc] hover:bg-[#a370e6] text-white px-6 py-2 rounded-lg font-medium transition-all hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
            >
              + Add Expense
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-3 overflow-x-auto">
            <Link
              to="/dashboard"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/dashboard' || location.pathname === '/'
                  ? 'bg-[#03DAC6] text-[#0f0f0f] shadow-[0_0_15px_rgba(3,218,198,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#03DAC6] hover:bg-[#0f0f0f]'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/expenses"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/expenses'
                  ? 'bg-[#bb86fc] text-white shadow-[0_0_15px_rgba(187,134,252,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#bb86fc] hover:bg-[#0f0f0f]'
              }`}
            >
              💸 Expenses
            </Link>
            <Link
              to="/savings"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/savings'
                  ? 'bg-[#00ff88] text-[#0f0f0f] shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#00ff88] hover:bg-[#0f0f0f]'
              }`}
            >
              💰 Savings
            </Link>
            <Link
              to="/reminders"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/reminders'
                  ? 'bg-[#FFD700] text-[#0f0f0f] shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#FFD700] hover:bg-[#0f0f0f]'
              }`}
            >
              🔔 Reminders
            </Link>
            <Link
              to="/calendar"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/calendar'
                  ? 'bg-[#bb86fc] text-white shadow-[0_0_15px_rgba(187,134,252,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#bb86fc] hover:bg-[#0f0f0f]'
              }`}
            >
              📅 Calendar
            </Link>
            <Link
              to="/analytics"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/analytics'
                  ? 'bg-[#ff6b6b] text-white shadow-[0_0_15px_rgba(255,107,107,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#ff6b6b] hover:bg-[#0f0f0f]'
              }`}
            >
              📈 Analytics
            </Link>
            <Link
              to="/settings"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/settings'
                  ? 'bg-[#a0a0a0] text-[#0f0f0f] shadow-[0_0_15px_rgba(160,160,160,0.4)]'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#0f0f0f]'
              }`}
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Routes */}
      <main className="p-6">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                expenses={expenses}
                savings={savings}
                reminders={reminders}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                expenses={expenses}
                savings={savings}
                reminders={reminders}
              />
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ExpenseList 
                expenses={expenses} 
                onDelete={handleDeleteExpense} 
                onUpdate={handleUpdateExpense} 
              />
            } 
          />
          <Route 
            path="/savings" 
            element={
              <Savings 
                savings={savings}
                onAddSaving={handleAddSaving}
                onDeleteSaving={handleDeleteSaving}
                onUpdateSaving={handleUpdateSaving}
              />
            } 
          />
          <Route 
            path="/reminders" 
            element={
              <Reminders 
                reminders={reminders}
                onAddReminder={handleAddReminder}
                onDeleteReminder={handleDeleteReminder}
                onUpdateReminder={handleUpdateReminder}
              />
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <Calendar 
                expenses={expenses}
                savings={savings}
                reminders={reminders}
              />
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <Analytics 
                expenses={expenses}
                savings={savings}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Settings 
                expenses={expenses}
                savings={savings}
                reminders={reminders}
                onClearAllData={handleClearAllData}
                onImportExpenses={handleImportExpenses}
                onUpdateBudgets={handleUpdateBudgets}
              />
            } 
          />
        </Routes>
      </main>

      {/* Expense Form Modal */}
      <ExpenseForm 
        show={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
