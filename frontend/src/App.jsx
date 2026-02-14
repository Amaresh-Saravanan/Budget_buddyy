import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Calendar from './components/Calendar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Savings from './components/Savings'
import Reminders from './components/Reminders'
import Dashboard from './pages/Dashboard'

function AppContent() {
  const [expenses, setExpenses] = useState([])
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
