/** Nhãn tiếng Việt dùng cho thông báo lỗi */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export const ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function getAllowedNextStatuses(current: string): readonly string[] {
  return ORDER_STATUS_TRANSITIONS[current] ?? [];
}

export function isValidStatusTransition(from: string, to: string): boolean {
  if (from === to) return true;
  return getAllowedNextStatuses(from).includes(to);
}

export function statusTransitionError(from: string, to: string): string {
  const fromLabel = ORDER_STATUS_LABELS[from] ?? from;
  const toLabel = ORDER_STATUS_LABELS[to] ?? to;
  return `Không thể chuyển từ '${fromLabel}' sang '${toLabel}'`;
}
