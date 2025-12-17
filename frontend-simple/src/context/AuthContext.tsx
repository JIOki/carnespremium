'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos
interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'DRIVER'
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
          // Sincronizar cookie para el middleware
          document.cookie = `token=${savedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Guardar en localStorage cuando cambie el usuario
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      // Guardar en cookie para middleware de seguridad
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; max-age=0'
    }
  }, [user, token])

  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      // TODO: Reemplazar con llamada real a la API
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al iniciar sesión')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setToken(data.data.token)
        setUser(data.data.user)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Registro
  const register = async (name: string, email: string, password: string, phone?: string) => {
    setIsLoading(true)
    
    try {
      // TODO: Reemplazar con llamada real a la API
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone, role: 'CUSTOMER' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al registrarse')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setToken(data.data.token)
        setUser(data.data.user)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // También limpiar el carrito si es necesario
    // localStorage.removeItem('carnes-premium-cart')
  }

  // Actualizar usuario
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}