import { api } from './api';
import type { Address } from '../types';

export type AddressInput = Omit<Address, 'id' | 'createdAt'>;

export const addressService = {
  list() {
    return api<Address[]>('/addresses');
  },
  create(data: AddressInput) {
    return api<Address>('/addresses', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id: string, data: AddressInput) {
    return api<Address>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  remove(id: string) {
    return api<{ message: string }>(`/addresses/${id}`, { method: 'DELETE' });
  },
};
