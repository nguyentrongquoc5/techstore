import nodemailer from 'nodemailer';

interface ConfirmationOrder {
  id: string;
  total: number;
  items: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    price: number;
  }>;
  shippingInfo: {
    fullName: string;
    email: string;
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export async function sendOrderConfirmation(order: ConfirmationOrder): Promise<boolean> {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  const configured = required.filter((key) => process.env[key]?.trim());
  if (configured.length === 0) return false;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Thiếu cấu hình SMTP: ${missing.join(', ')}`);

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT không hợp lệ');
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER!;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const items = order.items.map((item) =>
    `<li>${escapeHtml(item.productName)}${item.variantName ? ` (${escapeHtml(item.variantName)})` : ''} × ${item.quantity}: ${new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} ₫</li>`,
  ).join('');
  await transporter.sendMail({
    from,
    to: order.shippingInfo.email,
    subject: `Xác nhận đơn hàng ${order.id}`,
    text: `Xin chào ${order.shippingInfo.fullName}, TechStore đã nhận đơn hàng ${order.id}. Tổng thanh toán: ${new Intl.NumberFormat('vi-VN').format(order.total)} VND.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>TechStore xác nhận đơn hàng</h2><p>Xin chào ${escapeHtml(order.shippingInfo.fullName)},</p><p>Chúng tôi đã nhận đơn hàng <strong>${escapeHtml(order.id)}</strong>.</p><ul>${items}</ul><p><strong>Tổng thanh toán: ${new Intl.NumberFormat('vi-VN').format(order.total)} ₫</strong></p><p>Cảm ơn bạn đã mua sắm tại TechStore.</p></div>`,
  });
  return true;
}
