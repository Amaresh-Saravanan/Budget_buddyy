import { useMemo, useState, useEffect } from 'react'
import SmartAlerts from '../components/SmartAlerts'
import WeeklyProgress from
  "../components/gamification/WeeklyProgress";

// Category icons and colors (budgets come from settings)
const CATEGORY_COLORS = {
  'Food': { icon: '🍔', color: '#ff6b6b' },
  'Transport': { icon: '🚗', color: '#4ecdc4' },
  'Shopping': { icon: '🛒', color: '#bb86fc' },
  'Entertainment': { icon: '🎬', color: '#FFD700' },
  'Bills': { icon: '📄', color: '#00ff88' },
  'Health': { icon: '💊', color: '#ff9f43' },
  'Other': { icon: '📦', color: '#a0a0a0' }
}

// Default budgets (fallback if not set in settings)
const DEFAULT_CATEGORY_BUDGETS = {
  'Food': 6000,
  'Transport': 3000,
  'Shopping': 4000,
  'Entertainment': 2000,
  'Bills': 5000,
  'Health': 2000,
  'Other': 3000
}

// Helper to load from localStorage
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch {
    return defaultValue
  }
}

// Helper to format relative time
function getRelativeTime(date) {
  const now = new Date()
  const expDate = new Date(date)
  const diffMs = now - expDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return expDate.toLocaleDateString()
}

