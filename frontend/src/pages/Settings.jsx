import { useState, useMemo, useEffect, useRef } from 'react'
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'
import { authAPI } from '../services/api'
import { CATEGORY_ICONS, DEFAULT_CATEGORY_BUDGETS as DEFAULT_BUDGETS } from '../constants/categories'
import { DEFAULT_SETTINGS, clearCachedSettings } from '../constants/settings'
import Toast from '../components/Toast'
import EmailSyncSetup from '../components/EmailSyncSetup'

const CURRENCY_NAMES = {
  '₹': 'Indian Rupee',
  '$': 'US Dollar',
  '€': 'Euro',
  '£': 'British Pound'
}

function Settings({
  expenses = [],
  savings = [],
  reminders = [],
  settings = DEFAULT_SETTINGS,
  onUpdateSettings,
  onClearAllData,
  onImportExpenses
}) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { openUserProfile } = useClerk()
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  // Local-only display preferences. These are cosmetic and per-device by
  // design (theme follows the screen you're on), so they stay in
  // localStorage rather than syncing — unlike budgets and currency, which
  // are your data and now live on the server.
  const loadLocalPref = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  }

  // Identity comes from Clerk; currency comes from server settings.
  const profile = {
    name: user?.fullName || user?.firstName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || '',
    imageUrl: user?.imageUrl,
    currency: settings.currency || '₹'
  }

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Budget draft — edited locally, saved to the server on "Save Changes".
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget)
  const [categoryBudgets, setCategoryBudgets] = useState(settings.categoryBudgets)
  const [hasChanges, setHasChanges] = useState(false)

  // Adopt server settings whenever they change, unless the user is
  // mid-edit — overwriting a draft they haven't saved would lose their work.
  useEffect(() => {
    if (hasChanges) return
    setMonthlyBudget(settings.monthlyBudget)
    setCategoryBudgets(settings.categoryBudgets)
  }, [settings.monthlyBudget, settings.categoryBudgets, hasChanges])

  const notifications = settings.notifications || DEFAULT_SETTINGS.notifications

  const [preferences, setPreferences] = useState(() => loadLocalPref('budgetbuddy_preferences', {
    theme: 'dark',
    language: 'en',
    dateFormat: 'dd/mm/yyyy'
  }))

  const [alertThresholds, setAlertThresholds] = useState(() => loadLocalPref('budgetbuddy_alertThresholds', {
    warning: 75,
    critical: 90
  }))

  // Clear data confirmation state
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)

  // Calculate total allocated
  const totalAllocated = useMemo(() => {
    return Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0)
  }, [categoryBudgets])

  const isBalanced = totalAllocated === monthlyBudget

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // Save a local-only display preference (theme, language, date format).
  const saveLocalPref = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  // Handle budget change
  const handleBudgetChange = (category, value) => {
    const numValue = parseInt(value) || 0
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: numValue
    }))
    setHasChanges(true)
  }

  // Reset budgets
  const handleReset = () => {
    setCategoryBudgets(DEFAULT_BUDGETS)
    setMonthlyBudget(DEFAULT_SETTINGS.monthlyBudget)
    setHasChanges(true)
    showToast('Budget reset to defaults — press Save to keep it', 'info')
  }

  // Save budgets
  const handleSaveBudgets = async () => {
    try {
      await onUpdateSettings({ monthlyBudget, categoryBudgets })
      setHasChanges(false)
      showToast('Budget saved', 'success')
    } catch {
      // App.jsx already surfaced the error and rolled the change back.
    }
  }

  const handleCurrencyChange = async (currency) => {
    try {
      await onUpdateSettings({ currency })
      showToast('Currency updated', 'success')
    } catch {
      // Handled upstream.
    }
  }

  // Delete account: remove the user's records first, while the session is
  // still valid, then delete the Clerk identity. Doing it the other way
  // round would invalidate the token and strand the data.
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    setIsDeleting(true)
    try {
      const token = await getToken()
      await authAPI.deleteAccount(token)
      clearCachedSettings()
      await user.delete()
      // Deleting the Clerk user ends the session, so the app returns to the
      // signed-out landing page on its own.
    } catch (error) {
      console.error('Failed to delete account:', error)
      showToast(
        error?.errors?.[0]?.message || 'Could not delete your account. Check your connection and try again.',
        'error'
      )
      setIsDeleting(false)
    }
  }

  // Preferences handlers
  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    saveLocalPref('budgetbuddy_preferences', newPrefs)

    // Apply theme immediately
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value)
      showToast(`Theme changed to ${value}`, 'success')
    } else {
      showToast('Preference saved', 'success')
    }
  }

  // Notification handlers — these are account settings, so they go to the server.
  const handleNotificationToggle = async (key) => {
    const wasEnabled = notifications[key]
    try {
      await onUpdateSettings({ notifications: { ...notifications, [key]: !wasEnabled } })
      showToast(`${wasEnabled ? 'Disabled' : 'Enabled'} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'info')
    } catch {
      // Handled upstream.
    }
  }

  // Alert threshold handlers
  const handleWarningThreshold = (value) => {
    const newThresholds = { ...alertThresholds, warning: value }
    setAlertThresholds(newThresholds)
    saveLocalPref('budgetbuddy_alertThresholds', newThresholds)
    showToast(`Warning threshold set to ${value}%`, 'info')
  }

  const handleCriticalThreshold = (value) => {
    const newThresholds = { ...alertThresholds, critical: value }
    setAlertThresholds(newThresholds)
    saveLocalPref('budgetbuddy_alertThresholds', newThresholds)
    showToast(`Critical threshold set to ${value}%`, 'info')
  }

  // Export data to CSV
  const handleExportData = () => {
    // Create CSV content
    let csvContent = 'Type,Description,Amount,Category,Date,Target Amount\n'
    
    // Add expenses
    expenses.forEach(exp => {
      csvContent += `Expense,"${exp.description}",${exp.amount},${exp.category},${new Date(exp.date).toLocaleDateString()},\n`
    })
    
    // Add savings
    savings.forEach(sav => {
      csvContent += `Saving,"${sav.note || 'Savings'}",${sav.amount},,${new Date(sav.date).toLocaleDateString()},\n`
    })

    // Add reminders
    reminders.forEach(rem => {
      csvContent += `Reminder,"${rem.title}",${rem.amount || ''},${rem.category || ''},${new Date(rem.date).toLocaleDateString()},\n`
    })

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `budgetbuddy_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast(`Exported ${expenses.length} expenses, ${savings.length} savings, ${reminders.length} reminders`, 'success')
  }

  // Import data from CSV
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        const lines = text.split('\n').slice(1) // Skip header
        const importedExpenses = []

        lines.forEach((line, index) => {
          if (!line.trim()) return
          
          // Parse CSV line (handle quoted strings)
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
          if (!matches || matches.length < 4) return

          const [type, description, amount, category, date] = matches.map(m => m.replace(/"/g, '').trim())
          
          if (type === 'Expense' && description && amount && category) {
            importedExpenses.push({
              id: Date.now() + index,
              description,
              amount: parseFloat(amount) || 0,
              category: category || 'Other',
              date: date ? new Date(date).toISOString() : new Date().toISOString()
            })
          }
        })

        if (importedExpenses.length > 0 && onImportExpenses) {
          // App.jsx reports the real outcome once the server confirms each
          // row was saved — don't claim success here before that happens.
          onImportExpenses(importedExpenses)
        } else if (importedExpenses.length === 0) {
          showToast('No valid expenses found in file', 'warning')
        }
      } catch (error) {
        showToast('Error parsing file. Please check the format.', 'error')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  // Clear all data
  const handleClearAllData = async () => {
    setShowClearDataConfirm(false)
    try {
      if (onClearAllData) {
        await onClearAllData()
      }
      showToast('All data cleared successfully', 'success')
    } catch (error) {
      // App.jsx already surfaces the detailed error toast; nothing more to do here.
    }
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile', color: '#bb86fc' },
    { id: 'budget', label: '💰 Budget', color: '#00ff88' },
    { id: 'bank-sync', label: '📧 Bank Sync', color: '#03DAC6' },
    { id: 'preferences', label: '⚙️ Preferences', color: '#4ecdc4' },
    { id: 'notifications', label: '🔔 Notifications', color: '#FFD700' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#bb86fc]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ⚙️ Settings
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white shadow-lg'
                : 'text-[#a0a0a0] hover:text-white bg-[#1a1a1a]'
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Profile Card */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#e0e0e0] flex items-center gap-2">
                👤 Profile
              </h3>
              <button
                onClick={() => openUserProfile()}
                className="px-4 py-2 bg-[#bb86fc] text-white rounded-lg text-sm font-medium hover:bg-[#a370e6] transition-all"
              >
                Edit Profile
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              {profile.imageUrl ? (
                <img 
                  src={profile.imageUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-3 border-[#bb86fc]"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#bb86fc] to-[#4ecdc4] rounded-full flex items-center justify-center text-3xl font-bold text-white">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h4 className="text-xl font-semibold text-[#e0e0e0]">{profile.name}</h4>
                <p className="text-[#666]">{profile.email}</p>
                {user && (
                  <p className="text-[#bb86fc] text-xs mt-1">✓ Signed in with Google</p>
                )}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#666] text-sm mb-1 block">
                    Full Name <span className="text-[#666]">(from your sign-in)</span>
                  </label>
                  <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.name}</p>
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-1 block">
                    Email <span className="text-[#666]">(from your sign-in)</span>
                  </label>
                  <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[#666] text-sm mb-1 block">Currency</label>
                  <select
                    value={profile.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none transition-all"
                  >
                    {Object.entries(CURRENCY_NAMES).map(([symbol, name]) => (
                      <option key={symbol} value={symbol}>{symbol} {name}</option>
                    ))}
                  </select>
                  <p className="text-[#666] text-xs mt-1">Saved to your account — applies on every device.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
              🔐 Security
            </h3>
            
            <div className="space-y-3">
              {/* Password, email and connected sign-in methods are managed by
                  Clerk, which owns authentication. Opening its account UI is
                  the honest option — a password form here could only pretend. */}
              <button
                onClick={() => openUserProfile()}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-3 hover:bg-[#1a1a1a] transition-all"
              >
                <div className="text-left">
                  <span className="text-[#e0e0e0] block">Password &amp; sign-in</span>
                  <span className="text-[#666] text-sm">Change your password or connected accounts</span>
                </div>
                <span className="text-[#666]">→</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-3 hover:bg-[#ff6b6b]/10 transition-all border border-transparent hover:border-[#ff6b6b]/30"
              >
                <span className="text-[#ff6b6b]">Delete Account</span>
                <span className="text-[#ff6b6b]">⚠️</span>
              </button>

              {showDeleteConfirm && (
                <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-4 animate-fadeIn">
                  <p className="text-[#ff6b6b] mb-2">⚠️ This permanently deletes your account and everything in it.</p>
                  <p className="text-[#a0a0a0] text-sm mb-4">
                    Every expense, income entry, saving, reminder and your bank-email connection
                    will be erased, and your sign-in will be removed. This cannot be undone.
                  </p>
                  <p className="text-[#a0a0a0] text-sm mb-3">Type <span className="text-[#ff6b6b] font-bold">DELETE</span> to confirm:</p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    disabled={isDeleting}
                    className="w-full bg-[#1a1a1a] border border-[#ff6b6b]/50 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none mb-4 disabled:opacity-50"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        deleteConfirmText === 'DELETE' && !isDeleting
                          ? 'bg-[#ff6b6b] text-white hover:bg-[#e55555]'
                          : 'bg-[#333] text-[#666] cursor-not-allowed'
                      }`}
                    >
                      {isDeleting ? 'Deleting…' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      disabled={isDeleting}
                      className="px-6 py-2 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-6 flex items-center gap-2">
              💰 Budget Settings
            </h3>

            {/* Monthly Total */}
            <div className="mb-6">
              <label className="text-[#a0a0a0] text-sm mb-2 block">Monthly Total Budget</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">{profile.currency}</span>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => {
                    setMonthlyBudget(parseInt(e.target.value) || 0)
                    setHasChanges(true)
                  }}
                  className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg pl-8 pr-4 py-4 text-2xl font-bold text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Allocation */}
            <div className="mb-6">
              <h4 className="text-[#a0a0a0] text-sm mb-4">Category Allocation</h4>
              <div className="space-y-3">
                {Object.entries(categoryBudgets).map(([category, budget]) => {
                  const icon = CATEGORY_ICONS[category] || '📦'
                  const percentage = monthlyBudget > 0 ? ((budget / monthlyBudget) * 100).toFixed(0) : 0
                  
                  return (
                    <div key={category} className="flex items-center gap-3 bg-[#0f0f0f] rounded-lg p-3">
                      <span className="text-2xl w-10">{icon}</span>
                      <span className="text-[#e0e0e0] w-32">{category}</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]">{profile.currency}</span>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => handleBudgetChange(category, e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-8 pr-4 py-2 text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none transition-all"
                        />
                      </div>
                      <span className="text-[#666] text-sm w-16 text-right">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total Summary */}
            <div className={`rounded-lg p-4 mb-6 ${isBalanced ? 'bg-[#00ff88]/10 border border-[#00ff88]/30' : 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#666] text-sm">Total Allocated</p>
                  <p className={`text-2xl font-bold ${isBalanced ? 'text-[#00ff88]' : 'text-[#ff6b6b]'}`}>
                    {profile.currency}{totalAllocated.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#666] text-sm">Budget</p>
                  <p className="text-2xl font-bold text-[#e0e0e0]">{profile.currency}{monthlyBudget.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-4xl">
                  {isBalanced ? '✅' : totalAllocated > monthlyBudget ? '⚠️' : '💡'}
                </div>
              </div>
              {!isBalanced && (
                <p className={`mt-2 text-sm ${totalAllocated > monthlyBudget ? 'text-[#ff6b6b]' : 'text-[#FFD700]'}`}>
                  {totalAllocated > monthlyBudget 
                    ? `Over-allocated by ${profile.currency}${(totalAllocated - monthlyBudget).toLocaleString('en-IN')}`
                    : `${profile.currency}${(monthlyBudget - totalAllocated).toLocaleString('en-IN')} unallocated`
                  }
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all"
              >
                Reset to Default
              </button>
              <button
                onClick={handleSaveBudgets}
                disabled={!hasChanges}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  hasChanges 
                    ? 'bg-[#00ff88] text-[#0f0f0f] hover:bg-[#00e67a]' 
                    : 'bg-[#333] text-[#666] cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Budget Tips */}
          <div className="bg-gradient-to-r from-[#00ff88]/10 to-transparent border border-[#333] rounded-xl p-6">
            <h4 className="text-[#00ff88] font-semibold mb-3 flex items-center gap-2">
              💡 Budget Tips
            </h4>
            <ul className="space-y-2 text-sm text-[#a0a0a0]">
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">•</span>
                50/30/20 Rule: 50% needs, 30% wants, 20% savings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">•</span>
                Review and adjust budgets monthly based on actual spending
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00ff88]">•</span>
                Start with realistic budgets and gradually reduce
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Bank Sync Tab */}
      {activeTab === 'bank-sync' && (
        <div className="animate-fadeIn">
          <EmailSyncSetup />
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-6 flex items-center gap-2">
              ⚙️ Preferences
            </h3>

            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Theme</p>
                  <p className="text-[#666] text-sm">Choose your preferred theme</p>
                </div>
                <select 
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none cursor-pointer"
                >
                  <option value="dark">🌙 Dark</option>
                  <option value="light">☀️ Light</option>
                  <option value="system">💻 System</option>
                </select>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Language</p>
                  <p className="text-[#666] text-sm">App display language</p>
                </div>
                <select 
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Date Format</p>
                  <p className="text-[#666] text-sm">How dates are displayed</p>
                </div>
                <select 
                  value={preferences.dateFormat}
                  onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none cursor-pointer"
                >
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
              📁 Data Management
            </h3>

            <div className="space-y-3">
              <button 
                onClick={handleExportData}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4 hover:bg-[#1a1a1a] transition-all"
              >
                <div>
                  <p className="text-[#e0e0e0] font-medium">Export Data</p>
                  <p className="text-[#666] text-sm">Download all your data as CSV ({expenses.length} expenses, {savings.length} savings)</p>
                </div>
                <span className="text-[#4ecdc4] text-2xl">📥</span>
              </button>

              <button 
                onClick={handleImportClick}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4 hover:bg-[#1a1a1a] transition-all"
              >
                <div>
                  <p className="text-[#e0e0e0] font-medium">Import Data</p>
                  <p className="text-[#666] text-sm">Import expenses from CSV file</p>
                </div>
                <span className="text-[#4ecdc4] text-2xl">📤</span>
              </button>

              <button 
                onClick={() => setShowClearDataConfirm(true)}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4 hover:bg-[#ff6b6b]/10 hover:border-[#ff6b6b]/30 border border-transparent transition-all"
              >
                <div>
                  <p className="text-[#ff6b6b] font-medium">Clear All Data</p>
                  <p className="text-[#666] text-sm">Delete all expenses and start fresh</p>
                </div>
                <span className="text-[#ff6b6b] text-2xl">🗑️</span>
              </button>

              {showClearDataConfirm && (
                <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-4 animate-fadeIn">
                  <p className="text-[#ff6b6b] mb-4">⚠️ Are you sure you want to clear all expenses, savings, and reminders?</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleClearAllData}
                      className="px-6 py-2 bg-[#ff6b6b] text-white rounded-lg font-medium hover:bg-[#e55555] transition-all"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      onClick={() => setShowClearDataConfirm(false)}
                      className="px-6 py-2 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-6 flex items-center gap-2">
              🔔 Notification Settings
            </h3>

            <div className="space-y-4">
              {/* Budget Alerts */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Budget Alerts</p>
                  <p className="text-[#666] text-sm">Get notified when nearing budget limits</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.budgetAlerts}
                    onChange={() => handleNotificationToggle('budgetAlerts')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
                </label>
              </div>

              {/* Daily Summary */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Daily Summary</p>
                  <p className="text-[#666] text-sm">Receive daily spending summary at 8 PM</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.dailySummary}
                    onChange={() => handleNotificationToggle('dailySummary')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
                </label>
              </div>

              {/* Reminder Notifications */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Reminder Notifications</p>
                  <p className="text-[#666] text-sm">Get notified about upcoming bills</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.reminderNotifications}
                    onChange={() => handleNotificationToggle('reminderNotifications')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
                </label>
              </div>

              {/* Weekly Report */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Weekly Report</p>
                  <p className="text-[#666] text-sm">Receive weekly spending analysis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.weeklyReport}
                    onChange={() => handleNotificationToggle('weeklyReport')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
                </label>
              </div>

              {/* Savings Milestones */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Savings Milestones</p>
                  <p className="text-[#666] text-sm">Celebrate when you hit savings goals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.savingsMilestones}
                    onChange={() => handleNotificationToggle('savingsMilestones')}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
              ⚠️ Alert Thresholds
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[#666] text-sm mb-2 block">Warn me when category budget reaches</label>
                <div className="flex gap-2">
                  {[50, 75, 90].map(threshold => (
                    <button
                      key={threshold}
                      onClick={() => handleWarningThreshold(threshold)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        alertThresholds.warning === threshold
                          ? 'bg-[#FFD700] text-[#0f0f0f]' 
                          : 'bg-[#0f0f0f] text-[#666] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      {threshold}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#666] text-sm mb-2 block">Critical alert when budget reaches</label>
                <div className="flex gap-2">
                  {[80, 90, 100].map(threshold => (
                    <button
                      key={threshold}
                      onClick={() => handleCriticalThreshold(threshold)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        alertThresholds.critical === threshold
                          ? 'bg-[#ff6b6b] text-white' 
                          : 'bg-[#0f0f0f] text-[#666] hover:text-[#e0e0e0] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      {threshold}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
        <p className="text-[#666] text-sm">BudgetBuddy v1.0.0</p>
        <p className="text-[#444] text-xs mt-1">Made with 💜 for your financial freedom</p>
        <p className="text-[#333] text-xs mt-2">All settings are saved automatically</p>
      </div>
    </div>
  )
}

export default Settings
