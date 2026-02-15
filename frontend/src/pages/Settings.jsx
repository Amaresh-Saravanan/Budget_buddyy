import { useState, useMemo, useEffect, useRef } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { authAPI } from '../services/api'

// Default category budgets
const DEFAULT_BUDGETS = {
  'Food': 6000,
  'Transport': 3000,
  'Shopping': 4000,
  'Entertainment': 2000,
  'Bills': 5000,
  'Health': 2000,
  'Other': 3000
}

const CATEGORY_ICONS = {
  'Food': '🍔',
  'Transport': '🚗',
  'Shopping': '🛒',
  'Entertainment': '🎬',
  'Bills': '📄',
  'Health': '💊',
  'Other': '📦'
}

const CURRENCY_NAMES = {
  '₹': 'Indian Rupee',
  '$': 'US Dollar',
  '€': 'Euro',
  '£': 'British Pound'
}

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-[#00ff88]',
    error: 'bg-[#ff6b6b]',
    warning: 'bg-[#FFD700]',
    info: 'bg-[#4ecdc4]'
  }[type] || 'bg-[#bb86fc]'

  const textColor = type === 'warning' ? 'text-[#0f0f0f]' : type === 'success' ? 'text-[#0f0f0f]' : 'text-white'

  return (
    <div className={`fixed top-4 right-4 ${bgColor} ${textColor} px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn flex items-center gap-3`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">×</button>
    </div>
  )
}

