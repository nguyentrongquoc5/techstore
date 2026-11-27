import { api } from './api';
import type { Coupon } from '../types';

export interface CouponValidateResult {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  discount: number;
  minOrder: number;
  maxDiscount: number | null;
}

export const couponService = {
  validate(code: string, subtotal: number) {
    return api<CouponValidateResult>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    });
  },

  getAll() {
    return api<Coupon[]>('/coupons');
  },

  create(data: Partial<Coupon> & { code: string; type: string; value: number }) {
    return api<Coupon>('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Coupon>) {
    return api<Coupon>(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: string) {
    return api<{ message: string }>(`/coupons/${id}`, { method: 'DELETE' });
  },
};