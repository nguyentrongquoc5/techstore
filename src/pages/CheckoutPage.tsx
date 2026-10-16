import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { orderService } from '../services/orderService';
import { formatCurrency } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import { mediaUrl } from '../services/api';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const shipping = subtotal > 5000000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
    note: '',
    paymentMethod: 'cod' as 'cod' | 'transfer',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Giỏ hàng trống" actionLabel="Mua sắm ngay" actionTo="/san-pham" />
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) e.phone = 'SĐT không hợp lệ';
    if (!form.email.trim()) e.email = 'Email không hợp lệ';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!form.city.trim()) e.city = 'Vui lòng nhập tỉnh/thành';
    if (!form.district.trim()) e.district = 'Vui lòng nhập quận/huyện';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để đặt hàng', 'error');
      navigate('/dang-nhap');
      return;
    }
    setLoading(true);
    try {
      await orderService.createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          productImage: i.product.images?.[0] || '',
          price: i.product.salePrice ?? i.product.price,
          quantity: i.quantity,
        })),
        subtotal,
        discount: 0,
        shippingFee: shipping,
        total,
        paymentMethod: form.paymentMethod,
        shippingInfo: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          district: form.district,
          note: form.note,
        },
      });
      clearCart();
      showToast('Đặt hàng thành công!', 'success');
      navigate('/don-hang');
    } catch (err: any) {
      showToast(err.message || 'Đặt hàng thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold mb-4">Thông tin giao hàng</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'fullName', label: 'Họ và tên' },
                { key: 'phone', label: 'Số điện thoại' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Địa chỉ' },
                { key: 'city', label: 'Tỉnh/Thành phố' },
                { key: 'district', label: 'Quận/Huyện' },
              ].map((f) => (
                <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[f.key] ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold mb-4">Phương thức thanh toán</h3>
            <div className="space-y-2">
              {[
                { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
                { value: 'transfer', label: 'Chuyển khoản ngân hàng' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value={opt.value} checked={form.paymentMethod === opt.value} onChange={() => set('paymentMethod', opt.value)} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-semibold mb-4">Đơn hàng ({items.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((i) => (
                <div key={i.productId} className="flex gap-3 text-sm">
                  <img src={mediaUrl(i.product.images?.[0] || '')} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 font-medium">{i.product.name}</p>
                    <p className="text-gray-500">x{i.quantity}</p>
                  </div>
                  <span className="font-medium">{formatCurrency((i.product.salePrice ?? i.product.price) * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between text-base font-bold pt-1"><span>Tổng cộng</span><span className="text-blue-600">{formatCurrency(total)}</span></div>
            </div>
            <button type="submit" disabled={loading} className="mt-5 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
            <Link to="/gio-hang" className="mt-2 block text-center text-sm text-blue-600 hover:underline">Quay lại giỏ hàng</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
