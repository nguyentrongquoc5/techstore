import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatOrderCode } from '../utils/format';
import OrderSummary from '../components/order/OrderSummary';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import type { Order } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function OrderSuccessPage() {
  usePageTitle('Đặt hàng thành công');
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setError(true);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(false);
    orderService
      .getById(id)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        console.error(requestError);
        setOrder(null);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Loading text="Đang tải đơn hàng..." />;

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng không tồn tại hoặc bạn không có quyền xem."
          actionLabel="Về đơn hàng của tôi"
          actionTo="/don-hang"
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mt-2">
          Cảm ơn bạn đã mua sắm. Mã đơn:{' '}
          <span className="font-semibold text-gray-800">{formatOrderCode(order.id)}</span>
        </p>
      </div>

      <OrderSummary order={order} />

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link
          to="/don-hang"
          className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Xem đơn hàng của tôi
        </Link>
        <Link
          to="/san-pham"
          className="flex-1 text-center py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
