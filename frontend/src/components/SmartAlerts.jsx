import { useMemo, useState } from 'react'

function SmartAlerts({ stats, expenses, reminders, categoryBreakdown, currency = '₹' }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([])

  // Format currency based on symbol
  const formatCurrency = (amount) => {
    const num = Math.round(amount)
    if (currency === '₹') return `₹${num.toLocaleString('en-IN')}`
    if (currency === '$') return `$${num.toLocaleString('en-US')}`
    if (currency === '€') return `€${num.toLocaleString('de-DE')}`
    if (currency === '£') return `£${num.toLocaleString('en-GB')}`
    return `${currency}${num.toLocaleString()}`
  }

  const alerts = useMemo(() => {
    const alertsList = []
    const now = new Date()

    // 1. Budget Pacing Alert
    if (stats.budgetUsedPercent > stats.monthProgress + 20) {
      alertsList.push({
        id: 'budget-pace-critical',
        type: 'critical',
        icon: '🚨',
        title: 'Budget Pacing Critical!',
        message: `You've spent ${stats.budgetUsedPercent}% of your budget but only ${stats.monthProgress}% of the month has passed. You're ${formatCurrency((stats.budgetUsedPercent - stats.monthProgress) * stats.monthlyBudget / 100)} over pace.`,
        action: 'Review spending',
        color: '#ff6b6b'
      })
    } else if (stats.budgetUsedPercent > stats.monthProgress + 10) {
      alertsList.push({
        id: 'budget-pace-warning',
        type: 'warning',
        icon: '⚠️',
        title: 'Spending Ahead of Schedule',
        message: `You're spending faster than planned. Budget used: ${stats.budgetUsedPercent}% vs Month progress: ${stats.monthProgress}%`,
        action: 'View breakdown',
        color: '#FFD700'
      })
    }

    // 2. Category Budget Warnings
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.spent === 0) return // Skip empty categories
      
      const percentage = (data.spent / data.budget) * 100
      if (percentage >= 100) {
        alertsList.push({
          id: `cat-exceeded-${category}`,
          type: 'critical',
          icon: '🚨',
          title: `${data.icon} ${category} Budget Exceeded!`,
          message: `You've exceeded your ${category} budget by ${formatCurrency(data.spent - data.budget)}. Total spent: ${formatCurrency(data.spent)} / Budget: ${formatCurrency(data.budget)}`,
          action: 'Adjust budget',
          color: '#ff6b6b'
        })
      } else if (percentage >= 90) {
        alertsList.push({
          id: `cat-critical-${category}`,
          type: 'critical',
          icon: '🚨',
          title: `${data.icon} ${category} Almost Exhausted!`,
          message: `Only ${formatCurrency(data.budget - data.spent)} left in your ${category} budget (${Math.round(percentage)}% used). Be careful!`,
          action: 'View details',
          color: '#ff6b6b'
        })
      } else if (percentage >= 75) {
        alertsList.push({
          id: `cat-warning-${category}`,
          type: 'warning',
          icon: '⚠️',
          title: `${data.icon} ${category} Budget Running Low`,
          message: `You've used ${Math.round(percentage)}% of your ${category} budget. ${formatCurrency(data.budget - data.spent)} remaining for the month.`,
          action: 'View pattern',
          color: '#FFD700'
        })
      } else if (percentage >= 50 && stats.monthProgress < 40) {
        alertsList.push({
          id: `cat-info-${category}`,
          type: 'info',
          icon: '💡',
          title: `${data.icon} ${category} Spending High`,
          message: `You've used ${Math.round(percentage)}% of your ${category} budget early in the month. Consider slowing down.`,
          action: 'Set limit',
          color: '#bb86fc'
        })
      }
    })

    // 3. Daily Allowance Warning
    if (stats.dailyAllowance < 300 && stats.remaining > 0) {
      alertsList.push({
        id: 'low-daily-allowance',
        type: 'warning',
        icon: '💰',
        title: 'Low Daily Allowance',
        message: `Your daily allowance is only ${formatCurrency(stats.dailyAllowance)} for the remaining ${stats.daysUntilReset} days. Consider a no-spend day!`,
        action: 'Plan no-spend day',
        color: '#FFD700'
      })
    }

    // 4. Negative Balance Alert
    if (stats.remaining < 0) {
      alertsList.push({
        id: 'negative-balance',
        type: 'critical',
        icon: '🚨',
        title: 'Monthly Budget Exceeded!',
        message: `You've exceeded your monthly budget by ${formatCurrency(Math.abs(stats.remaining))}. Emergency mode activated!`,
        action: 'Emergency mode',
        color: '#ff6b6b'
      })
    }

    // 5. Upcoming Reminders (Due within 3 days)
    const upcomingReminders = reminders.filter(rem => {
      if (rem.completed) return false
      const dueDate = new Date(rem.dueDate)
      const daysUntil = Math.ceil((dueDate - now) / 86400000)
      return daysUntil >= 0 && daysUntil <= 3
    })

    upcomingReminders.forEach(rem => {
      const dueDate = new Date(rem.dueDate)
      const daysUntil = Math.ceil((dueDate - now) / 86400000)
      alertsList.push({
        id: `reminder-${rem.id}`,
        type: daysUntil === 0 ? 'critical' : 'warning',
        icon: '🔔',
        title: daysUntil === 0 ? '⏰ Due Today!' : `📅 Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
        message: rem.title,
        action: 'Mark complete',
        color: daysUntil === 0 ? '#ff6b6b' : '#FFD700'
      })
    })

    // 6. Consecutive Spending Days Alert
    const last3Days = []
    for (let i = 0; i < 3; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      last3Days.push(d.toDateString())
    }
    const consecutiveSpendDays = last3Days.filter(d => 
      expenses.some(exp => new Date(exp.date).toDateString() === d)
    ).length

    if (consecutiveSpendDays === 3) {
      alertsList.push({
        id: 'spending-streak',
        type: 'info',
        icon: '📅',
        title: '3-Day Spending Streak',
        message: "You've spent money for 3 consecutive days. Try a no-spend day to boost your Finance Health Score!",
        action: 'Challenge accepted',
        color: '#4ecdc4'
      })
    }

    // 7. Large Transaction Alert (₹1000+)
    const recentLargeExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      const isRecent = (now - expDate) < 86400000 * 3 // Last 3 days
      return isRecent && parseFloat(exp.amount) >= 1000
    })

    if (recentLargeExpenses.length > 0) {
      const total = recentLargeExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
      const items = recentLargeExpenses.map(e => e.description).join(', ')
      alertsList.push({
        id: 'large-transactions',
        type: 'info',
        icon: '💸',
        title: 'Large Recent Transactions',
        message: `${recentLargeExpenses.length} large expense(s) in last 3 days: ${items} (Total: ${formatCurrency(total)})`,
        action: 'Review',
        color: '#bb86fc'
      })
    }

    // 8. Weekly Spending High
    if (stats.weeklySpent > stats.monthlyBudget * 0.35) {
      alertsList.push({
        id: 'high-weekly-spend',
        type: 'warning',
        icon: '📊',
        title: 'High Weekly Spending!',
        message: `You've spent ${formatCurrency(stats.weeklySpent)} this week alone - that's ${Math.round(stats.weeklySpent / stats.monthlyBudget * 100)}% of your monthly budget!`,
        action: 'View breakdown',
        color: '#FFD700'
      })
    }

    // 9. Good News Alerts
    if (stats.healthScore >= 80) {
      alertsList.push({
        id: 'great-score',
        type: 'success',
        icon: '🏆',
        title: 'Excellent Financial Health!',
        message: `Your Finance Health Score is ${stats.healthScore}/100. Outstanding discipline!`,
        action: 'Share achievement',
        color: '#00ff88'
      })
    }

    if (stats.noSpendDays >= 3) {
      alertsList.push({
        id: 'no-spend-streak',
        type: 'success',
        icon: '⭐',
        title: `${stats.noSpendDays} No-Spend Days This Week!`,
        message: "Amazing! Your no-spend days are significantly boosting your health score. Keep it up!",
        action: 'Keep it up',
        color: '#00ff88'
      })
    }

    // 10. Budget on track (positive reinforcement)
    if (stats.budgetUsedPercent <= stats.monthProgress && stats.budgetUsedPercent > 0) {
      alertsList.push({
        id: 'on-track',
        type: 'success',
        icon: '✅',
        title: 'Budget On Track!',
        message: `Great job! You're spending responsibly. ${stats.budgetUsedPercent}% used with ${stats.monthProgress}% of month passed.`,
        action: 'View details',
        color: '#00ff88'
      })
    }

    return alertsList.filter(alert => !dismissedAlerts.includes(alert.id))
  }, [stats, expenses, reminders, categoryBreakdown, dismissedAlerts, currency])

  const dismissAlert = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId])
  }

  if (alerts.length === 0) return null

  // Sort alerts by priority
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2, success: 3 }
    return priority[a.type] - priority[b.type]
  })

  // Group alerts by type
  const criticalAlerts = sortedAlerts.filter(a => a.type === 'critical')
  const warningAlerts = sortedAlerts.filter(a => a.type === 'warning')
  const infoAlerts = sortedAlerts.filter(a => a.type === 'info')
  const successAlerts = sortedAlerts.filter(a => a.type === 'success')

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-[#e0e0e0] flex items-center gap-2">
          🔔 Smart Alerts & Warnings
        </h3>
        <div className="flex gap-2">
          {criticalAlerts.length > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b]">
              {criticalAlerts.length} Critical
            </span>
          )}
          {warningAlerts.length > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700]">
              {warningAlerts.length} Warning
            </span>
          )}
          {(infoAlerts.length + successAlerts.length) > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#00ff88]/20 text-[#00ff88]">
              {infoAlerts.length + successAlerts.length} Info
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {sortedAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`relative bg-[#0f0f0f] border-l-4 rounded-lg p-4 transition-all hover:bg-[#1a1a1a] animate-fadeIn`}
            style={{ borderLeftColor: alert.color }}
          >
            <button 
              onClick={() => dismissAlert(alert.id)}
              className="absolute top-2 right-2 text-[#666] hover:text-[#e0e0e0] transition-all text-sm"
            >
              ✕
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <span className="text-2xl">{alert.icon}</span>
              <div className="flex-1">
                <h4 className="text-[#e0e0e0] font-semibold mb-1">{alert.title}</h4>
                <p className="text-[#a0a0a0] text-sm mb-3">{alert.message}</p>
                <button 
                  className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: `${alert.color}20`,
                    color: alert.color
                  }}
                >
                  {alert.action} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dismissedAlerts.length > 0 && (
        <button 
          onClick={() => setDismissedAlerts([])}
          className="w-full mt-4 py-2 text-[#666] hover:text-[#a0a0a0] text-sm transition-all"
        >
          Show {dismissedAlerts.length} dismissed alert{dismissedAlerts.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}

export default SmartAlerts
