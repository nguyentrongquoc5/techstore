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
  };
}

function safeJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
