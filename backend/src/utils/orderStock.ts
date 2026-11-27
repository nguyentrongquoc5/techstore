import type { Prisma } from '@prisma/client';

type OrderLike = {
  items: string | null;
  couponCode: string | null;
};

/** Hoàn tồn kho từng sản phẩm trong đơn và hoàn 1 lượt dùng mã giảm giá (nếu có). */
export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  order: OrderLike,
): Promise<void> {
  let items: { productId?: string; variantId?: string; quantity?: number }[] = [];
  try {
    items = JSON.parse(order.items || '[]');
  } catch {
    items = [];
  }

  for (const item of items) {
    const productId = String(item.productId || '');
    const quantity = Number(item.quantity) || 0;
    if (productId && quantity > 0) {
      if (item.variantId) {
        const restored = await tx.productVariant.updateMany({
          where: { id: item.variantId, productId },
          data: { stock: { increment: quantity } },
        });
        if (restored.count === 0) continue;
      }
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
    }
  }

  if (order.couponCode) {
    await tx.coupon.updateMany({
      where: { code: order.couponCode, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
}
