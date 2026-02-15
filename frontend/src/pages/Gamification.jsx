import { useMemo, useState, useEffect } from 'react'
import { Trophy, Flame, Medal, Calendar, Target, Sparkles } from 'lucide-react'
import SavingsStreak from '../components/SavingsStreak'
import NoSpendCelebration from '../components/NoSpendCelebration'
import MonthlyChallenge from '../components/MonthlyChallenge'
import CategoryBadges from '../components/CategoryBadges'
import WeeklyProgress from '../components/WeeklyProgress'

// Category colors (matching Dashboard)
const CATEGORY_COLORS = {
  'Food': { icon: '🍔', color: '#ff6b6b' },
  'Transport': { icon: '🚗', color: '#4ecdc4' },
  'Shopping': { icon: '🛒', color: '#bb86fc' },
  'Entertainment': { icon: '🎬', color: '#FFD700' },
  'Bills': { icon: '📄', color: '#00ff88' },
  'Health': { icon: '💊', color: '#ff9f43' },
  'Other': { icon: '📦', color: '#a0a0a0' }
}

// Default budgets
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

function Gamification({ expenses = [], savings = [], reminders = [] }) {
  const [showNoSpendCelebration, setShowNoSpendCelebration] = useState(false)
  
  // Load profile and budgets from localStorage
  const [profile] = useState(() => loadFromStorage('budgetbuddy_profile', {
    name: 'User',
    currency: '₹'
  }))
  
  const [monthlyBudget] = useState(() => 
    loadFromStorage('budgetbuddy_monthlyBudget', 25000)
  )
  
  const [categoryBudgets] = useState(() => 
    loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_CATEGORY_BUDGETS)
  )

  const currency = profile.currency || '₹'

  // Check for no-spend day celebration
  useEffect(() => {
    const celebrationKey = 'budgetbuddy_lastNoSpendCelebration'
    const today = new Date().toDateString()
    const lastCelebration = localStorage.getItem(celebrationKey)
    
    // Check if yesterday was a no-spend day
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayStr = yesterday.toDateString()
    
    const hadExpensesYesterday = expenses.some(exp => {
      const expDate = new Date(exp.date)
      expDate.setHours(0, 0, 0, 0)
      return expDate.toDateString() === yesterdayStr
    })
    
    // Show celebration if yesterday was no-spend and we haven't shown it today
    if (!hadExpensesYesterday && lastCelebration !== today && expenses.length > 0) {
      setShowNoSpendCelebration(true)
      localStorage.setItem(celebrationKey, today)
    }
  }, [expenses])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Get this month's expenses
    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })

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

    // Days until month reset
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysUntilReset = lastDay - now.getDate()
    
    // Monthly total and remaining
    const monthlyTotal = thisMonthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const remaining = monthlyBudget - monthlyTotal
    const dailyAllowance = daysUntilReset > 0 ? remaining / daysUntilReset : 0

    return {
      monthlyBudget,
      categoryBreakdown,
      dailyAllowance
    }
  }, [expenses, monthlyBudget, categoryBudgets])

  // Calculate gamification stats
  const gamificationStats = useMemo(() => {
    // Count achievements
    const savingDates = new Set(savings.map(s => new Date(s.date).toDateString()))
    
    // Calculate streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let currentStreak = 0
    let checkDate = new Date(today)
    
    if (!savingDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    while (savingDates.has(checkDate.toDateString())) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Count badges
    const categories = Object.entries(stats.categoryBreakdown)
      .filter(([_, data]) => data.budget > 0)
      .map(([name, data]) => {
        const percentUsed = Math.round((data.spent / data.budget) * 100)
        let badge = null
        if (percentUsed <= 50) badge = 'gold'
        else if (percentUsed <= 80) badge = 'silver'
        else if (percentUsed <= 100) badge = 'bronze'
        return { name, percentUsed, badge }
      })

    const goldCount = categories.filter(c => c.badge === 'gold').length
    const silverCount = categories.filter(c => c.badge === 'silver').length
    const bronzeCount = categories.filter(c => c.badge === 'bronze').length
    
    // Monthly challenge progress
    const underBudgetCount = categories.filter(c => c.percentUsed <= 100).length
    const totalCategories = categories.length
    const challengeComplete = underBudgetCount === totalCategories && totalCategories > 0

    // No-spend days this month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const expenseDates = new Set(
      expenses
        .filter(exp => {
          const d = new Date(exp.date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .map(exp => new Date(exp.date).getDate())
    )
    const noSpendDaysCount = now.getDate() - expenseDates.size

    return {
      currentStreak,
      goldCount,
      silverCount,
      bronzeCount,
      totalBadges: goldCount + silverCount + bronzeCount,
      challengeComplete,
      challengeProgress: totalCategories > 0 ? Math.round((underBudgetCount / totalCategories) * 100) : 0,
      noSpendDaysCount
    }
  }, [savings, expenses, stats.categoryBreakdown])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e0e0e0] flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Trophy className="text-[#FFD700]" size={32} />
            Achievements & Challenges
          </h1>
          <p className="text-[#a0a0a0] mt-2">Track your progress and earn rewards for smart spending!</p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#ff6b6b]/20 to-[#1a1a1a] border border-[#ff6b6b]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-[#ff6b6b]" size={20} />
            <span className="text-[#a0a0a0] text-sm">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-[#ff6b6b]">{gamificationStats.currentStreak}</p>
          <p className="text-[#666] text-xs">days saving</p>
        </div>

        <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#1a1a1a] border border-[#FFD700]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Medal className="text-[#FFD700]" size={20} />
            <span className="text-[#a0a0a0] text-sm">Badges Earned</span>
          </div>
          <p className="text-3xl font-bold text-[#FFD700]">{gamificationStats.totalBadges}</p>
          <p className="text-[#666] text-xs">this month</p>
        </div>

        <div className="bg-gradient-to-br from-[#00ff88]/20 to-[#1a1a1a] border border-[#00ff88]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-[#00ff88]" size={20} />
            <span className="text-[#a0a0a0] text-sm">No-Spend Days</span>
          </div>
          <p className="text-3xl font-bold text-[#00ff88]">{gamificationStats.noSpendDaysCount}</p>
          <p className="text-[#666] text-xs">this month</p>
        </div>

        <div className="bg-gradient-to-br from-[#bb86fc]/20 to-[#1a1a1a] border border-[#bb86fc]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-[#bb86fc]" size={20} />
            <span className="text-[#a0a0a0] text-sm">Challenge</span>
          </div>
          <p className="text-3xl font-bold text-[#bb86fc]">{gamificationStats.challengeProgress}%</p>
          <p className="text-[#666] text-xs">{gamificationStats.challengeComplete ? '✅ Complete!' : 'in progress'}</p>
        </div>
      </div>

      {/* Main Gamification Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Streak */}
        <SavingsStreak savings={savings} />
        
        {/* Weekly Progress */}
        <WeeklyProgress 
          expenses={expenses}
          monthlyBudget={stats.monthlyBudget}
          currency={currency}
        />
      </div>

      {/* Monthly Challenge */}
      <MonthlyChallenge 
        categoryBreakdown={stats.categoryBreakdown}
        currency={currency}
      />

      {/* Category Champion Badges */}
      <CategoryBadges 
        categoryBreakdown={stats.categoryBreakdown}
        currency={currency}
      />

      {/* Achievements Section */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-bold text-[#e0e0e0] mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Sparkles className="text-[#FFD700]" size={24} />
          All Achievements
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Streak Achievements */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.currentStreak >= 3 
              ? 'bg-[#00ff88]/10 border-[#00ff88]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🌱</span>
            <p className="font-medium mt-2">Getting Started</p>
            <p className="text-[#666] text-xs">3-day streak</p>
          </div>

          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.currentStreak >= 7 
              ? 'bg-[#00ff88]/10 border-[#00ff88]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🥷</span>
            <p className="font-medium mt-2">Thrifty Ninja</p>
            <p className="text-[#666] text-xs">7-day streak</p>
          </div>

          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.currentStreak >= 14 
              ? 'bg-[#00ff88]/10 border-[#00ff88]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">💎</span>
            <p className="font-medium mt-2">Savings Master</p>
            <p className="text-[#666] text-xs">14-day streak</p>
          </div>

          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.currentStreak >= 30 
              ? 'bg-[#00ff88]/10 border-[#00ff88]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">👑</span>
            <p className="font-medium mt-2">Budget Legend</p>
            <p className="text-[#666] text-xs">30-day streak</p>
          </div>

          {/* Badge Achievements */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.goldCount >= 1 
              ? 'bg-[#FFD700]/10 border-[#FFD700]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🥇</span>
            <p className="font-medium mt-2">Gold Collector</p>
            <p className="text-[#666] text-xs">Earn a gold badge</p>
          </div>

          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.goldCount >= 3 
              ? 'bg-[#FFD700]/10 border-[#FFD700]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🏅</span>
            <p className="font-medium mt-2">Triple Gold</p>
            <p className="text-[#666] text-xs">3 gold badges</p>
          </div>

          {/* Challenge Achievements */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.challengeComplete 
              ? 'bg-[#bb86fc]/10 border-[#bb86fc]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🏆</span>
            <p className="font-medium mt-2">Budget Master</p>
            <p className="text-[#666] text-xs">Complete monthly challenge</p>
          </div>

          {/* No-Spend Achievement */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            gamificationStats.noSpendDaysCount >= 5 
              ? 'bg-[#4ecdc4]/10 border-[#4ecdc4]/50' 
              : 'bg-[#0f0f0f] border-[#333] opacity-50'
          }`}>
            <span className="text-4xl">🧘</span>
            <p className="font-medium mt-2">Zen Saver</p>
            <p className="text-[#666] text-xs">5 no-spend days</p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-[#bb86fc]/10 to-[#1a1a1a] border border-[#bb86fc]/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#bb86fc] mb-4 flex items-center gap-2">
          💡 Tips to Level Up
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f0f0f] rounded-lg p-4">
            <p className="text-[#e0e0e0] font-medium mb-2">🔥 Build Your Streak</p>
            <p className="text-[#666] text-sm">Log at least one saving every day to keep your streak alive!</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4">
            <p className="text-[#e0e0e0] font-medium mb-2">🥇 Earn Gold Badges</p>
            <p className="text-[#666] text-sm">Keep category spending under 50% of budget for gold!</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4">
            <p className="text-[#e0e0e0] font-medium mb-2">🧘 No-Spend Days</p>
            <p className="text-[#666] text-sm">Try to have at least one no-spend day per week!</p>
          </div>
          <div className="bg-[#0f0f0f] rounded-lg p-4">
            <p className="text-[#e0e0e0] font-medium mb-2">🏆 Monthly Challenge</p>
            <p className="text-[#666] text-sm">Keep ALL categories under 100% to become Budget Master!</p>
          </div>
        </div>
      </div>

      {/* No-Spend Day Celebration Modal */}
      <NoSpendCelebration 
        show={showNoSpendCelebration}
        onClose={() => setShowNoSpendCelebration(false)}
        dailyAllowance={Math.round(stats.dailyAllowance)}
        currency={currency}
        healthScoreBonus={10}
      />
    </div>
  )
}

export default Gamification
