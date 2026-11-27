import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../contexts/ToastContext';
import OrderSummary from '../components/order/OrderSummary';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import type { Order } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function OrderDetailPage() {
  usePageTitle('Chi tiết đơn hàng');
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setNotFound(false);
    orderService
      .getById(id)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        console.error(requestError);
        setOrder(null);
        setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleCancel = async () => {
    if (!order || !confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      setOrder(updated);
      showToast('Đã hủy đơn hàng', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Hủy đơn thất bại', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loading text="Đang tải đơn hàng..." />;

  if (notFound || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Đơn không tồn tại hoặc bạn không có quyền xem (403/404)."
          actionLabel="Quay lại danh sách đơn"
          actionTo="/don-hang"
        />
      </div>
    );
  }

  const canCancel = order.paymentStatus !== 'paid' && (order.status === 'pending' || order.status === 'processing');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/don-hang"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Quay lại đơn hàng
        </Link>
        <h1 className="text-2xl font-bold mt-3">Chi tiết đơn hàng</h1>
      </div>

      <OrderSummary order={order} />

      {canCancel && (
        <div className="mt-6">
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        </div>
      )}
    </div>
  );
}
