import { useMemo, useState, useEffect } from 'react'
import WeeklyPulse from "../components/analytics/WeeklyPulse";
import MonthlyTrends from "../components/analytics/MonthlyTrends";
import CategoryDeepDive from "../components/analytics/CategoryDeepDive";


// Category icons and colors (budgets come from localStorage)
const CATEGORY_CONFIG = {
  'Food': { icon: '🍔', color: '#ff6b6b' },
  'Transport': { icon: '🚗', color: '#4ecdc4' },
  'Shopping': { icon: '🛒', color: '#bb86fc' },
  'Entertainment': { icon: '🎬', color: '#FFD700' },
  'Bills': { icon: '📄', color: '#00ff88' },
  'Health': { icon: '💊', color: '#ff9f43' },
  'Other': { icon: '📦', color: '#a0a0a0' }
}

const DEFAULT_CATEGORY_BUDGETS = {
  Food: 6000,
  Transport: 3000,
  Shopping: 4000,
  Entertainment: 2000,
  Bills: 5000,
  Health: 2000,
  Other: 3000
}

function Analytics({ expenses, savings }) {
  const [activeTab, setActiveTab] = useState('spending')
  
  // Load settings from localStorage
  const [monthlyBudget, setMonthlyBudget] = useState(25000)
  const [categoryBudgets, setCategoryBudgets] = useState(DEFAULT_CATEGORY_BUDGETS)
  const [currency, setCurrency] = useState('₹')

  useEffect(() => {
    const loadFromStorage = (key, defaultValue) => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : defaultValue
      } catch {
        return defaultValue
      }
    }

    const budget = loadFromStorage('budgetbuddy_monthlyBudget', 25000)
    const catBudgets = loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS)
    const profile = loadFromStorage('budgetbuddy_profile', { currency: '₹' })
    
    setMonthlyBudget(budget)
    setCategoryBudgets(catBudgets)
    setCurrency(profile.currency || '₹')

    // Listen for updates
    const handleFocus = () => {
      setMonthlyBudget(loadFromStorage('budgetbuddy_monthlyBudget', 25000))
      setCategoryBudgets(loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS))
      const prof = loadFromStorage('budgetbuddy_profile', { currency: '₹' })
      setCurrency(prof.currency || '₹')
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleFocus)
    }
  }, [])

  // Format currency based on symbol
  const formatCurrency = (amount) => {
    const num = Math.round(amount)
    if (currency === '₹') return `₹${num.toLocaleString('en-IN')}`
    if (currency === '$') return `$${num.toLocaleString('en-US')}`
    if (currency === '€') return `€${num.toLocaleString('de-DE')}`
    if (currency === '£') return `£${num.toLocaleString('en-GB')}`
    return `${currency}${num.toLocaleString()}`
  }

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })
    const monthlyTotal = thisMonthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const remaining = monthlyBudget - monthlyTotal
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysUntilReset = lastDay - now.getDate()
    const dailyAllowance = daysUntilReset > 0 ? remaining / daysUntilReset : 0
    const monthProgress = Math.round((now.getDate() / lastDay) * 100)
    const budgetUsedPercent = Math.round((monthlyTotal / monthlyBudget) * 100)

    // Category breakdown
    const categoryBreakdown = {}
    thisMonthExpenses.forEach(exp => {
      const category = exp.category || 'Other'
      if (!categoryBreakdown[category]) {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other']
        categoryBreakdown[category] = {
          spent: 0,
          budget: categoryBudgets[category] || 3000,
          icon: config.icon,
          color: config.color,
          expenses: []
        }
      }
      categoryBreakdown[category].spent += parseFloat(exp.amount) || 0
      categoryBreakdown[category].expenses.push(exp)
    })

    return {
      monthlyBudget,
      monthlyTotal,
      remaining,
      dailyAllowance,
      monthProgress,
      budgetUsedPercent,
      categoryBreakdown,
      thisMonthExpenses
    }
  }, [expenses, monthlyBudget, categoryBudgets])

  const analytics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthExpenses = stats.thisMonthExpenses

    // Weekly breakdown
    const weeklyData = [
      { week: 'Week 1', spent: 0 },
      { week: 'Week 2', spent: 0 },
      { week: 'Week 3', spent: 0 },
      { week: 'Week 4', spent: 0 },
    ]

    thisMonthExpenses.forEach(exp => {
      const expDate = new Date(exp.date)
      const dayOfMonth = expDate.getDate()
      const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7))
      weeklyData[weekIndex].spent += parseFloat(exp.amount) || 0
    })

    // Daily average
    const daysElapsed = now.getDate()
    const dailyAverage = stats.monthlyTotal / daysElapsed

    // Highest spending day
    const dailySpending = {}
    thisMonthExpenses.forEach(exp => {
      const dateKey = new Date(exp.date).toDateString()
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + parseFloat(exp.amount)
    })
    
    const highestDay = Object.entries(dailySpending).sort(([,a], [,b]) => b - a)[0]
    const lowestDay = Object.entries(dailySpending).filter(([,v]) => v > 0).sort(([,a], [,b]) => a - b)[0]

    // Spending by day of week
    const dayOfWeekSpending = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    thisMonthExpenses.forEach(exp => {
      const dayName = dayNames[new Date(exp.date).getDay()]
      dayOfWeekSpending[dayName] += parseFloat(exp.amount) || 0
    })

    const highestSpendingDay = Object.entries(dayOfWeekSpending).sort(([,a], [,b]) => b - a)[0]
    const lowestSpendingDay = Object.entries(dayOfWeekSpending).filter(([,v]) => v > 0).sort(([,a], [,b]) => a - b)[0]

    // Top spending categories
    const topCategories = Object.entries(stats.categoryBreakdown)
      .filter(([_, data]) => data.spent > 0)
      .sort(([,a], [,b]) => b.spent - a.spent)
      .slice(0, 5)

    // Transaction frequency
    const transactionCount = thisMonthExpenses.length
    const avgTransactionsPerDay = transactionCount / daysElapsed
    const avgTransactionAmount = transactionCount > 0 ? stats.monthlyTotal / transactionCount : 0

    // Savings rate
    const totalSaved = savings.reduce((sum, sav) => sum + parseFloat(sav.amount), 0)
    const savingsRate = stats.monthlyBudget > 0 ? (totalSaved / stats.monthlyBudget) * 100 : 0

    // Budget efficiency
    const budgetEfficiency = stats.monthlyBudget > 0 
      ? Math.max(0, 100 - ((stats.monthlyTotal / stats.monthlyBudget) * 100))
      : 0

    // Predicted end of month spending
    const predictedTotal = dailyAverage * new Date(currentYear, currentMonth + 1, 0).getDate()
    const predictedOverUnder = predictedTotal - stats.monthlyBudget

    return {
      weeklyData,
      dailyAverage,
      highestDay,
      lowestDay,
      dayOfWeekSpending,
      highestSpendingDay,
      lowestSpendingDay,
      topCategories,
      transactionCount,
      avgTransactionsPerDay,
      avgTransactionAmount,
      totalSaved,
      savingsRate,
      budgetEfficiency,
      predictedTotal,
      predictedOverUnder,
      daysElapsed
    }
  }, [expenses, savings, stats])

  // Generate insights
  const insights = useMemo(() => {
    const insightsList = []

    // Spending pattern insight
    if (analytics.highestSpendingDay) {
      insightsList.push({
        icon: '📊',
        title: 'Peak Spending Day',
        description: `You spend the most on ${analytics.highestSpendingDay[0]}s (${formatCurrency(analytics.highestSpendingDay[1])} this month). Consider planning no-spend ${analytics.highestSpendingDay[0]}s.`,
        type: 'pattern'
      })
    }

    // Budget prediction insight
    if (analytics.predictedOverUnder > 0) {
      insightsList.push({
        icon: '🔮',
        title: 'Month-End Prediction',
        description: `At current pace, you'll exceed your budget by ${formatCurrency(analytics.predictedOverUnder)}. Reduce daily spending to ${formatCurrency(stats.dailyAllowance)} to stay on track.`,
        type: 'warning'
      })
    } else {
      insightsList.push({
        icon: '🎯',
        title: 'On Track to Save',
        description: `Great news! At current pace, you'll finish ${formatCurrency(Math.abs(analytics.predictedOverUnder))} under budget.`,
        type: 'success'
      })
    }

    // Transaction frequency insight
    insightsList.push({
      icon: '💳',
      title: 'Transaction Pattern',
      description: `You make ~${analytics.avgTransactionsPerDay.toFixed(1)} transactions/day with an average of ${formatCurrency(analytics.avgTransactionAmount)} per transaction.`,
      type: 'info'
    })

    // Category insight
    if (analytics.topCategories.length > 0) {
      const [topCat, topData] = analytics.topCategories[0]
      const percentage = Math.round((topData.spent / stats.monthlyTotal) * 100)
      insightsList.push({
        icon: topData.icon,
        title: 'Top Spending Category',
        description: `${topCat} accounts for ${percentage}% of your spending (${formatCurrency(topData.spent)}). ${percentage > 40 ? 'This is quite high!' : 'This seems reasonable.'}`,
        type: percentage > 40 ? 'warning' : 'info'
      })
    }

    // Savings insight
    if (analytics.savingsRate > 0) {
      insightsList.push({
        icon: '💰',
        title: 'Savings Progress',
        description: `You've saved ${formatCurrency(analytics.totalSaved)} (${analytics.savingsRate.toFixed(0)}% of your budget). ${analytics.savingsRate >= 20 ? 'Excellent discipline!' : 'Try to save at least 20% of income.'}`,
        type: analytics.savingsRate >= 20 ? 'success' : 'info'
      })
    }

    // Weekly trend insight
    const weeklyTrend = analytics.weeklyData.filter(w => w.spent > 0)
    if (weeklyTrend.length >= 2) {
      const lastWeek = weeklyTrend[weeklyTrend.length - 1]
      const prevWeek = weeklyTrend[weeklyTrend.length - 2]
      const change = ((lastWeek.spent - prevWeek.spent) / prevWeek.spent) * 100

      if (Math.abs(change) > 10) {
        insightsList.push({
          icon: change > 0 ? '📈' : '📉',
          title: 'Weekly Trend',
          description: `Your spending ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(0)}% compared to last week. ${change > 0 ? 'Watch out!' : 'Great improvement!'}`,
          type: change > 0 ? 'warning' : 'success'
        })
      }
    }

    return insightsList
  }, [analytics, stats])

  const tabs = [
    { id: 'spending', label: '📊 Spending Analysis', color: '#bb86fc' },
    { id: 'trends', label: '📈 Trends & Patterns', color: '#4ecdc4' },
    { id: 'insights', label: '💡 Smart Insights', color: '#FFD700' },
    { id: 'comparison', label: '📉 Comparison', color: '#ff6b6b' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#bb86fc]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📈 Analytics & Insights
        </h2>
        <div className="text-[#666] text-sm">
          Analyzing {analytics.transactionCount} transactions
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 hover:border-[#bb86fc] transition-all">
          <p className="text-[#666] text-xs mb-1">Monthly Spending</p>
          <p className="text-2xl font-bold text-[#ff6b6b]">{formatCurrency(stats.monthlyTotal)}</p>
          <p className="text-[#666] text-xs mt-1">{stats.budgetUsedPercent}% of budget</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 hover:border-[#4ecdc4] transition-all">
          <p className="text-[#666] text-xs mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-[#4ecdc4]">{formatCurrency(analytics.dailyAverage)}</p>
          <p className="text-[#666] text-xs mt-1">per day this month</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 hover:border-[#FFD700] transition-all">
          <p className="text-[#666] text-xs mb-1">Predicted Month-End</p>
          <p className={`text-2xl font-bold ${analytics.predictedOverUnder > 0 ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
            {formatCurrency(analytics.predictedTotal)}
          </p>
          <p className="text-[#666] text-xs mt-1">
            {analytics.predictedOverUnder > 0 ? `${formatCurrency(analytics.predictedOverUnder)} over` : `${formatCurrency(Math.abs(analytics.predictedOverUnder))} under`}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 hover:border-[#00ff88] transition-all">
          <p className="text-[#666] text-xs mb-1">Budget Efficiency</p>
          <p className="text-2xl font-bold text-[#00ff88]">{Math.round(analytics.budgetEfficiency)}%</p>
          <p className="text-[#666] text-xs mt-1">savings potential</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-[#a0a0a0] hover:text-white bg-[#0f0f0f]'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? tab.color : undefined,
                boxShadow: activeTab === tab.id ? `0 0 15px ${tab.color}40` : undefined
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Spending Tab */}
        {activeTab === 'spending' && (
          <div className="space-y-6 animate-fadeIn">
            <WeeklyPulse />
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <p className="text-[#666] text-xs mb-1">Transactions</p>
                <p className="text-xl font-bold text-[#bb86fc]">{analytics.transactionCount}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <p className="text-[#666] text-xs mb-1">Avg per Transaction</p>
                <p className="text-xl font-bold text-[#4ecdc4]">{formatCurrency(analytics.avgTransactionAmount)}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <p className="text-[#666] text-xs mb-1">Per Day</p>
                <p className="text-xl font-bold text-[#FFD700]">{analytics.avgTransactionsPerDay.toFixed(1)} txns</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <p className="text-[#666] text-xs mb-1">Days Tracked</p>
                <p className="text-xl font-bold text-[#00ff88]">{analytics.daysElapsed}</p>
              </div>
            </div>

            {/* Weekly Breakdown */}
            <div>
              <h4 className="text-[#a0a0a0] text-sm mb-3 font-medium">📅 Weekly Breakdown</h4>
              <div className="space-y-3">
                {analytics.weeklyData.map((week, index) => {
                  const maxSpent = Math.max(...analytics.weeklyData.map(w => w.spent))
                  const percentage = maxSpent > 0 ? (week.spent / maxSpent) * 100 : 0
                  const isCurrentWeek = Math.floor((new Date().getDate() - 1) / 7) === index
                  
                  return (
                    <div key={week.week} className="flex items-center gap-3">
                      <span className={`text-sm w-16 ${isCurrentWeek ? 'text-[#bb86fc] font-medium' : 'text-[#666]'}`}>
                        {week.week}
                      </span>
                      <div className="flex-1 h-8 bg-[#0f0f0f] rounded-lg overflow-hidden">
                        <div 
                          className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ 
                            width: `${Math.max(percentage, 5)}%`,
                            backgroundColor: isCurrentWeek ? '#bb86fc' : '#4ecdc4'
                          }}
                        >
                          {week.spent > 0 && (
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(week.spent)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Categories */}
            <div>
              <h4 className="text-[#a0a0a0] text-sm mb-3 font-medium">🏆 Top Spending Categories</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.topCategories.map(([category, data], index) => {
                  const percentage = stats.monthlyTotal > 0 ? (data.spent / stats.monthlyTotal) * 100 : 0
                  const budgetPercent = (data.spent / data.budget) * 100
                  return (
                    <div key={category} className="bg-[#0f0f0f] rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{data.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-[#e0e0e0] font-medium">{category}</span>
                            <span className="text-[#a0a0a0] text-sm">{Math.round(percentage)}% of total</span>
                          </div>
                          <p className="text-[#bb86fc] font-bold text-lg">{formatCurrency(data.spent)}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#666]">Budget Usage</span>
                          <span className={budgetPercent >= 90 ? 'text-[#ff6b6b]' : budgetPercent >= 75 ? 'text-[#FFD700]' : 'text-[#00ff88]'}>
                            {Math.round(budgetPercent)}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${Math.min(100, budgetPercent)}%`,
                              backgroundColor: budgetPercent >= 90 ? '#ff6b6b' : budgetPercent >= 75 ? '#FFD700' : '#00ff88'
                            }}
                          />
                        </div>
                        <p className="text-[#666] text-xs">{formatCurrency(data.spent)} / {formatCurrency(data.budget)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6 animate-fadeIn">
            <MonthlyTrends />
            {/* Spending by Day of Week */}
            <div>
              <h4 className="text-[#a0a0a0] text-sm mb-3 font-medium">📆 Spending by Day of Week</h4>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(analytics.dayOfWeekSpending).map(([day, amount]) => {
                  const maxAmount = Math.max(...Object.values(analytics.dayOfWeekSpending))
                  const heightPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                  const isHighest = analytics.highestSpendingDay && day === analytics.highestSpendingDay[0]
                  
                  return (
                    <div key={day} className="flex flex-col items-center">
                      <div className="h-32 w-full bg-[#0f0f0f] rounded-lg flex flex-col justify-end overflow-hidden">
                        <div 
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{ 
                            height: `${heightPercent}%`,
                            backgroundColor: isHighest ? '#ff6b6b' : '#4ecdc4',
                            minHeight: amount > 0 ? '10px' : '0'
                          }}
                        />
                      </div>
                      <span className={`text-xs mt-2 ${isHighest ? 'text-[#ff6b6b] font-medium' : 'text-[#666]'}`}>
                        {day.slice(0, 3)}
                      </span>
                      <span className="text-xs text-[#a0a0a0]">{currency}{(amount / 1000).toFixed(1)}k</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Prediction Card */}
            <div className={`rounded-xl p-5 ${analytics.predictedOverUnder > 0 ? 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30' : 'bg-[#00ff88]/10 border border-[#00ff88]/30'}`}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">🔮</span>
                <div>
                  <h4 className="text-[#e0e0e0] font-semibold text-lg">Month-End Prediction</h4>
                  <p className="text-[#666] text-sm">Based on your current spending pattern</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0f0f0f]/50 rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">Current Total</p>
                  <p className="text-xl font-bold text-[#e0e0e0]">{formatCurrency(stats.monthlyTotal)}</p>
                </div>
                <div className="bg-[#0f0f0f]/50 rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">Predicted Total</p>
                  <p className={`text-xl font-bold ${analytics.predictedOverUnder > 0 ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
                    {formatCurrency(analytics.predictedTotal)}
                  </p>
                </div>
                <div className="bg-[#0f0f0f]/50 rounded-lg p-3">
                  <p className="text-[#666] text-xs mb-1">{analytics.predictedOverUnder > 0 ? 'Over Budget' : 'Under Budget'}</p>
                  <p className={`text-xl font-bold ${analytics.predictedOverUnder > 0 ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
                    {formatCurrency(Math.abs(analytics.predictedOverUnder))}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {analytics.highestDay && (
                <div className="bg-[#0f0f0f] rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔴</span>
                    <span className="text-[#a0a0a0] text-sm font-medium">Highest Spend Day</span>
                  </div>
                  <p className="text-[#ff6b6b] font-bold text-2xl mb-1">{formatCurrency(analytics.highestDay[1])}</p>
                  <p className="text-[#666] text-sm">{new Date(analytics.highestDay[0]).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
              )}
              {analytics.lowestDay && (
                <div className="bg-[#0f0f0f] rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🟢</span>
                    <span className="text-[#a0a0a0] text-sm font-medium">Lowest Spend Day</span>
                  </div>
                  <p className="text-[#00ff88] font-bold text-2xl mb-1">{formatCurrency(analytics.lowestDay[1])}</p>
                  <p className="text-[#666] text-sm">{new Date(analytics.lowestDay[0]).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`bg-[#0f0f0f] rounded-xl p-5 border-l-4 ${
                    insight.type === 'warning' ? 'border-[#FFD700]' :
                    insight.type === 'success' ? 'border-[#00ff88]' :
                    'border-[#bb86fc]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{insight.icon}</span>
                    <div>
                      <h4 className="text-[#e0e0e0] font-semibold mb-2">{insight.title}</h4>
                      <p className="text-[#a0a0a0] text-sm leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-[#bb86fc]/10 to-transparent rounded-xl p-5 mt-6">
              <h4 className="text-[#bb86fc] font-semibold mb-4 flex items-center gap-2 text-lg">
                💡 Quick Tips to Improve Your Finances
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-[#0f0f0f]/50 rounded-lg p-3">
                  <span className="text-[#00ff88] text-lg">✓</span>
                  <span className="text-[#a0a0a0] text-sm">Try 2 no-spend days per week to boost savings</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f0f]/50 rounded-lg p-3">
                  <span className="text-[#00ff88] text-lg">✓</span>
                  <span className="text-[#a0a0a0] text-sm">Set category-wise daily limits for better control</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f0f]/50 rounded-lg p-3">
                  <span className="text-[#00ff88] text-lg">✓</span>
                  <span className="text-[#a0a0a0] text-sm">Review transactions every evening to stay aware</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0f0f0f]/50 rounded-lg p-3">
                  <span className="text-[#00ff88] text-lg">✓</span>
                  <span className="text-[#a0a0a0] text-sm">Use the 24-hour rule for purchases over ₹500</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Budget vs Actual */}
            <div>
              <h4 className="text-[#a0a0a0] text-sm mb-3 font-medium">💰 Budget vs Actual Spending</h4>
              <div className="space-y-4">
                {Object.entries(stats.categoryBreakdown)
                  .filter(([_, data]) => data.spent > 0)
                  .sort(([,a], [,b]) => b.spent - a.spent)
                  .map(([category, data]) => {
                    const budgetPercent = (data.spent / data.budget) * 100
                    const isOver = budgetPercent > 100
                    
                    return (
                      <div key={category} className="bg-[#0f0f0f] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{data.icon}</span>
                            <span className="text-[#e0e0e0] font-medium">{category}</span>
                          </div>
                          <span className={`text-sm font-medium ${isOver ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
                            {isOver ? `₹${Math.round(data.spent - data.budget).toLocaleString('en-IN')} over` : `₹${Math.round(data.budget - data.spent).toLocaleString('en-IN')} left`}
                          </span>
                        </div>
                        <div className="relative h-8 bg-[#333] rounded-lg overflow-hidden">
                          {/* Budget line */}
                          <div className="absolute h-full w-full flex items-center">
                            <div 
                              className="h-full opacity-30"
                              style={{ 
                                width: '100%',
                                backgroundColor: '#666'
                              }}
                            />
                          </div>
                          {/* Actual spending */}
                          <div 
                            className="absolute h-full rounded-lg flex items-center justify-end pr-2"
                            style={{ 
                              width: `${Math.min(100, budgetPercent)}%`,
                              backgroundColor: isOver ? '#ff6b6b' : budgetPercent >= 75 ? '#FFD700' : '#00ff88'
                            }}
                          >
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(data.spent)}
                            </span>
                          </div>
                          {/* Budget marker */}
                          <div 
                            className="absolute h-full w-0.5 bg-white/50"
                            style={{ left: '100%', transform: 'translateX(-100%)' }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-[#666]">
                          <span>{currency}0</span>
                          <span>Budget: {formatCurrency(data.budget)}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
                <p className="text-[#666] text-xs mb-1">Categories On Track</p>
                <p className="text-2xl font-bold text-[#00ff88]">
                  {Object.values(stats.categoryBreakdown).filter(d => (d.spent / d.budget) <= 1).length}
                </p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
                <p className="text-[#666] text-xs mb-1">Categories Over Budget</p>
                <p className="text-2xl font-bold text-[#ff6b6b]">
                  {Object.values(stats.categoryBreakdown).filter(d => (d.spent / d.budget) > 1).length}
                </p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
                <p className="text-[#666] text-xs mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-[#bb86fc]">{formatCurrency(stats.monthlyBudget)}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 text-center">
                <p className="text-[#666] text-xs mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${stats.remaining >= 0 ? 'text-[#00ff88]' : 'text-[#ff6b6b]'}`}>
                  {formatCurrency(Math.abs(stats.remaining))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
