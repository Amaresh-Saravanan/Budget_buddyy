import { useState, useEffect } from 'react'
import { RefreshCw, CloudOff } from 'lucide-react'

// A deployed backend on a free tier is suspended when idle and can take
// most of a minute to wake, which looks identical to "broken" unless the
// app says otherwise. After a few seconds of waiting, it does.
export function LoadingScreen() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 border-4 border-[#bb86fc] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[#e0e0e0] text-lg font-medium">Loading your money</p>
        {slow && (
          <p className="text-[#666] text-sm mt-3 animate-fadeIn">
            Taking a moment — the server may be waking up after being idle.
            This is normal on the first open.
          </p>
        )}
      </div>
    </div>
  )
}

export function ConnectionErrorScreen({ onRetry, isRetrying }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 flex items-center justify-center mx-auto mb-6">
          <CloudOff size={28} className="text-[#ff6b6b]" />
        </div>

        <h1
          className="text-2xl font-bold text-[#e0e0e0] mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Can't reach BudgetBuddy
        </h1>

        <p className="text-[#a0a0a0] mb-2">
          Your data is safe — the app just can't connect to the server right now.
        </p>
        <p className="text-[#666] text-sm mb-8">
          Check your internet connection and try again. If you're running the
          server yourself, make sure it's started.
        </p>

        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#bb86fc] hover:bg-[#a370e6] text-white rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Reconnecting…' : 'Try again'}
        </button>
      </div>
    </div>
  )
}

export default { LoadingScreen, ConnectionErrorScreen }
