"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "react-hot-toast"

// Define types for our context
type User = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, adminKey?: string | null) => Promise<boolean>;
  logout: () => Promise<boolean>;
  updateUserData: (userData: Partial<User>) => void;
}

// Create the context with a default value that matches our type
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!email || !password) {
        toast.error("Email and password are required")
        return false
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      if (!data.user) {
        throw new Error("User data not returned from server")
      }

      setUser(data.user)
      toast.success("Logged in successfully")

      // Redirect based on user role
      if (data.user.isAdmin) {
        console.log("Admin login detected, redirecting to admin dashboard")
        window.location.href = "/admin-dashboard"
      } else {
        window.location.href = "/"
      }

      return true
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to login")
      return false
    }
  }

  const register = async (name: string, email: string, password: string, adminKey: string | null = null): Promise<boolean> => {
    try {
      if (!name || !email || !password) {
        toast.error("Name, email and password are required")
        return false
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, adminKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Registration failed")
      }

      if (!data.user) {
        throw new Error("User data not returned from server")
      }

      setUser(data.user)
      toast.success("Registered successfully")

      // Redirect based on user role
      if (data.user.isAdmin) {
        console.log("Admin registration detected, redirecting to admin dashboard")
        window.location.href = "/admin-dashboard"
      } else {
        window.location.href = "/"
      }

      return true
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register")
      return false
    }
  }

  const logout = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Logout failed")
      }

      setUser(null)
      toast.success("Logged out successfully")
      window.location.href = "/login"
      return true
    } catch (error) {
      console.error("Logout error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to logout. Please try again.")
      return false
    }
  }

  // Function to update user data in context
  const updateUserData = (userData: Partial<User>) => {
    if (!user) return
    
    setUser({
      ...user,
      ...userData
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}