export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

export interface AuthContextType {
  user: User | null
  login: () => void
  logout: () => void
  isLoading: boolean
}

export interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}