import { useMemo, useState } from 'react'

function AnalyticsInsights({ expenses, savings, stats, categoryBreakdown, currency = '₹' }) {
  const [activeTab, setActiveTab] = useState('spending')

  // Format currency based on symbol
  const formatCurrency = (amount) => {
    const num = Math.round(amount)
    if (currency === '₹') return `₹${num.toLocaleString('en-IN')}`
    if (currency === '$') return `$${num.toLocaleString('en-US')}`
    if (currency === '€') return `€${num.toLocaleString('de-DE')}`
    if (currency === '£') return `£${num.toLocaleString('en-GB')}`
    return `${currency}${num.toLocaleString()}`
  }

  const analytics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get this month's expenses
    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })

    // Weekly breakdown
    const weeklyData = [
      { week: 'Week 1', spent: 0, days: [] },
      { week: 'Week 2', spent: 0, days: [] },
      { week: 'Week 3', spent: 0, days: [] },
      { week: 'Week 4', spent: 0, days: [] },
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
    const topCategories = Object.entries(categoryBreakdown)
      .filter(([_, data]) => data.spent > 0)
      .sort(([,a], [,b]) => b.spent - a.spent)
      .slice(0, 5)

    // Spending velocity (are we speeding up or slowing down?)
    const firstHalfExpenses = thisMonthExpenses.filter(exp => new Date(exp.date).getDate() <= 15)
    const secondHalfExpenses = thisMonthExpenses.filter(exp => new Date(exp.date).getDate() > 15)
    const firstHalfTotal = firstHalfExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    const secondHalfTotal = secondHalfExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

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
      firstHalfTotal,
      secondHalfTotal,
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
  }, [expenses, savings, stats, categoryBreakdown])

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
    { id: 'spending', label: '📊 Spending', color: '#bb86fc' },
    { id: 'trends', label: '📈 Trends', color: '#4ecdc4' },
    { id: 'insights', label: '💡 Insights', color: '#FFD700' },
  ]

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
      <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
        📈 Analytics & Insights
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0f0f0f] rounded-lg p-4">
              <p className="text-[#666] text-xs mb-1">Daily Average</p>
              <p className="text-xl font-bold text-[#bb86fc]">{formatCurrency(analytics.dailyAverage)}</p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4">
              <p className="text-[#666] text-xs mb-1">Transactions</p>
              <p className="text-xl font-bold text-[#4ecdc4]">{analytics.transactionCount}</p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4">
              <p className="text-[#666] text-xs mb-1">Avg per Transaction</p>
              <p className="text-xl font-bold text-[#FFD700]">{formatCurrency(analytics.avgTransactionAmount)}</p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4">
              <p className="text-[#666] text-xs mb-1">Budget Efficiency</p>
              <p className="text-xl font-bold text-[#00ff88]">{Math.round(analytics.budgetEfficiency)}%</p>
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div>
            <h4 className="text-[#a0a0a0] text-sm mb-3">Weekly Breakdown</h4>
            <div className="space-y-2">
              {analytics.weeklyData.map((week, index) => {
                const maxSpent = Math.max(...analytics.weeklyData.map(w => w.spent))
                const percentage = maxSpent > 0 ? (week.spent / maxSpent) * 100 : 0
                const isCurrentWeek = Math.floor((new Date().getDate() - 1) / 7) === index
                
                return (
                  <div key={week.week} className="flex items-center gap-3">
                    <span className={`text-sm w-16 ${isCurrentWeek ? 'text-[#bb86fc] font-medium' : 'text-[#666]'}`}>
                      {week.week}
                    </span>
                    <div className="flex-1 h-6 bg-[#0f0f0f] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: isCurrentWeek ? '#bb86fc' : '#4ecdc4'
                        }}
                      />
                    </div>
                    <span className={`text-sm w-20 text-right ${isCurrentWeek ? 'text-[#bb86fc]' : 'text-[#a0a0a0]'}`}>
                      {formatCurrency(week.spent)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="text-[#a0a0a0] text-sm mb-3">Top Spending Categories</h4>
            <div className="space-y-2">
              {analytics.topCategories.map(([category, data], index) => {
                const percentage = stats.monthlyTotal > 0 ? (data.spent / stats.monthlyTotal) * 100 : 0
                return (
                  <div key={category} className="flex items-center gap-3 bg-[#0f0f0f] rounded-lg p-3">
                    <span className="text-2xl">{data.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#e0e0e0] text-sm font-medium">{category}</span>
                        <span className="text-[#a0a0a0] text-sm">{formatCurrency(data.spent)}</span>
                      </div>
                      <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: data.color
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[#666] text-xs w-10 text-right">{Math.round(percentage)}%</span>
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
          {/* Spending by Day of Week */}
          <div>
            <h4 className="text-[#a0a0a0] text-sm mb-3">Spending by Day of Week</h4>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(analytics.dayOfWeekSpending).map(([day, amount]) => {
                const maxAmount = Math.max(...Object.values(analytics.dayOfWeekSpending))
                const heightPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                const isHighest = analytics.highestSpendingDay && day === analytics.highestSpendingDay[0]
                
                return (
                  <div key={day} className="flex flex-col items-center">
                    <div className="h-24 w-full bg-[#0f0f0f] rounded-lg flex flex-col justify-end overflow-hidden">
                      <div 
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{ 
                          height: `${heightPercent}%`,
                          backgroundColor: isHighest ? '#ff6b6b' : '#4ecdc4',
                          minHeight: amount > 0 ? '8px' : '0'
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
          <div className={`rounded-xl p-4 ${analytics.predictedOverUnder > 0 ? 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30' : 'bg-[#00ff88]/10 border border-[#00ff88]/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔮</span>
              <div>
                <h4 className="text-[#e0e0e0] font-semibold">Month-End Prediction</h4>
                <p className="text-[#666] text-sm">Based on your current spending pattern</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#666] text-xs mb-1">Predicted Total</p>
                <p className={`text-2xl font-bold ${analytics.predictedOverUnder > 0 ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
                  {formatCurrency(analytics.predictedTotal)}
                </p>
              </div>
              <div>
                <p className="text-[#666] text-xs mb-1">{analytics.predictedOverUnder > 0 ? 'Over Budget By' : 'Under Budget By'}</p>
                <p className={`text-2xl font-bold ${analytics.predictedOverUnder > 0 ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}`}>
                  {formatCurrency(Math.abs(analytics.predictedOverUnder))}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {analytics.highestDay && (
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔴</span>
                  <span className="text-[#666] text-sm">Highest Spend Day</span>
                </div>
                <p className="text-[#ff6b6b] font-bold text-lg">{formatCurrency(analytics.highestDay[1])}</p>
                <p className="text-[#666] text-xs">{new Date(analytics.highestDay[0]).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            {analytics.lowestDay && (
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🟢</span>
                  <span className="text-[#666] text-sm">Lowest Spend Day</span>
                </div>
                <p className="text-[#00ff88] font-bold text-lg">{formatCurrency(analytics.lowestDay[1])}</p>
                <p className="text-[#666] text-xs">{new Date(analytics.lowestDay[0]).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4 animate-fadeIn">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`bg-[#0f0f0f] rounded-lg p-4 border-l-4 ${
                insight.type === 'warning' ? 'border-[#FFD700]' :
                insight.type === 'success' ? 'border-[#00ff88]' :
                'border-[#bb86fc]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h4 className="text-[#e0e0e0] font-semibold mb-1">{insight.title}</h4>
                  <p className="text-[#a0a0a0] text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-[#bb86fc]/10 to-transparent rounded-lg p-4 mt-4">
            <h4 className="text-[#bb86fc] font-semibold mb-3 flex items-center gap-2">
              💡 Quick Tips to Improve
            </h4>
            <ul className="space-y-2 text-sm text-[#a0a0a0]">
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">✓</span>
                Try 2 no-spend days per week to boost savings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">✓</span>
                Set category-wise daily limits for better control
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">✓</span>
                Review transactions every evening to stay aware
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">✓</span>
                Use the 24-hour rule for purchases over {currency}500
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsInsights
