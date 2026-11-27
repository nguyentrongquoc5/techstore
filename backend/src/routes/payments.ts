import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authRequired } from '../middleware/auth.js';
import { BusinessError } from '../utils/errors.js';
import { validate } from '../utils/validate.js';

const router = Router();

function requiredEnv(...keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new BusinessError(`Chưa cấu hình thanh toán: ${missing.join(', ')}`, 503);
  }
}

function sign(value: string, secret: string, algorithm: 'sha256' | 'sha512') {
  return crypto.createHmac(algorithm, secret).update(value).digest('hex');
}

function safeEqualHex(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

function sortedQuery(values: Record<string, string>) {
  return Object.keys(values).sort().map((key) =>
    `${encodeURIComponent(key)}=${encodeURIComponent(values[key])}`,
  ).join('&');
}

function queryStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

const paymentSchema = z.object({
  orderId: z.string().min(1),
  provider: z.enum(['vnpay', 'momo']),
});

router.post('/create', authRequired, validate(paymentSchema), async (req, res) => {
  const orderId = req.body.orderId;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  if (order.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Không có quyền thanh toán đơn này' });
  }
  if (order.paymentMethod !== req.body.provider) {
    return res.status(400).json({ message: 'Phương thức thanh toán không khớp với đơn hàng' });
  }
  if (order.status === 'cancelled' || order.paymentStatus === 'paid') {
    return res.status(400).json({ message: 'Đơn hàng không còn ở trạng thái có thể thanh toán' });
  }

  if (req.body.provider === 'vnpay') {
    requiredEnv('VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET', 'VNPAY_URL', 'VNPAY_RETURN_URL');
    const returnUrl = new URL(process.env.VNPAY_RETURN_URL!);
    returnUrl.searchParams.set('orderId', order.id);
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(now);
    const part = (type: string) => time.find((item) => item.type === type)?.value || '';
    const createDate = `${part('year')}${part('month')}${part('day')}${part('hour')}${part('minute')}${part('second')}`;
    const values: Record<string, string> = {
      vnp_Amount: String(order.total * 100),
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: String(req.ip || '127.0.0.1').replace(/^::ffff:/, '').slice(0, 45),
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl.toString(),
      vnp_TmnCode: process.env.VNPAY_TMN_CODE!,
      vnp_TxnRef: order.id,
      vnp_Version: '2.1.0',
    };
    const query = sortedQuery(values);
    const signature = sign(query, process.env.VNPAY_HASH_SECRET!, 'sha512');
    return res.json({ payUrl: `${process.env.VNPAY_URL}?${query}&vnp_SecureHash=${signature}` });
  }

  requiredEnv('MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY', 'MOMO_ENDPOINT', 'MOMO_REDIRECT_URL', 'MOMO_IPN_URL');
  const amount = String(order.total);
  const requestId = crypto.randomUUID();
  const values = {
    accessKey: process.env.MOMO_ACCESS_KEY!,
    amount,
    extraData: '',
    ipnUrl: process.env.MOMO_IPN_URL!,
    orderId: order.id,
    orderInfo: `Thanh toan don hang ${order.id}`,
    partnerCode: process.env.MOMO_PARTNER_CODE!,
    redirectUrl: (() => {
      const redirectUrl = new URL(process.env.MOMO_REDIRECT_URL!);
      redirectUrl.searchParams.set('orderId', order.id);
      return redirectUrl.toString();
    })(),
    requestId,
    requestType: 'captureWallet',
  };
  const rawSignature = [
    `accessKey=${values.accessKey}`,
    `amount=${values.amount}`,
    `extraData=${values.extraData}`,
    `ipnUrl=${values.ipnUrl}`,
    `orderId=${values.orderId}`,
    `orderInfo=${values.orderInfo}`,
    `partnerCode=${values.partnerCode}`,
    `redirectUrl=${values.redirectUrl}`,
    `requestId=${values.requestId}`,
    `requestType=${values.requestType}`,
  ].join('&');
  const response = await fetch(process.env.MOMO_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, signature: sign(rawSignature, process.env.MOMO_SECRET_KEY!, 'sha256'), lang: 'vi' }),
  });
  const payload = await response.json() as { payUrl?: string; resultCode?: number; message?: string };
  if (!response.ok || payload.resultCode !== 0 || !payload.payUrl) {
    console.error('[MoMo] Không tạo được yêu cầu thanh toán', { status: response.status, resultCode: payload.resultCode });
    throw new BusinessError('MoMo không thể tạo liên kết thanh toán. Vui lòng thử lại sau.', 502);
  }
  res.json({ payUrl: payload.payUrl });
});

