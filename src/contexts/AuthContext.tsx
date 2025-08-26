import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { User, AuthContextType, GoogleCredentialResponse } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

interface GoogleJwtPayload {
  sub: string
  email: string
  name: string
  picture?: string
  aud: string
  iss: string
  iat: number
  exp: number
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
          renderButton: (element: HTMLElement, options: any) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGoogleReady, setIsGoogleReady] = useState(false)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('pawscribe_user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('pawscribe_user')
      }
    }

    // Initialize Google OAuth when script loads
    const initializeGoogle = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        setIsGoogleReady(true)
      }
      setIsLoading(false)
    }

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogle()
    } else {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          initializeGoogle()
          clearInterval(checkGoogle)
        }
      }, 100)

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogle)
        if (!window.google) {
          console.error('Google Identity Services failed to load')
          setIsLoading(false)
        }
      }, 10000)
    }
  }, [])

  const handleCredentialResponse = (response: GoogleCredentialResponse) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(response.credential)
      
      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      }

      setUser(userData)
      localStorage.setItem('pawscribe_user', JSON.stringify(userData))
      
      console.log('User logged in:', userData.name)
    } catch (error) {
      console.error('Error decoding Google credential:', error)
    }
  }

  const login = () => {
    if (isGoogleReady && window.google) {
      window.google.accounts.id.prompt()
    } else {
      console.error('Google Auth not ready')
    }
  }

  const logout = () => {
    if (isGoogleReady && window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    setUser(null)
    localStorage.removeItem('pawscribe_user')
    console.log('User logged out')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}