function Settings({ 
  expenses = [], 
  savings = [], 
  reminders = [],
  onClearAllData,
  onImportExpenses,
  onUpdateBudgets,
  categoryBudgets: propCategoryBudgets
}) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [dbSettings, setDbSettings] = useState(null)
  const fileInputRef = useRef(null)
  
  // Load settings from localStorage on mount
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  }

  // Fetch user settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getToken()
        if (token) {
          const response = await authAPI.getMe(token)
          if (response.success && response.data) {
            setDbSettings(response.data.settings)
            // Update local state with database settings
            if (response.data.settings) {
              const settings = response.data.settings
              setMonthlyBudget(settings.monthlyBudget || 25000)
              setCategoryBudgets(settings.categoryBudgets || DEFAULT_BUDGETS)
              setNotifications(prev => ({
                ...prev,
                ...settings.notifications
              }))
              setProfile(prev => ({
                ...prev,
                currency: settings.currency || '₹'
              }))
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [getToken])

  // Profile state - use Clerk user data
  const [profile, setProfile] = useState(() => ({
    name: user?.fullName || user?.firstName || loadFromStorage('budgetbuddy_profile', { name: 'User' }).name,
    email: user?.primaryEmailAddress?.emailAddress || loadFromStorage('budgetbuddy_profile', { email: '' }).email,
    phone: loadFromStorage('budgetbuddy_profile', { phone: '' }).phone || '+91 98765 43210',
    currency: loadFromStorage('budgetbuddy_profile', { currency: '₹' }).currency,
    monthStartDay: loadFromStorage('budgetbuddy_profile', { monthStartDay: 1 }).monthStartDay,
    imageUrl: user?.imageUrl
  }))
  
  // Update profile when Clerk user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.fullName || user.firstName || prev.name,
        email: user.primaryEmailAddress?.emailAddress || prev.email,
        imageUrl: user.imageUrl
      }))
    }
  }, [user])
  const [originalProfile, setOriginalProfile] = useState(profile)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  
  // Password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState(() => loadFromStorage('budgetbuddy_monthlyBudget', 25000))
  const [categoryBudgets, setCategoryBudgets] = useState(() => 
    propCategoryBudgets || loadFromStorage('budgetbuddy_categoryBudgets', DEFAULT_BUDGETS)
  )
  const [hasChanges, setHasChanges] = useState(false)

  // Preferences state
  const [preferences, setPreferences] = useState(() => loadFromStorage('budgetbuddy_preferences', {
    theme: 'dark',
    language: 'en',
    dateFormat: 'dd/mm/yyyy'
  }))

  // Notifications state
  const [notifications, setNotifications] = useState(() => loadFromStorage('budgetbuddy_notifications', {
    budgetAlerts: true,
    dailySummary: true,
    reminderNotifications: true,
    weeklyReport: false,
    savingsMilestones: true
  }))

  // Alert thresholds state
  const [alertThresholds, setAlertThresholds] = useState(() => loadFromStorage('budgetbuddy_alertThresholds', {
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

  // Save to localStorage helper
  const saveToStorage = (key, value) => {
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
    setMonthlyBudget(25000)
    setHasChanges(true)
    showToast('Budget reset to defaults', 'info')
  }

  // Save budgets
  const handleSaveBudgets = async () => {
    try {
      const token = await getToken()
      if (token) {
        await authAPI.updateSettings({
          monthlyBudget,
          categoryBudgets,
          currency: profile.currency
        }, token)
      }
      saveToStorage('budgetbuddy_categoryBudgets', categoryBudgets)
      saveToStorage('budgetbuddy_monthlyBudget', monthlyBudget)
      if (onUpdateBudgets) {
        onUpdateBudgets(categoryBudgets, monthlyBudget)
      }
      setHasChanges(false)
      showToast('Budget settings saved to cloud!', 'success')
    } catch (error) {
      console.error('Failed to save budgets:', error)
      showToast('Failed to save. Try again.', 'error')
    }
  }

  // Profile handlers
  const handleProfileEdit = () => {
    setOriginalProfile(profile)
    setIsEditingProfile(true)
  }

  const handleProfileSave = async () => {
    // Validate
    if (!profile.name.trim()) {
      showToast('Name cannot be empty', 'error')
      return
    }
    if (!profile.email.includes('@')) {
      showToast('Please enter a valid email', 'error')
      return
    }

    try {
      const token = await getToken()
      if (token) {
        await authAPI.updateSettings({
          currency: profile.currency
        }, token)
      }
      saveToStorage('budgetbuddy_profile', profile)
      setIsEditingProfile(false)
      showToast('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast('Failed to save. Try again.', 'error')
    }
  }

  const handleProfileCancel = () => {
    setProfile(originalProfile)
    setIsEditingProfile(false)
  }

  // Password handlers
  const handlePasswordUpdate = () => {
    setPasswordError('')
    
    // Validate
    if (!passwords.current) {
      setPasswordError('Please enter current password')
      return
    }
    if (passwords.new.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Passwords do not match')
      return
    }

    // Simulate password update (in real app, call API)
    const savedPassword = localStorage.getItem('budgetbuddy_password') || 'password123'
    if (passwords.current !== savedPassword) {
      setPasswordError('Current password is incorrect')
      return
    }

    localStorage.setItem('budgetbuddy_password', passwords.new)
    setPasswords({ current: '', new: '', confirm: '' })
    setShowChangePassword(false)
    showToast('Password updated successfully!', 'success')
  }

  // Delete account handler
  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    // Clear all data
    localStorage.removeItem('budgetbuddy_profile')
    localStorage.removeItem('budgetbuddy_categoryBudgets')
    localStorage.removeItem('budgetbuddy_monthlyBudget')
    localStorage.removeItem('budgetbuddy_preferences')
    localStorage.removeItem('budgetbuddy_notifications')
    localStorage.removeItem('budgetbuddy_alertThresholds')
    localStorage.removeItem('budgetbuddy_password')

    if (onClearAllData) {
      onClearAllData()
    }

    // Reset to defaults
    setProfile({
      name: 'User',
      email: 'user@email.com',
      phone: '',
      currency: '₹',
      monthStartDay: 1
    })
    setCategoryBudgets(DEFAULT_BUDGETS)
    setMonthlyBudget(25000)
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
    showToast('Account deleted. All data cleared.', 'warning')
  }

  // Preferences handlers
  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    saveToStorage('budgetbuddy_preferences', newPrefs)
    
    // Apply theme immediately
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value)
      showToast(`Theme changed to ${value}`, 'success')
    } else {
      showToast('Preference saved', 'success')
    }
  }

  // Notification handlers
  const handleNotificationToggle = async (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifications)
    saveToStorage('budgetbuddy_notifications', newNotifications)
    
    try {
      const token = await getToken()
      if (token) {
        await authAPI.updateSettings({
          notifications: newNotifications
        }, token)
      }
    } catch (error) {
      console.error('Failed to save notification setting:', error)
    }
    
    showToast(`${notifications[key] ? 'Disabled' : 'Enabled'} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'info')
  }

  // Alert threshold handlers
  const handleWarningThreshold = (value) => {
    const newThresholds = { ...alertThresholds, warning: value }
    setAlertThresholds(newThresholds)
    saveToStorage('budgetbuddy_alertThresholds', newThresholds)
    showToast(`Warning threshold set to ${value}%`, 'info')
  }

  const handleCriticalThreshold = (value) => {
    const newThresholds = { ...alertThresholds, critical: value }
    setAlertThresholds(newThresholds)
    saveToStorage('budgetbuddy_alertThresholds', newThresholds)
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
      csvContent += `Saving,"${sav.description}",${sav.amount},,${new Date(sav.date).toLocaleDateString()},${sav.targetAmount}\n`
    })
    
    // Add reminders
    reminders.forEach(rem => {
      csvContent += `Reminder,"${rem.title}",,,${new Date(rem.dueDate).toLocaleDateString()},\n`
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
          onImportExpenses(importedExpenses)
          showToast(`Imported ${importedExpenses.length} expenses successfully!`, 'success')
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
  const handleClearAllData = () => {
    if (onClearAllData) {
      onClearAllData()
    }
    setShowClearDataConfirm(false)
    showToast('All data cleared successfully', 'success')
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile', color: '#bb86fc' },
    { id: 'budget', label: '💰 Budget', color: '#00ff88' },
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
              {!isEditingProfile && (
                <button
                  onClick={handleProfileEdit}
                  className="px-4 py-2 bg-[#bb86fc] text-white rounded-lg text-sm font-medium hover:bg-[#a370e6] transition-all"
                >
                  Edit Profile
                </button>
              )}
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
                  <label className="text-[#666] text-sm mb-1 block">Full Name {user && <span className="text-[#bb86fc]">(from Google)</span>}</label>
                  <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.name}</p>
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-1 block">Email {user && <span className="text-[#bb86fc]">(from Google)</span>}</label>
                  <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.email}</p>
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-1 block">Phone</label>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none transition-all"
                    />
                  ) : (
                    <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.phone || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-1 block">Currency</label>
                  {isEditingProfile ? (
                    <select
                      value={profile.currency}
                      onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none transition-all"
                    >
                      <option value="₹">₹ Indian Rupee</option>
                      <option value="$">$ US Dollar</option>
                      <option value="€">€ Euro</option>
                      <option value="£">£ British Pound</option>
                    </select>
                  ) : (
                    <p className="text-[#e0e0e0] bg-[#0f0f0f] rounded-lg px-4 py-3">{profile.currency} {CURRENCY_NAMES[profile.currency]}</p>
                  )}
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleProfileSave}
                    className="px-6 py-2 bg-[#00ff88] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#00e67a] transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleProfileCancel}
                    className="px-6 py-2 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4 flex items-center gap-2">
              🔐 Security
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-3 hover:bg-[#1a1a1a] transition-all"
              >
                <span className="text-[#e0e0e0]">Change Password</span>
                <span className="text-[#666]">{showChangePassword ? '▼' : '→'}</span>
              </button>

              {showChangePassword && (
                <div className="bg-[#0f0f0f] rounded-lg p-4 space-y-3 animate-fadeIn">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="New Password (min 6 characters)"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#bb86fc] focus:outline-none"
                  />
                  {passwordError && (
                    <p className="text-[#ff6b6b] text-sm">{passwordError}</p>
                  )}
                  <div className="flex gap-3">
                    <button 
                      onClick={handlePasswordUpdate}
                      className="px-6 py-2 bg-[#bb86fc] text-white rounded-lg font-medium hover:bg-[#a370e6] transition-all"
                    >
                      Update Password
                    </button>
                    <button 
                      onClick={() => {
                        setShowChangePassword(false)
                        setPasswords({ current: '', new: '', confirm: '' })
                        setPasswordError('')
                      }}
                      className="px-6 py-2 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="w-full flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-3 hover:bg-[#ff6b6b]/10 transition-all border border-transparent hover:border-[#ff6b6b]/30"
              >
                <span className="text-[#ff6b6b]">Delete Account</span>
                <span className="text-[#ff6b6b]">⚠️</span>
              </button>

              {showDeleteConfirm && (
                <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-4 animate-fadeIn">
                  <p className="text-[#ff6b6b] mb-4">⚠️ This will permanently delete all your data. This action cannot be undone.</p>
                  <p className="text-[#a0a0a0] text-sm mb-3">Type <span className="text-[#ff6b6b] font-bold">DELETE</span> to confirm:</p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    className="w-full bg-[#1a1a1a] border border-[#ff6b6b]/50 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none mb-4"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        deleteConfirmText === 'DELETE'
                          ? 'bg-[#ff6b6b] text-white hover:bg-[#e55555]'
                          : 'bg-[#333] text-[#666] cursor-not-allowed'
                      }`}
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
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

              {/* Month Start Day */}
              <div className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-4 py-4">
                <div>
                  <p className="text-[#e0e0e0] font-medium">Budget Month Starts On</p>
                  <p className="text-[#666] text-sm">When your monthly budget resets</p>
                </div>
                <select 
                  value={profile.monthStartDay}
                  onChange={(e) => {
                    const newProfile = { ...profile, monthStartDay: parseInt(e.target.value) }
                    setProfile(newProfile)
                    saveToStorage('budgetbuddy_profile', newProfile)
                    showToast('Month start day updated', 'success')
                  }}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none cursor-pointer"
                >
                  {[1, 5, 10, 15, 20, 25].map(day => (
                    <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month</option>
                  ))}
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
