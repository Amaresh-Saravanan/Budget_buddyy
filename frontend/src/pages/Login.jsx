import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { Eye, EyeOff, Wallet } from 'lucide-react'

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleOAuthSignIn = async (strategy) => {
    if (!isLoaded) return
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard'
      })
    } catch (err) {
      setError(err.errors?.[0]?.message || 'OAuth sign in failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      } else {
        setError('Sign in incomplete. Please try again.')
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#1a1a1a] font-semibold text-lg">BudgetBuddy</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Welcome Back
          </h1>
          <p className="text-[#6b7280] mb-8">
            Sign in to continue managing your finances and achieving your goals.
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('oauth_google')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] font-medium hover:bg-[#f9fafb] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button
              onClick={() => handleOAuthSignIn('oauth_facebook')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] font-medium hover:bg-[#f9fafb] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Meta
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e5e7eb]"></div>
            <span className="text-[#9ca3af] text-sm">or</span>
            <div className="flex-1 h-px bg-[#e5e7eb]"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#374151] text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] focus:border-[#bb86fc] focus:ring-2 focus:ring-[#bb86fc]/20 focus:outline-none transition-all"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-[#374151] text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] focus:border-[#bb86fc] focus:ring-2 focus:ring-[#bb86fc]/20 focus:outline-none transition-all pr-12"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-[#bb86fc] text-sm hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#6b7280] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#bb86fc] hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-[#1a1a2e] relative overflow-hidden items-center justify-center">
        {/* Decorative Lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -right-20 w-96 h-96 border-[3px] border-white/30 rounded-full transform rotate-45"></div>
          <div className="absolute bottom-1/4 -left-20 w-80 h-80 border-[3px] border-white/30 rounded-full transform -rotate-12"></div>
          <svg className="absolute top-1/3 right-1/4 w-64 h-64 opacity-50" viewBox="0 0 100 100">
            <path d="M20,80 Q50,20 80,80" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M30,70 Q50,30 70,70" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Logo Icon */}
        <div className="absolute top-12 right-12">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Wallet className="w-8 h-8 text-white/80" />
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 max-w-md text-center px-8">
          <p className="text-white/90 text-xl leading-relaxed mb-6">
            "Do not save what is left after spending, but spend what is left after saving."
          </p>
          <p className="text-white/60 text-sm">
            - Warren Buffett
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-12 left-12">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#bb86fc]"></div>
            <div className="w-2 h-2 rounded-full bg-[#00ff88]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFD700]"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
