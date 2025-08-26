import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { GoogleAuth } from 'google-oauth-gsi'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [googleAuth, setGoogleAuth] = useState<GoogleAuth | null>(null)

  useEffect(() => {
    // Initialize Google OAuth
    if (GOOGLE_CLIENT_ID) {
      const auth = new GoogleAuth()
      auth.initializeGoogleSignIn({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      setGoogleAuth(auth)
    }

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

    setIsLoading(false)
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
    if (googleAuth) {
      googleAuth.signIn()
    } else {
      console.error('Google Auth not initialized')
    }
  }

  const logout = () => {
    if (googleAuth) {
      googleAuth.signOut()
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