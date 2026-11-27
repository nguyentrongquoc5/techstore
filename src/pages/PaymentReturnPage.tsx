import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const orderId = params.get('orderId') || params.get('vnp_TxnRef');
    let active = true;
    const resolvePayment = async () => {
      if (!orderId) {
        navigate('/don-hang', { replace: true });
        return;
      }
      const succeeded = params.get('vnp_ResponseCode') === '00' || params.get('resultCode') === '0';
      if (succeeded) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const order = await orderService.getById(orderId);
            if (order.paymentStatus === 'paid') break;
          } catch {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (active) navigate(`/dat-hang-thanh-cong/${encodeURIComponent(orderId)}`, { replace: true });
    };
    void resolvePayment();
    return () => { active = false; };
  }, [navigate, params]);

  return <p className="p-8 text-center text-gray-600">Đang kiểm tra kết quả thanh toán...</p>;
}
