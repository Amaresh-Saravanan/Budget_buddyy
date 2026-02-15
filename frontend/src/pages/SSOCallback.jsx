import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

export default function SSOCallback() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#bb86fc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#e0e0e0] text-lg">Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
