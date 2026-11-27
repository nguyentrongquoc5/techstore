import { api } from './api';
import type { Paginated } from '../types';

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  message: string;
  createdAt: string;
}

export const contactService = {
  submit(data: Pick<ContactMessage, 'fullName' | 'email' | 'message'>) {
    return api<{ id: string; message: string }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<Paginated<ContactMessage>>(`/contacts${qs}`);
  },
};
