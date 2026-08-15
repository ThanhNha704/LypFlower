// src/api/client.ts

import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

/* Request interceptor */
apiClient.interceptors.request.use((config) => {

    const token = useAuthStore.getState().token

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

/* Response interceptor */
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {

        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
        }

        return Promise.reject(error)
    }
)

export default apiClient