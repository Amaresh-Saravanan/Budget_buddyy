import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { Wallet } from 'lucide-react'

// Clerk's reset flow is two steps: request a code by email, then submit the
// code together with the new password.
export default function ForgotPassword() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()

  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestCode = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setIsLoading(true)

    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email })
      setStep('reset')
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Could not send a reset code. Check the email and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      } else {
        // Most commonly this means two-factor is enabled on the account.
        setError('Password reset needs another step. Please sign in and finish it from your account settings.')
      }
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Could not reset your password. Check the code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1a1a1a] font-semibold text-lg">BudgetBuddy</span>
        </div>

        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {step === 'request' ? 'Reset your password' : 'Check your email'}
        </h1>
        <p className="text-[#6b7280] mb-8">
          {step === 'request'
            ? "Enter your email and we'll send you a reset code."
            : `We sent a code to ${email}. Enter it below with your new password.`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] focus:border-[#bb86fc] focus:ring-2 focus:ring-[#bb86fc]/20 focus:outline-none transition-all"
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-1.5">Reset code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] focus:border-[#bb86fc] focus:ring-2 focus:ring-[#bb86fc]/20 focus:outline-none transition-all"
                placeholder="Enter the code from your email"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-1.5">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] focus:border-[#bb86fc] focus:ring-2 focus:ring-[#bb86fc]/20 focus:outline-none transition-all"
                placeholder="Choose a new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting…' : 'Reset password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('request'); setError('') }}
              className="w-full text-[#6b7280] text-sm hover:text-[#1a1a1a] transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-[#6b7280] mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-[#bb86fc] hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