function Dashboard({ expenses, savings, reminders }) {
  const [showScoreDetails, setShowScoreDetails] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Load profile from localStorage (synced with Settings)
  const [profile, setProfile] = useState(() => loadFromStorage('budgetbuddy_profile', {
    name: 'User',
    email: 'user@email.com',
    phone: '',
    currency: '₹',
    monthStartDay: 1
  }))

  // Load budgets from localStorage (synced with Settings)
  const [monthlyBudget, setMonthlyBudget] = useState(() => 
    loadFromStorage('budgetbuddy_monthlyBudget', 25000)
  )
  const [categoryBudgets, setCategoryBudgets] = useState(() => 
    loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS)
  )

  // Listen for localStorage changes (when Settings updates)
  useEffect(() => {
    const handleStorageChange = () => {
      setProfile(loadFromStorage('budgetbuddy_profile', profile))
      setMonthlyBudget(loadFromStorage('budgetbuddy_monthlyBudget', 25000))
      setCategoryBudgets(loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS))
    }

    // Check for updates every time component is focused
    window.addEventListener('focus', handleStorageChange)
    
    // Also check on storage event (for cross-tab sync)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('focus', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Re-check localStorage when component mounts or route changes
  useEffect(() => {
    setProfile(loadFromStorage('budgetbuddy_profile', profile))
    setMonthlyBudget(loadFromStorage('budgetbuddy_monthlyBudget', 25000))
    setCategoryBudgets(loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS))
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Use monthly budget from settings
    const budget = monthlyBudget

    // Get this month's expenses
    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })
    const monthlyTotal = thisMonthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const remaining = budget - monthlyTotal

    // This week's expenses
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const thisWeekExpenses = expenses.filter(exp => new Date(exp.date) >= startOfWeek)
    const weeklySpent = thisWeekExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const weeklySaved = savings
      .filter(sav => new Date(sav.date) >= startOfWeek)
      .reduce((sum, sav) => sum + (parseFloat(sav.amount) || 0), 0)

    // Days until month reset
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysUntilReset = lastDay - now.getDate()

    // Daily allowance
    const dailyAllowance = daysUntilReset > 0 ? remaining / daysUntilReset : 0

    // Category breakdown with budgets from settings
    const categoryBreakdown = {}
    thisMonthExpenses.forEach(exp => {
      const category = exp.category || 'Other'
      if (!categoryBreakdown[category]) {
        const colorConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
        const catBudget = categoryBudgets[category] || DEFAULT_CATEGORY_BUDGETS[category] || 3000
        categoryBreakdown[category] = {
          spent: 0,
          budget: catBudget,
          icon: colorConfig.icon,
          color: colorConfig.color,
          expenses: []
        }
      }
      categoryBreakdown[category].spent += parseFloat(exp.amount) || 0
      categoryBreakdown[category].expenses.push(exp)
    })

    // Add empty categories with budgets from settings
    Object.keys(categoryBudgets).forEach(cat => {
      if (!categoryBreakdown[cat]) {
        const colorConfig = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']
        categoryBreakdown[cat] = {
          spent: 0,
          budget: categoryBudgets[cat],
          icon: colorConfig.icon,
          color: colorConfig.color,
          expenses: []
        }
      }
    })

    // No-spend days this week
    const daysThisWeek = []
    for (let i = 0; i <= now.getDay(); i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      daysThisWeek.push(d.toDateString())
    }
    const spendDays = new Set(thisWeekExpenses.map(exp => new Date(exp.date).toDateString()))
    const noSpendDays = daysThisWeek.filter(d => !spendDays.has(d)).length

    // Finance Health Score Calculation
    const monthProgress = now.getDate() / lastDay
    const budgetUsedPercent = monthlyTotal / budget
    
    // Budget Pacing Score (70% weight)
    let pacingScore = 0
    if (budgetUsedPercent <= monthProgress) {
      pacingScore = 70 // Perfect - under budget for this point in month
    } else {
      const overPace = (budgetUsedPercent - monthProgress) / monthProgress
      pacingScore = Math.max(0, 70 - (overPace * 100))
    }

    // No-Spend Days Score (30% weight)
    const noSpendScore = Math.min(30, noSpendDays * 7.5)

    const healthScore = Math.round(pacingScore + noSpendScore)

    // Total savings
    const totalSavings = savings.reduce((sum, sav) => sum + (parseFloat(sav.amount) || 0), 0)
    const totalSavingsTarget = savings.reduce((sum, sav) => sum + (parseFloat(sav.targetAmount) || 0), 0)

    // Pending reminders
    const pendingReminders = reminders.filter(rem => !rem.completed).length

    return {
      monthlyBudget: budget,
      monthlyTotal,
      remaining,
      weeklySpent,
      weeklySaved,
      daysUntilReset,
      dailyAllowance,
      categoryBreakdown,
      healthScore,
      pacingScore: Math.round(pacingScore),
      noSpendScore: Math.round(noSpendScore),
      noSpendDays,
      budgetUsedPercent: Math.round(budgetUsedPercent * 100),
      monthProgress: Math.round(monthProgress * 100),
      totalSavings,
      totalSavingsTarget,
      pendingReminders,
      totalExpenses: expenses.length
    }
  }, [expenses, savings, reminders, monthlyBudget, categoryBudgets])

  const recentExpenses = expenses.slice(0, 5)
  const currency = profile.currency || '₹'
  const userName = profile.name?.split(' ')[0] || 'User' // Use first name

  // Get health score display info
  const getScoreInfo = (score) => {
    if (score >= 80) return { label: 'Wealthy Mindset', emoji: '🏆', color: '#00ff88', bgColor: 'from-[#00ff88]/20' }
    if (score >= 50) return { label: 'On Track', emoji: '👍', color: '#4ecdc4', bgColor: 'from-[#4ecdc4]/20' }
    if (score >= 20) return { label: 'Warning Zone', emoji: '⚠️', color: '#FFD700', bgColor: 'from-[#FFD700]/20' }
    return { label: 'Emergency Mode', emoji: '🚨', color: '#ff6b6b', bgColor: 'from-[#ff6b6b]/20' }
  }

  const scoreInfo = getScoreInfo(stats.healthScore)

  // Get category status
  const getCategoryStatus = (spent, budget) => {
    const percent = (spent / budget) * 100
    if (percent >= 90) return { icon: '🚨', status: 'critical' }
    if (percent >= 75) return { icon: '⚠️', status: 'warning' }
    return { icon: '✅', status: 'good' }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `${currency}${Math.abs(amount).toLocaleString('en-IN')}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#e0e0e0]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Hi, {userName}! 👋
        </h2>
        <div className="text-right">
          <p className="text-[#666] text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[#666] text-xs mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-[#ff6b6b]">{stats.totalExpenses}</p>
          <p className="text-[#666] text-xs">transactions</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[#666] text-xs mb-1">Total Saved</p>
          <p className="text-2xl font-bold text-[#00ff88]">{formatCurrency(stats.totalSavings)}</p>
          <p className="text-[#666] text-xs">of {formatCurrency(stats.totalSavingsTarget)} goal</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[#666] text-xs mb-1">Pending Bills</p>
          <p className="text-2xl font-bold text-[#FFD700]">{stats.pendingReminders}</p>
          <p className="text-[#666] text-xs">reminders</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <p className="text-[#666] text-xs mb-1">Health Score</p>
          <p className="text-2xl font-bold" style={{ color: scoreInfo.color }}>{stats.healthScore}/100</p>
          <p className="text-[#666] text-xs">{scoreInfo.label}</p>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className={`bg-gradient-to-r ${scoreInfo.bgColor} to-[#1a1a1a] border border-[#333] rounded-2xl p-6`}>
        <div className="text-center mb-4">
          <p className="text-[#a0a0a0] text-sm mb-1">Remaining Budget</p>
          <p className="text-5xl font-bold text-[#e0e0e0]">
            {formatCurrency(stats.remaining)}
          </p>
          <p className="text-[#666] mt-1">out of {formatCurrency(stats.monthlyBudget)}</p>
        </div>

        {/* Finance Health Score Widget */}
        <div 
          className="bg-[#1a1a1a]/80 border border-[#333] rounded-xl p-4 cursor-pointer hover:border-[#bb86fc] transition-all"
          onClick={() => setShowScoreDetails(!showScoreDetails)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Finance Health Score</span>
            <span className="text-sm text-[#666]">Tap to see breakdown</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold" style={{ color: scoreInfo.color }}>
              {stats.healthScore}
              <span className="text-lg text-[#666]"> / 100</span>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-[#333] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.healthScore}%`,
                    backgroundColor: scoreInfo.color
                  }}
                />
              </div>
            </div>
            <div className="text-2xl">{scoreInfo.emoji}</div>
          </div>
          <p className="text-center mt-2" style={{ color: scoreInfo.color }}>
            {scoreInfo.label}
          </p>

          {/* Score Details (Expandable) */}
          {showScoreDetails && (
            <div className="mt-4 pt-4 border-t border-[#333] animate-fadeIn">
              <h4 className="text-[#e0e0e0] font-semibold mb-3">📊 How it's calculated:</h4>
              
              <div className="space-y-3">
                <div className="bg-[#0f0f0f] rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#a0a0a0]">Budget Pacing (70%)</span>
                    <span className="text-[#00ff88]">+{stats.pacingScore} pts</span>
                  </div>
                  <p className="text-[#666] text-sm">
                    You've used {stats.budgetUsedPercent}% with {stats.monthProgress}% of month passed
                  </p>
                </div>

                <div className="bg-[#0f0f0f] rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#a0a0a0]">No-Spend Days (30%)</span>
                    <span className="text-[#00ff88]">+{stats.noSpendScore} pts</span>
                  </div>
                  <p className="text-[#666] text-sm">
                    {stats.noSpendDays} no-spend days this week
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-[#bb86fc]/10 border border-[#bb86fc]/30 rounded-lg p-3">
                <p className="text-[#bb86fc] text-sm">
                  💡 <strong>To reach 80+:</strong> Add {Math.max(0, 4 - stats.noSpendDays)} more no-spend days and stay under daily allowance of {formatCurrency(Math.round(stats.dailyAllowance))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
          📊 Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
            <p className="text-[#666] text-xs mb-1">Spent this week</p>
            <p className="text-xl font-bold text-[#ff6b6b]">{formatCurrency(stats.weeklySpent)}</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
            <p className="text-[#666] text-xs mb-1">Saved this week</p>
            <p className="text-xl font-bold text-[#00ff88]">{formatCurrency(stats.weeklySaved)}</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
            <p className="text-[#666] text-xs mb-1">Days until reset</p>
            <p className="text-xl font-bold text-[#bb86fc]">{stats.daysUntilReset}</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
            <p className="text-[#666] text-xs mb-1">Daily allowance</p>
            <p className="text-xl font-bold text-[#4ecdc4]">{formatCurrency(Math.round(stats.dailyAllowance))}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
          💳 Recent Transactions
        </h3>
        {recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {recentExpenses.map((expense, index) => {
              const colorConfig = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Other']
              return (
                <div 
                  key={expense.id || index} 
                  className="flex items-center justify-between py-3 px-4 bg-[#0f0f0f] rounded-lg hover:bg-[#252525] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{colorConfig.icon}</span>
                    <div>
                      <p className="text-[#e0e0e0] font-medium">{expense.description || 'Untitled'}</p>
                      <p className="text-[#666] text-sm">{expense.category || 'Other'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#ff6b6b] font-semibold">-{formatCurrency(parseFloat(expense.amount || 0))}</p>
                    <p className="text-[#666] text-xs">{getRelativeTime(expense.date)}</p>
                  </div>
                </div>
              )
            })}
            <button className="w-full py-3 text-[#bb86fc] hover:text-[#a370e6] text-sm font-medium transition-all">
              View All →
            </button>
          </div>
        ) : (
          <p className="text-[#666] text-center py-8">No transactions yet. Start tracking!</p>
        )}
      </div>

      {/* Category Overview Section */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
          🎯 Category Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(stats.categoryBreakdown)
            .filter(([_, data]) => data.spent > 0 || data.budget > 0)
            .sort(([,a], [,b]) => (b.spent / b.budget) - (a.spent / a.budget))
            .slice(0, 6)
            .map(([category, data]) => {
              const percentage = Math.round((data.spent / data.budget) * 100)
              const status = getCategoryStatus(data.spent, data.budget)
              const remaining = data.budget - data.spent
              
              return (
                <div 
                  key={category}
                  className={`bg-[#0f0f0f] border border-[#333] rounded-xl p-4 cursor-pointer hover:border-[${data.color}] transition-all ${selectedCategory === category ? 'border-[#bb86fc]' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{data.icon}</span>
                      <span className="text-[#e0e0e0] font-medium uppercase text-sm">{category}</span>
                    </div>
                    <span className="text-lg">{status.icon}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#a0a0a0]">
                      {formatCurrency(data.spent)} / {formatCurrency(data.budget)}
                    </span>
                    <span className={`font-medium ${percentage >= 90 ? 'text-[#ff6b6b]' : percentage >= 75 ? 'text-[#FFD700]' : 'text-[#00ff88]'}`}>
                      {percentage}% used
                    </span>
                  </div>

                  <div className="h-2 bg-[#333] rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, percentage)}%`,
                        backgroundColor: percentage >= 90 ? '#ff6b6b' : percentage >= 75 ? '#FFD700' : '#00ff88'
                      }}
                    />
                  </div>
                  
                  <p className="text-[#666] text-xs">
                    {formatCurrency(Math.max(0, remaining))} left
                  </p>

                  {/* Expanded Category Details */}
                  {selectedCategory === category && (
                    <div className="mt-4 pt-4 border-t border-[#333] animate-fadeIn">
                      <h4 className="text-[#a0a0a0] text-sm mb-3">📊 Spending Pattern:</h4>
                      
                      {data.expenses.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[#666] text-xs mb-2">Recent Expenses:</p>
                          {data.expenses.slice(0, 3).map((exp, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-[#a0a0a0]">• {exp.description}</span>
                              <span className="text-[#ff6b6b]">-{formatCurrency(parseFloat(exp.amount))}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#666] text-sm">No expenses in this category yet.</p>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 py-2 text-xs bg-[#1a1a1a] text-[#bb86fc] rounded-lg hover:bg-[#252525] transition-all">
                          View All
                        </button>
                        <button className="flex-1 py-2 text-xs bg-[#1a1a1a] text-[#00ff88] rounded-lg hover:bg-[#252525] transition-all">
                          Adjust Budget
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
        <button className="w-full mt-4 py-3 text-[#bb86fc] hover:text-[#a370e6] text-sm font-medium transition-all">
          See All Categories →
        </button>
      </div>
      <WeeklyProgress
        data={{
          percent: Math.round(
            (stats.weeklySpent /
              (stats.monthlyBudget / 4)) *
            100
          ),
          remaining:
            stats.monthlyBudget / 4 -
            stats.weeklySpent,
          perDay:
            (stats.monthlyBudget / 4 -
              stats.weeklySpent) /
            7,
        }}
      />

      {/* Smart Alerts & Warnings Section */}
      <SmartAlerts 
        stats={stats} 
        expenses={expenses} 
        reminders={reminders} 
        categoryBreakdown={stats.categoryBreakdown}
        currency={currency}
      />

      {/* Overview Section */}
      <div className="bg-gradient-to-r from-[#bb86fc]/10 to-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#bb86fc] mb-4 flex items-center gap-2">
          📈 Monthly Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a]/80 rounded-lg p-4">
            <p className="text-[#666] text-sm mb-2">Budget Usage</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[#e0e0e0]">{stats.budgetUsedPercent}%</span>
              <span className="text-[#666] text-sm mb-1">of month budget used</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-[#bb86fc] rounded-full"
                style={{ width: `${Math.min(100, stats.budgetUsedPercent)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a]/80 rounded-lg p-4">
            <p className="text-[#666] text-sm mb-2">Month Progress</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[#e0e0e0]">{stats.monthProgress}%</span>
              <span className="text-[#666] text-sm mb-1">of month elapsed</span>
            </div>
            <div className="h-2 bg-[#333] rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-[#4ecdc4] rounded-full"
                style={{ width: `${stats.monthProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a]/80 rounded-lg p-4">
            <p className="text-[#666] text-sm mb-2">Status</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {stats.budgetUsedPercent <= stats.monthProgress ? '✅' : stats.budgetUsedPercent <= stats.monthProgress + 15 ? '⚠️' : '🚨'}
              </span>
              <span className="text-[#e0e0e0] font-medium">
                {stats.budgetUsedPercent <= stats.monthProgress 
                  ? 'Under Budget!' 
                  : stats.budgetUsedPercent <= stats.monthProgress + 15 
                    ? 'Slightly Over Pace' 
                    : 'Over Budget!'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
