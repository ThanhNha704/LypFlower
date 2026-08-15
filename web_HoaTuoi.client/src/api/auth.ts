// src/api/auth.ts
import apiClient from './client';

export interface AuthResponse {
    token: string;
    userId: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
}

export const authApi = {
    register: (fullName: string, email: string, password: string, phone?: string, address?: string) =>
        apiClient
            .post<AuthResponse>('/auth/register', { fullName, email, password, phone, address })
            .then((r) => r.data),

    login: (email: string, password: string) =>
        apiClient
            .post<AuthResponse>('/auth/login', { email, password })
            .then((r) => r.data),

    googleLogin: (idToken: string) =>
        apiClient
            .post<AuthResponse>('/auth/google', { idToken })
            .then((r) => r.data),

    me: () =>
        apiClient.get<AuthResponse>('/auth/me').then((r) => r.data),

    updateProfile: (fullName: string, phone?: string, address?: string) =>
        apiClient
            .put<AuthResponse>('/auth/profile', { fullName, phone, address })
            .then((r) => r.data),

    changePassword: (currentPassword: string, newPassword: string) =>
        apiClient
            .put<{message: string}>('/auth/change-password', { currentPassword, newPassword })
            .then((r) => r.data),

    forgotPassword: (email: string) =>
        apiClient
            .post<{message: string}>('/auth/forgot-password', { email })
            .then((r) => r.data),

    verifyResetOtp: (email: string, otpCode: string) =>
        apiClient
            .post<{message: string; resetToken: string}>('/auth/verify-reset-otp', { email, otpCode })
            .then((r) => r.data),

    resetPassword: (email: string, token: string, newPassword: string) =>
        apiClient
            .post<{message: string}>('/auth/reset-password', { email, token, newPassword })
            .then((r) => r.data),
};