import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, useUser, useClerk, useAuth } from '@clerk/clerk-react'
import Calendar from './components/Calendar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Savings from './components/Savings'
import Reminders from './components/Reminders'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Gamification from './pages/Gamification'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SSOCallback from './pages/SSOCallback'
import ForgotPassword from './pages/ForgotPassword'
import Income from './pages/Income'
import Toast from './components/Toast'
import { authAPI, expensesAPI, savingsAPI, remindersAPI, incomeAPI } from './services/api'
import {
  DEFAULT_SETTINGS,
  readCachedSettings,
  writeCachedSettings,
  clearCachedSettings,
  mergeSettings
} from './constants/settings'
import { LogOut } from 'lucide-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk Publishable Key')
}

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

// Protected Route Component
function ProtectedRoute({ children }) {
  return (
    <SignedIn>
      {children}
    </SignedIn>
  )
}

// Redirect to login if not signed in
function RequireAuth({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/" replace /></SignedOut>
    </>
  )
}

// Public Route (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  return (
    <>
      <SignedOut>{children}</SignedOut>
      <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
    </>
  )
}

function AppContent() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const [expenses, setExpenses] = useState([])
  const [savings, setSavings] = useState([])
  const [reminders, setReminders] = useState([])
  const [income, setIncome] = useState([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [toast, setToast] = useState(null)
  // Settings live here, fetched from the server, so every page reads the same
  // values. Seeded from cache purely so the first paint isn't the default
  // budget flashing before the real one loads.
  const [settings, setSettings] = useState(readCachedSettings)
  const location = useLocation()

  const showToast = (message, type = 'error') => setToast({ message, type })

  // Persists a partial settings change, then adopts what the server returns.
  const handleUpdateSettings = async (patch) => {
    const previous = settings
    const optimistic = mergeSettings(settings, patch)
    setSettings(optimistic)

    try {
      const token = await getToken()
      const response = await authAPI.updateSettings(patch, token)
      const saved = response?.success && response.data
        ? mergeSettings(DEFAULT_SETTINGS, response.data)
        : optimistic
      setSettings(saved)
      writeCachedSettings(saved)
      return saved
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSettings(previous)
      showToast('Could not save settings. Check your connection and try again.')
      throw error
    }
  }

  // Fetch settings and all records from the database
  const refetchData = async () => {
    const token = await getToken()

    try {
      const me = await authAPI.getMe(token)
      if (me.success && me.data) {
        const serverSettings = mergeSettings(DEFAULT_SETTINGS, me.data.settings)
        setSettings(serverSettings)
        writeCachedSettings(serverSettings)
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    }

    try {
      const expensesRes = await expensesAPI.getAll({}, token)
      if (expensesRes.success && expensesRes.data) {
        setExpenses(expensesRes.data)
      }
    } catch (e) {
      console.error('Failed to fetch expenses:', e)
    }

    try {
      const savingsRes = await savingsAPI.getAll({}, token)
      if (savingsRes.success && savingsRes.data) {
        setSavings(savingsRes.data)
      }
    } catch (e) {
      console.error('Failed to fetch savings:', e)
    }

    try {
      const remindersRes = await remindersAPI.getAll({}, token)
      if (remindersRes.success && remindersRes.data) {
        setReminders(remindersRes.data)
      }
    } catch (e) {
      console.error('Failed to fetch reminders:', e)
    }

    try {
      const incomeRes = await incomeAPI.getAll({}, token)
      if (incomeRes.success && incomeRes.data) {
        setIncome(incomeRes.data)
      }
    } catch (e) {
      console.error('Failed to fetch income:', e)
    }
  }

  // Sync user to database and fetch data when logged in
  useEffect(() => {
    const initializeUserData = async () => {
      if (user) {
        try {
          setIsLoadingData(true)
          const token = await getToken()

          // Sync user first
          await authAPI.syncUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl
          }, token)
          console.log('User synced to database')

          await refetchData()
        } catch (error) {
          console.error('Failed to initialize user data:', error)
        } finally {
          setIsLoadingData(false)
        }
      }
    }
    initializeUserData()
  }, [user, getToken])

  // Expense handlers - now save to database
  // Every handler below follows the same rule: only touch local state after
  // the server confirms the write. A failed request shows an error toast and
  // leaves state exactly as it was — never "succeeds" locally while the
  // database silently disagrees.
  const handleAddExpense = async (newExpense) => {
    try {
      const token = await getToken()
      const response = await expensesAPI.create(newExpense, token)
      if (response.success && response.data) {
        setExpenses([response.data, ...expenses])
      }
    } catch (error) {
      console.error('Failed to add expense:', error)
      showToast('Could not save expense. Check your connection and try again.')
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      const token = await getToken()
      await expensesAPI.delete(id, token)
      setExpenses(expenses.filter(exp => exp.id !== id))
    } catch (error) {
      console.error('Failed to delete expense:', error)
      showToast('Could not delete expense. Check your connection and try again.')
    }
  }

  const handleUpdateExpense = async (updatedExpense) => {
    try {
      const token = await getToken()
      const response = await expensesAPI.update(updatedExpense.id, updatedExpense, token)
      if (response.success && response.data) {
        setExpenses(expenses.map(exp =>
          exp.id === updatedExpense.id ? response.data : exp
        ))
      }
    } catch (error) {
      console.error('Failed to update expense:', error)
      showToast('Could not save changes. Check your connection and try again.')
    }
  }

  // Saving handlers - now save to database
  const handleAddSaving = async (newSaving) => {
    try {
      const token = await getToken()
      const response = await savingsAPI.create(newSaving, token)
      if (response.success && response.data) {
        setSavings([response.data, ...savings])
      }
    } catch (error) {
      console.error('Failed to add saving:', error)
      showToast('Could not save deposit. Check your connection and try again.')
    }
  }

  const handleDeleteSaving = async (id) => {
    try {
      const token = await getToken()
      await savingsAPI.delete(id, token)
      setSavings(savings.filter(sav => sav.id !== id))
    } catch (error) {
      console.error('Failed to delete saving:', error)
      showToast('Could not delete deposit. Check your connection and try again.')
    }
  }

  const handleUpdateSaving = async (updatedSaving) => {
    try {
      const token = await getToken()
      const response = await savingsAPI.update(updatedSaving.id, updatedSaving, token)
      if (response.success && response.data) {
        setSavings(savings.map(sav =>
          sav.id === updatedSaving.id ? response.data : sav
        ))
      }
    } catch (error) {
      console.error('Failed to update saving:', error)
      showToast('Could not save changes. Check your connection and try again.')
    }
  }

  // Reminder handlers - now save to database
  const handleAddReminder = async (newReminder) => {
    try {
      const token = await getToken()
      const response = await remindersAPI.create(newReminder, token)
      if (response.success && response.data) {
        setReminders([response.data, ...reminders])
      }
    } catch (error) {
      console.error('Failed to add reminder:', error)
      showToast('Could not save reminder. Check your connection and try again.')
    }
  }

  const handleDeleteReminder = async (id) => {
    try {
      const token = await getToken()
      await remindersAPI.delete(id, token)
      setReminders(reminders.filter(rem => rem.id !== id))
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      showToast('Could not delete reminder. Check your connection and try again.')
    }
  }

  const handleUpdateReminder = async (updatedReminder) => {
    try {
      const token = await getToken()
      const response = await remindersAPI.update(updatedReminder.id, updatedReminder, token)
      if (response.success && response.data) {
        setReminders(reminders.map(rem =>
          rem.id === updatedReminder.id ? response.data : rem
        ))
      }
    } catch (error) {
      console.error('Failed to update reminder:', error)
      showToast('Could not save changes. Check your connection and try again.')
    }
  }

  // Marking a bill paid can spawn the next occurrence of a recurring
  // reminder server-side, so refetch rather than assuming the local list
  // is still complete after the toggle.
  const handleToggleReminderComplete = async (reminder) => {
    const target = !reminder.isCompleted
    try {
      const token = await getToken()
      const response = await remindersAPI.setCompleted(reminder.id, target, token)
      if (response.success && response.data) {
        setReminders(reminders.map(rem => (rem.id === reminder.id ? response.data : rem)))
        if (target && reminder.isRecurring) {
          const refreshed = await remindersAPI.getAll({}, token)
          if (refreshed.success && refreshed.data) setReminders(refreshed.data)
        }
      }
    } catch (error) {
      console.error('Failed to update reminder:', error)
      showToast(`Could not mark this bill as ${target ? 'paid' : 'unpaid'}. Check your connection and try again.`)
    }
  }

  // Income handlers - now save to database
  const handleAddIncome = async (newIncome) => {
    try {
      const token = await getToken()
      const response = await incomeAPI.create(newIncome, token)
      if (response.success && response.data) {
        setIncome([response.data, ...income])
      }
    } catch (error) {
      console.error('Failed to add income:', error)
      showToast('Could not save income. Check your connection and try again.')
    }
  }

  const handleDeleteIncome = async (id) => {
    try {
      const token = await getToken()
      await incomeAPI.delete(id, token)
      setIncome(income.filter(inc => inc.id !== id))
    } catch (error) {
      console.error('Failed to delete income:', error)
      showToast('Could not delete income. Check your connection and try again.')
    }
  }

  // Settings handlers
  const handleClearAllData = async () => {
    try {
      const token = await getToken()
      await Promise.all([
        expensesAPI.deleteAll(token),
        savingsAPI.deleteAll(token),
        remindersAPI.deleteAll(token),
        incomeAPI.deleteAll(token)
      ])
      setExpenses([])
      setSavings([])
      setReminders([])
      setIncome([])
    } catch (error) {
      console.error('Failed to clear all data:', error)
      showToast('Could not clear all data. Some items may remain — check your connection and try again.')
      throw error
    }
  }

  const handleImportExpenses = async (importedExpenses) => {
    const token = await getToken()
    const created = []

    for (const expense of importedExpenses) {
      try {
        const response = await expensesAPI.create(expense, token)
        if (response.success && response.data) {
          created.push(response.data)
        }
      } catch (error) {
        console.error('Failed to import expense:', error)
      }
    }

    if (created.length > 0) {
      setExpenses(prev => [...created, ...prev])
    }

    if (created.length === importedExpenses.length) {
      showToast(`Imported ${created.length} expense(s)`, 'success')
    } else if (created.length > 0) {
      showToast(`Imported ${created.length} of ${importedExpenses.length} expenses — the rest failed. Check your connection and try again.`, 'warning')
    } else {
      showToast('Could not import expenses. Check your connection and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e0e0e0]">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header with Navigation */}
      <nav className="bg-[#1a1a1a] border-b border-[#333] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#bb86fc]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              BudgetBuddy
            </h1>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExpenseForm(true)}
                className="bg-[#bb86fc] hover:bg-[#a370e6] text-white px-6 py-2 rounded-lg font-medium transition-all hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
              >
                + Add Expense
              </button>
              
              {/* User Menu */}
              <div className="flex items-center gap-3">
                {user?.imageUrl && (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border-2 border-[#bb86fc]"
                  />
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-[#e0e0e0] text-sm font-medium">{user?.fullName || user?.firstName || 'User'}</p>
                  <p className="text-[#666] text-xs">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-[#a0a0a0] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
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
              to="/income"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/income'
                  ? 'bg-[#00ff88] text-[#0f0f0f] shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#00ff88] hover:bg-[#0f0f0f]'
              }`}
            >
              💵 Income
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
              to="/gamification"
              className={`px-5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                location.pathname === '/gamification'
                  ? 'bg-[#FFD700] text-[#0f0f0f] shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                  : 'text-[#a0a0a0] hover:text-[#FFD700] hover:bg-[#0f0f0f]'
              }`}
            >
              🏆 Achievements
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
            path="/dashboard" 
            element={
              <Dashboard
                expenses={expenses}
                savings={savings}
                reminders={reminders}
                income={income}
                settings={settings}
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
            path="/income"
            element={
              <Income
                incomes={income}
                onAddIncome={handleAddIncome}
                onDeleteIncome={handleDeleteIncome}
                onSyncComplete={refetchData}
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
                onToggleComplete={handleToggleReminderComplete}
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
                settings={settings}
              />
            }
          />
          <Route 
            path="/analytics" 
            element={
              <Analytics
                expenses={expenses}
                savings={savings}
                income={income}
                settings={settings}
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
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onClearAllData={handleClearAllData}
                onImportExpenses={handleImportExpenses}
              />
            }
          />
          <Route
            path="/gamification"
            element={
              <Gamification
                expenses={expenses}
                savings={savings}
                reminders={reminders}
                settings={settings}
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          
          {/* Protected Routes - Main App */}
          <Route path="/*" element={<RequireAuth><AppContent /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
