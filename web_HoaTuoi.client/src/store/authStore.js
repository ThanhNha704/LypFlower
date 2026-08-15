// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,

            login: (authResponse) => {
                set({
                    token: authResponse.token,
                    user: {
                        userId: authResponse.userId,
                        fullName: authResponse.fullName,
                        email: authResponse.email,
                        role: authResponse.role,
                        phone: authResponse.phone,
                        address: authResponse.address,
                    },
                })
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                })
            },

            isAdmin: () => {
                return get().user?.role === 'Admin'
            },
        }),
        {
            name: 'flower-auth',
        }
    )
)