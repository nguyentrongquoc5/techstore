import { useState } from 'react';
import { Copy, Check, CreditCard } from 'lucide-react';
import type { Order } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatOrderCode,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '../../utils/format';
import { BANK_TRANSFER_INFO } from '../../utils/bank';
import { mediaUrl } from '../../services/api';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../contexts/ToastContext';

interface OrderSummaryProps {
  order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<'account' | 'content' | null>(null);
  const [copyError, setCopyError] = useState('');
  const [paying, setPaying] = useState(false);

  const copyText = async (text: string, key: 'account' | 'content') => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error(error);
      setCopyError('Không thể sao chép. Vui lòng sao chép nội dung thủ công.');
    }
  };

  const transferContent = formatOrderCode(order.id);
  const showTransferGuide =
    order.paymentMethod === 'transfer' && order.status !== 'cancelled';
  const payOnline = order.paymentMethod === 'vnpay' || order.paymentMethod === 'momo';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Mã đơn hàng</p>
            <p className="text-lg font-semibold text-gray-900">{formatOrderCode(order.id)}</p>
            <p className="text-sm text-gray-500 mt-1">Đặt lúc {formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOrderStatusColor(order.status)}`}
          >
            {getOrderStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold mb-3">Sản phẩm</h3>
        <div className="space-y-3">
          {(order.items || []).map((item, i) => (
            <div key={`${item.productId}-${i}`} className="flex gap-3">
              <img
                src={mediaUrl(item.productImage)}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{item.productName}</p>
                {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
              <span className="text-sm font-medium shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm space-y-2">
        <h3 className="font-semibold mb-2">Thông tin giao hàng</h3>
        <p>
          <span className="text-gray-500">Người nhận:</span>{' '}
          {order.shippingInfo?.fullName} · {order.shippingInfo?.phone}
        </p>
        <p>
          <span className="text-gray-500">Email:</span> {order.shippingInfo?.email}
        </p>
        <p>
          <span className="text-gray-500">Địa chỉ:</span>{' '}
          {order.shippingInfo?.address}, {order.shippingInfo?.district}, {order.shippingInfo?.city}
        </p>
        {order.shippingInfo?.note && (
          <p>
            <span className="text-gray-500">Ghi chú:</span> {order.shippingInfo.note}
          </p>
        )}
        <p className="pt-1">
          <span className="text-gray-500">Thanh toán:</span>{' '}
          {{
            cod: 'COD (tiền mặt khi nhận)',
            transfer: 'Chuyển khoản ngân hàng',
            vnpay: 'VNPay',
            momo: 'MoMo',
          }[order.paymentMethod]}
        </p>
      </div>

      {payOnline && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
          <p className="text-sm text-indigo-900 mb-3">Đơn hàng chưa thanh toán trực tuyến.</p>
          <button type="button" disabled={paying} onClick={async () => {
            setPaying(true);
            try {
              const { payUrl } = await paymentService.createPayment(order.id, order.paymentMethod as 'vnpay' | 'momo');
              window.location.assign(payUrl);
            } catch (error: unknown) {
              showToast(error instanceof Error ? error.message : 'Không thể tạo liên kết thanh toán', 'error');
              setPaying(false);
            }
          }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60">
            <CreditCard size={16} /> {paying ? 'Đang chuyển...' : 'Thanh toán ngay'}
          </button>
        </div>
      )}

      {payOnline && (
        <p className={`text-sm ${order.paymentStatus === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
          Trạng thái thanh toán: {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </p>
      )}

      {showTransferGuide && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm space-y-3">
          <h3 className="font-semibold text-blue-900">Hướng dẫn chuyển khoản (DEMO)</h3>
          <p className="text-gray-700">{BANK_TRANSFER_INFO.displayLine}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-600">Số tài khoản:</span>
            <span className="font-mono font-medium">{BANK_TRANSFER_INFO.accountNumber}</span>
            <button
              type="button"
              onClick={() => copyText(BANK_TRANSFER_INFO.accountNumber, 'account')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {copied === 'account' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'account' ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <p>
            <span className="text-gray-600">Số tiền:</span>{' '}
            <span className="font-semibold text-blue-700">{formatCurrency(order.total)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-600">Nội dung CK:</span>
            <span className="font-mono font-medium">{transferContent}</span>
            <button
              type="button"
              onClick={() => copyText(transferContent, 'content')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {copied === 'content' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'content' ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          {copyError && <p className="text-xs text-red-600">{copyError}</p>}
          <p className="text-xs text-gray-500">
            Thông tin này chỉ dùng demo, không thực hiện chuyển khoản thật. Vui lòng chuyển đúng số tiền và nội dung để đơn được xác nhận nhanh.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Tạm tính</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Giảm giá
              {order.couponCode ? ` (${order.couponCode})` : ''}
            </span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Phí vận chuyển</span>
          <span>{order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
          <span>Tổng cộng</span>
          <span className="text-blue-600">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {(order.statusLogs?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-3">Lịch sử trạng thái</h3>
          <ol className="space-y-2">
            {order.statusLogs?.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getOrderStatusColor(log.status)}`}
                >
                  {getOrderStatusLabel(log.status)}
                </span>
                <span className="text-gray-400 text-xs">{formatDate(log.createdAt)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
