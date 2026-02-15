import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

// Get your Clerk publishable key from https://dashboard.clerk.com/
// Add it to your .env file as VITE_CLERK_PUBLISHABLE_KEY
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file.')
}

export function ClerkProviderWithRoutes({ children }) {
  const navigate = useNavigate()
  
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY || 'pk_test_placeholder'}
      navigate={(to) => navigate(to)}
      appearance={{
        variables: {
          colorPrimary: '#bb86fc',
          colorBackground: '#1a1a1a',
          colorText: '#e0e0e0',
          colorInputBackground: '#0f0f0f',
          colorInputText: '#e0e0e0',
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
}

// Custom hook to get auth state
export function useClerkAuth() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  
  return {
    isAuthenticated: isSignedIn,
    isLoaded,
    user: user ? {
      id: user.id,
      name: user.fullName || user.firstName || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      imageUrl: user.imageUrl
    } : null
  }
}

export { useAuth, useUser }
