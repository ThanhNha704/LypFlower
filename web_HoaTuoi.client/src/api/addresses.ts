// src/api/addresses.ts
import apiClient from './client';

export interface UserAddress {
    id: number;
    fullName: string;
    phoneNumber: string;
    addressLine: string;
    isDefault: boolean;
}

export const addressApi = {
    getAddresses: () => apiClient.get<UserAddress[]>('/UserAddresses').then(r => r.data),
    createAddress: (payload: { fullName: string, phoneNumber: string, addressLine: string, isDefault: boolean }) => 
        apiClient.post<UserAddress>('/UserAddresses', payload).then(r => r.data),
    deleteAddress: (id: number) => apiClient.delete(`/UserAddresses/${id}`).then(r => r.data),
    setDefault: (id: number) => apiClient.put(`/UserAddresses/${id}/default`).then(r => r.data),
};
