import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Copy, Check, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react'
import { emailConnectionAPI } from '../services/api'

const GMAIL_FORWARDING_SETTINGS_URL = 'https://mail.google.com/mail/u/0/#settings/fwdandpop'

function CopyableAddress({ address }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — the address is still selectable text.
    }
  }

  return (
    <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3">
      <code className="flex-1 text-[#03DAC6] font-mono text-sm break-all">{address}</code>
      <button
        onClick={handleCopy}
        className="shrink-0 p-2 text-[#a0a0a0] hover:text-[#03DAC6] hover:bg-[#03DAC6]/10 rounded-lg transition-all"
        title="Copy address"
      >
        {copied ? <Check size={16} className="text-[#00ff88]" /> : <Copy size={16} />}
      </button>
    </div>
  )
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[#03DAC6]/10 border border-[#03DAC6]/30 flex items-center justify-center text-[#03DAC6] font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <p className="text-[#e0e0e0] font-medium mb-2">{title}</p>
        {children}
      </div>
    </div>
  )
}

function EmailSyncSetup() {
  const { getToken } = useAuth()
  const [connection, setConnection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [showRawFallback, setShowRawFallback] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const fetchConnection = useCallback(async () => {
    try {
      const token = await getToken()
      const response = await emailConnectionAPI.get(token)
      if (response.success) {
        setConnection(response.data)
        setError('')
      }
    } catch (err) {
      console.error('Failed to load email connection:', err)
      setError('Could not load your forwarding address. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  const handleCheckNow = useCallback(async () => {
    setIsChecking(true)
    try {
      const token = await getToken()
      const response = await emailConnectionAPI.checkNow(token)
      if (response.success) {
        setConnection(response.data)
        setError('')
      }
    } catch (err) {
      console.error('Failed to check email connection:', err)
      setError('Check failed. Check your connection and try again.')
    } finally {
      setIsChecking(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  // Light auto-poll while setup is incomplete, so the code/status appears
  // without the user having to keep clicking "Check now". Stops once active
  // (or unmounted) so it never polls forever in the background.
  useEffect(() => {
    if (!connection || connection.status === 'active') {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(handleCheckNow, 20000)
    return () => clearInterval(pollRef.current)
  }, [connection?.status, handleCheckNow])

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center text-[#666]">
        Loading your email sync setup…
      </div>
    )
  }

  if (error && !connection) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <p className="text-[#ff6b6b]">{error}</p>
        <button onClick={fetchConnection} className="mt-3 text-[#03DAC6] text-sm hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!connection?.ingestConfigured) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <p className="text-[#e0e0e0] font-medium mb-2">Bank email sync isn't set up on this server yet</p>
        <p className="text-[#a0a0a0] text-sm">
          The app owner needs to configure a dedicated inbox for this feature. Nothing you can do here — check back later.
        </p>
      </div>
    )
  }

  const { syncAddress, status, confirmationCode, confirmationRawText, lastSyncedAt } = connection

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#e0e0e0] mb-2 flex items-center gap-2">
          📧 Bank Email Sync
        </h3>
        <p className="text-[#a0a0a0] text-sm mb-6">
          Forward your bank's transaction alerts to your personal BudgetBuddy address, and they'll show up
          here automatically — debits as expenses, credits as income.
        </p>

        {status === 'active' && (
          <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
            <Check size={18} className="text-[#00ff88] shrink-0" />
            <div>
              <p className="text-[#00ff88] font-medium text-sm">Connected</p>
              {lastSyncedAt && (
                <p className="text-[#666] text-xs">Last synced {new Date(lastSyncedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 mb-6 text-[#ff6b6b] text-sm">
            {error}
          </div>
        )}

        <div>
          <Step number={1} title="Your forwarding address">
            <CopyableAddress address={syncAddress} />
          </Step>

          <Step number={2} title="Add it to Gmail as a forwarding address">
            <p className="text-[#a0a0a0] text-sm mb-2">
              In Gmail: Settings → <strong className="text-[#e0e0e0]">Forwarding and POP/IMAP</strong> →{' '}
              <strong className="text-[#e0e0e0]">Add a forwarding address</strong> → paste the address above.
            </p>
            <a
              href={GMAIL_FORWARDING_SETTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#03DAC6] text-sm hover:underline"
            >
              Open Gmail forwarding settings <ExternalLink size={14} />
            </a>
          </Step>

          <Step number={3} title="Confirm the forwarding address">
            <p className="text-[#a0a0a0] text-sm mb-3">
              Gmail will email a confirmation code to that address. We'll pick it up automatically —
              or press "Check now" below.
            </p>

            {status === 'code_ready' && confirmationCode && (
              <div className="bg-[#03DAC6]/10 border border-[#03DAC6]/30 rounded-lg px-4 py-3 mb-3">
                <p className="text-[#666] text-xs mb-1">Paste this into Gmail's confirmation dialog:</p>
                <p className="text-[#03DAC6] font-mono text-lg font-semibold break-all">{confirmationCode}</p>
              </div>
            )}

            {status === 'code_ready' && !confirmationCode && confirmationRawText && (
              <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg px-4 py-3 mb-3">
                <p className="text-[#FFD700] text-sm mb-2">
                  We received Gmail's confirmation email but couldn't automatically find the code — here's
                  what it said, so you can find it yourself:
                </p>
                <pre className="text-[#a0a0a0] text-xs whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {confirmationRawText}
                </pre>
              </div>
            )}

            {status === 'code_ready' && confirmationRawText && confirmationCode && (
              <button
                onClick={() => setShowRawFallback(!showRawFallback)}
                className="flex items-center gap-1 text-[#666] text-xs hover:text-[#a0a0a0] mb-3"
              >
                <ChevronDown size={12} className={showRawFallback ? 'rotate-180' : ''} />
                {showRawFallback ? 'Hide' : 'Show'} the raw confirmation email
              </button>
            )}
            {showRawFallback && confirmationRawText && confirmationCode && (
              <pre className="text-[#a0a0a0] text-xs whitespace-pre-wrap break-words max-h-48 overflow-y-auto bg-[#0f0f0f] rounded-lg p-3 mb-3">
                {confirmationRawText}
              </pre>
            )}

            {status !== 'active' && (
              <button
                onClick={handleCheckNow}
                disabled={isChecking}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#333] text-[#03DAC6] rounded-lg text-sm font-medium hover:border-[#03DAC6] transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
                {isChecking ? 'Checking…' : 'Check now'}
              </button>
            )}
          </Step>

          <Step number={4} title="Forward your bank's alerts">
            <p className="text-[#a0a0a0] text-sm">
              Once confirmed, create a Gmail filter: <span className="text-[#e0e0e0]">from your bank's alert
              address</span> → <span className="text-[#e0e0e0]">Forward to</span> the address above. For
              example, Axis Bank sends from <code className="text-[#03DAC6]">alerts@axis.bank.in</code>.
            </p>
          </Step>

          <Step number={5} title={status === 'active' ? 'Syncing' : 'Waiting for your first transaction'}>
            {status === 'active' ? (
              <p className="text-[#a0a0a0] text-sm">
                New transactions from forwarded emails show up automatically, usually within a few minutes.
              </p>
            ) : (
              <p className="text-[#a0a0a0] text-sm">
                This will update itself once your first forwarded transaction arrives — or forward one
                manually and press "Check now" above.
              </p>
            )}
          </Step>
        </div>
      </div>
    </div>
  )
}

export default EmailSyncSetup
