import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://parshava-backend.onrender.com/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// Helper methods
export const get = (url, params) => apiClient.get(url, { params })
export const post = (url, data) => apiClient.post(url, data)
export const put = (url, data) => apiClient.put(url, data)
export const patch = (url, data) => apiClient.patch(url, data)
export const del = (url, params) => apiClient.delete(url, { params })

export default apiClient