async function confirmPayment(orderId: string, amount: number, provider: 'vnpay' | 'momo') {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return 'not-found';
  if (order.paymentMethod !== provider || order.total !== amount) return 'invalid';
  if (order.paymentStatus === 'paid') return 'duplicate';
  if (order.status === 'cancelled') return 'cancelled';
  const result = await prisma.order.updateMany({
    where: { id: orderId, paymentMethod: provider, paymentStatus: 'unpaid', status: { not: 'cancelled' }, total: amount },
    data: { paymentStatus: 'paid', paidAt: new Date() },
  });
  return result.count === 1 ? 'paid' : 'duplicate';
}

router.get('/vnpay/ipn', async (req, res) => {
  requiredEnv('VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET');
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && typeof value === 'string') values[key] = value;
  }
  const signature = queryStringValue(req.query.vnp_SecureHash);
  if (!safeEqualHex(signature, sign(sortedQuery(values), process.env.VNPAY_HASH_SECRET!, 'sha512'))) {
    return res.json({ RspCode: '97', Message: 'Invalid signature' });
  }
  if (queryStringValue(req.query.vnp_TmnCode) !== process.env.VNPAY_TMN_CODE) {
    return res.json({ RspCode: '97', Message: 'Invalid merchant' });
  }
  if (queryStringValue(req.query.vnp_ResponseCode) !== '00'
    || queryStringValue(req.query.vnp_TransactionStatus) !== '00') {
    return res.json({ RspCode: '00', Message: 'Payment not successful; no order update' });
  }
  const result = await confirmPayment(
    queryStringValue(req.query.vnp_TxnRef),
    Number(queryStringValue(req.query.vnp_Amount)) / 100,
    'vnpay',
  );
  if (result === 'paid' || result === 'duplicate') return res.json({ RspCode: '00', Message: 'Confirm Success' });
  if (result === 'not-found') return res.json({ RspCode: '01', Message: 'Order not found' });
  if (result === 'cancelled') return res.json({ RspCode: '02', Message: 'Order cancelled' });
  return res.json({ RspCode: '04', Message: 'Invalid amount or order' });
});

router.post('/momo/ipn', async (req, res) => {
  requiredEnv('MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY');
  const body = req.body as Record<string, unknown>;
  const values = Object.fromEntries(
    ['accessKey', 'amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId']
      .map((key) => [key, String(key === 'accessKey' ? process.env.MOMO_ACCESS_KEY : body[key] ?? '')]),
  );
  const rawSignature = Object.keys(values).sort().map((key) => `${key}=${values[key]}`).join('&');
  const signature = queryStringValue(body.signature);
  if (!safeEqualHex(signature, sign(rawSignature, process.env.MOMO_SECRET_KEY!, 'sha256'))) {
    return res.status(400).json({ resultCode: 97, message: 'Invalid signature' });
  }
  if (String(body.partnerCode) !== process.env.MOMO_PARTNER_CODE) {
    return res.status(400).json({ resultCode: 97, message: 'Invalid merchant' });
  }
  if (String(body.resultCode) !== '0') {
    return res.json({ resultCode: 0, message: 'Payment not successful; no order update' });
  }
  const result = await confirmPayment(String(body.orderId || ''), Number(body.amount), 'momo');
  if (result === 'paid' || result === 'duplicate') return res.json({ resultCode: 0, message: 'Confirm Success' });
  return res.status(result === 'not-found' ? 404 : 400).json({ resultCode: 1, message: 'Order or amount invalid' });
});

export default router;
