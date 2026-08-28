import { useEffect } from 'react'

// Shared toast notification. Auto-dismisses after 3s or on click.
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

export default Toast
