import { createContext, useContext, useState, useEffect } from 'react'
import { adminLogin, getAdminProfile } from '../services/adminApi'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if admin is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await getAdminProfile()
        if (response.success) {
          setAdmin(response.data)
        } else {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
        }
      } catch (err) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminLogin({ email, password })
      if (response.success) {
        localStorage.setItem('admin_token', response.token)
        localStorage.setItem('admin_user', JSON.stringify(response.data))
        setAdmin(response.data)
        return { success: true }
      } else {
        setError(response.message || 'Login failed')
        return { success: false, message: response.message }
      }
    } catch (err) {
      const message = err.message || 'Login failed'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setAdmin(null)
    window.location.href = '/admin/login'
  }

  // Check if authenticated
  const isAuthenticated = () => {
    return !!admin && !!localStorage.getItem('admin_token')
  }

  // Check if admin has specific role
  const hasRole = (role) => {
    return admin?.role === 'admin' || admin?.role === role
  }

  return (
    <AdminAuthContext.Provider value={{
      admin,
      loading,
      error,
      login,
      logout,
      isAuthenticated,
      hasRole,
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export default AdminAuthContext