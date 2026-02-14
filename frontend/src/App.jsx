import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Calendar from './components/Calendar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'

function AppContent() {
  const [expenses, setExpenses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const location = useLocation()

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
              onClick={() => setShowForm(true)}
              className="bg-[#bb86fc] hover:bg-[#a370e6] text-white px-6 py-2 rounded-lg font-medium transition-all hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
            >
              + Add Expense
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4">
            <Link
              to="/expenses"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/expenses'
                  ? 'bg-[#bb86fc] text-white'
                  : 'text-[#a0a0a0] hover:text-[#bb86fc] hover:bg-[#0f0f0f]'
              }`}
            >
              Expenses
            </Link>
            <Link
              to="/calendar"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/calendar'
                  ? 'bg-[#bb86fc] text-white'
                  : 'text-[#a0a0a0] hover:text-[#bb86fc] hover:bg-[#0f0f0f]'
              }`}
            >
              Calendar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Routes */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<ExpenseList expenses={expenses} onDelete={handleDeleteExpense} onUpdate={handleUpdateExpense} />} />
          <Route path="/expenses" element={<ExpenseList expenses={expenses} onDelete={handleDeleteExpense} onUpdate={handleUpdateExpense} />} />
          <Route path="/calendar" element={<Calendar expenses={expenses} />} />
        </Routes>
      </main>

      {/* Expense Form Modal */}
      <ExpenseForm 
        show={showForm}
        onClose={() => setShowForm(false)}
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