import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network error:', error.message)
        toast.error('Unable to connect to server. Please check your connection or try again later.')
      } else if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused:', error.message)
        toast.error('Server is not responding. Please try again later.')
      } else {
        console.error('Network request failed:', error.message)
        toast.error('Network request failed. Please check your connection.')
      }
      return Promise.reject(error)
    }

    // Handle HTTP response errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth but don't redirect automatically
      localStorage.removeItem('token')
      // Don't show toast for 401 errors to prevent spam
      console.log('Unauthorized request - token cleared')
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.')     
      // Don't redirect on rate limit, just show error
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error('An unexpected error occurred')
    }

    return Promise.reject(error)
  }
)

export default api
