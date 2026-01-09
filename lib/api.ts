import axios from "axios"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log("AUTH HEADER:", config.headers.Authorization)
    return config
  },
  Promise.reject
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Network error. Please check your connection.")
      )
    }

    // IMPORTANT FIX: Only redirect on 401 if we actually have a token
    // This prevents redirect on login failures
    if (error.response.status === 401) {
      const token = localStorage.getItem("token")
      
      // Only clear storage and redirect if we actually have a token
      // This means the user was previously logged in but token expired
      if (token) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/"
      }
      // If no token exists, this is likely a login attempt failure
      // Let it pass through to be handled by the login function
    }

    return Promise.reject(error)
  }
)

export default api