export function mapProduct(p: any) {
  return {
    ...p,
    images: safeJson(p.images, []),
    specs: safeJson(p.specs, {}),
  };
}

export function mapOrder(o: any) {
  return {
    ...o,
    items: safeJson(o.items, []),
    shippingInfo: safeJson(o.shippingInfo, {}),
    statusLogs: Array.isArray(o.statusLogs)
      ? o.statusLogs.map((log: any) => ({
          id: log.id,
          status: log.status,
          changedBy: log.changedBy,
          createdAt: log.createdAt,
        }))
      : [],
  };
}

function safeJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
