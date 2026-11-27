import { api } from './api';

export const paymentService = {
  createPayment(orderId: string, provider: 'vnpay' | 'momo') {
    return api<{ payUrl: string }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, provider }),
    });
  },
};
