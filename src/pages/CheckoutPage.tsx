import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { orderService } from '../services/orderService';
import { couponService } from '../services/couponService';
import { formatCurrency } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import { mediaUrl } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { paymentService } from '../services/paymentService';
import { addressService } from '../services/addressService';
import type { Address } from '../types';

export default function CheckoutPage() {
  usePageTitle('Thanh toán');
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedSubtotal, setAppliedSubtotal] = useState<number | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const shipping = subtotal > 5000000 || subtotal === 0 ? 0 : 30000;
  const currentDiscount = appliedSubtotal === subtotal ? discount : 0;
  const couponUpdating = couponLoading || (!!appliedCode && appliedSubtotal !== subtotal);
  const total = Math.max(0, subtotal - currentDiscount + shipping);

  useEffect(() => {
    if (!appliedCode || appliedSubtotal === subtotal) return;
    let active = true;
    const changedSubtotal = subtotal;
    setCouponLoading(true);
    couponService.validate(appliedCode, changedSubtotal)
      .then((result) => {
        if (!active) return;
        setDiscount(result.discount);
        setAppliedSubtotal(changedSubtotal);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAppliedCode('');
        setCouponInput('');
        setDiscount(0);
        setAppliedSubtotal(null);
        showToast(
          error instanceof Error ? `Mã giảm giá đã bị gỡ: ${error.message}` : 'Mã giảm giá không còn áp dụng được',
          'info',
        );
      })
      .finally(() => {
        if (active) setCouponLoading(false);
      });
    return () => { active = false; };
  }, [appliedCode, appliedSubtotal, showToast, subtotal]);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
    note: '',
    paymentMethod: 'cod' as 'cod' | 'transfer' | 'vnpay' | 'momo',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    addressService.list().then((addresses) => {
      setSavedAddresses(addresses);
      const defaultAddress = addresses.find((address) => address.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setForm((current) => ({
          ...current,
          fullName: defaultAddress.fullName,
          phone: defaultAddress.phone,
          address: defaultAddress.address,
          district: defaultAddress.district,
          city: defaultAddress.city,
        }));
      }
    }).catch((error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Không tải được sổ địa chỉ', 'error');
    });
  }, [isAuthenticated, showToast]);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Giỏ hàng trống" actionLabel="Mua sắm ngay" actionTo="/san-pham" />
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    const vnPhoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.phone.trim() || !vnPhoneRegex.test(form.phone.trim())) {
      e.phone = 'Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc +84, 10-11 chữ số)';
    }
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      e.email = 'Email không hợp lệ';
    }
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!form.city.trim()) e.city = 'Vui lòng nhập tỉnh/thành';
    if (!form.district.trim()) e.district = 'Vui lòng nhập quận/huyện';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      showToast('Vui lòng nhập mã giảm giá', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để dùng mã giảm giá', 'error');
      navigate('/dang-nhap');
      return;
    }
    setCouponLoading(true);
    const couponSubtotal = subtotal;
    try {
      const result = await couponService.validate(code, couponSubtotal);
      setAppliedCode(result.code);
      setDiscount(result.discount);
      setAppliedSubtotal(couponSubtotal);
      showToast(`Áp dụng mã ${result.code}: -${formatCurrency(result.discount)}`, 'success');
    } catch (err: any) {
      setAppliedCode('');
      setDiscount(0);
      setAppliedSubtotal(null);
      showToast(err.message || 'Mã không hợp lệ', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setCouponInput('');
    setAppliedCode('');
    setDiscount(0);
    setAppliedSubtotal(null);
    setCouponLoading(false);
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
      const order = await orderService.createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          productImage: i.product.images?.[0] || '',
          price: i.variant?.price ?? i.product.salePrice ?? i.product.price,
          quantity: i.quantity,
          variantId: i.variantId,
          variantName: i.variant ? [i.variant.color, i.variant.configuration].filter(Boolean).join(' · ') : undefined,
        })),
        subtotal,
        discount,
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
        couponCode: appliedCode || undefined,
      });
      clearCart();
      if (order.emailSent === false) {
        showToast('Đơn đã được tạo; email xác nhận chưa gửi được (cần cấu hình SMTP).', 'info');
      }
      if (form.paymentMethod === 'vnpay' || form.paymentMethod === 'momo') {
        try {
          const payment = await paymentService.createPayment(order.id, form.paymentMethod);
          window.location.assign(payment.payUrl);
          return;
        } catch (paymentError: unknown) {
          showToast(
            paymentError instanceof Error
              ? `Đơn đã được tạo nhưng chưa mở được cổng thanh toán: ${paymentError.message}`
              : 'Đơn đã được tạo nhưng chưa mở được cổng thanh toán',
            'error',
          );
        }
      } else {
        showToast('Đặt hàng thành công!', 'success');
      }
      navigate(`/dat-hang-thanh-cong/${order.id}`);
    } catch (err: any) {
      showToast(err.message || 'Đặt hàng thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) => {
    if (['fullName', 'phone', 'address', 'city', 'district'].includes(key)) {
      setSelectedAddressId('');
    }
    setForm((f) => ({ ...f, [key]: value }));
  };
  const hasUnavailableItems = items.some(
    (item) => item.product.status !== 'active'
      || (item.variantId ? !item.variant || !item.variant.isActive || item.quantity > item.variant.stock : item.quantity > item.product.stock),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold mb-4">Thông tin giao hàng</h3>
            {savedAddresses.length > 0 && (
              <label className="block text-sm mb-4">
                Chọn địa chỉ đã lưu
                <select value={selectedAddressId} onChange={(event) => {
                  const address = savedAddresses.find((entry) => entry.id === event.target.value);
                  setSelectedAddressId(address?.id || '');
                  if (address) setForm((current) => ({
                      ...current,
                      fullName: address.fullName,
                      phone: address.phone,
                      address: address.address,
                      district: address.district,
                      city: address.city,
                    }));
                }} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg">
                  <option value="">Nhập địa chỉ khác</option>
                  {savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.address}, {address.city}{address.isDefault ? ' (mặc định)' : ''}</option>)}
                </select>
              </label>
            )}
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
                { value: 'vnpay', label: 'Thanh toán trực tuyến VNPay' },
                { value: 'momo', label: 'Ví điện tử MoMo' },
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
                <div key={`${i.productId}:${i.variantId || ''}`} className="flex gap-3 text-sm">
                  <img src={mediaUrl(i.product.images?.[0] || '')} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 font-medium">{i.product.name}</p>
                    {i.variant && <p className="text-xs text-gray-500">{[i.variant.color, i.variant.configuration].filter(Boolean).join(' · ')}</p>}
                    <p className="text-gray-500">x{i.quantity}</p>
                  </div>
                  <span className="font-medium">{formatCurrency((i.variant?.price ?? i.product.salePrice ?? i.product.price) * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Mã giảm giá</label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="VD: GIAM10"
                  disabled={!!appliedCode}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
                {appliedCode ? (
                  <button type="button" onClick={handleClearCoupon} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
                    Xóa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 disabled:opacity-60"
                  >
                    {couponLoading ? '...' : 'Áp dụng'}
                  </button>
                )}
              </div>
              {appliedCode && (
                <p className={`text-xs ${couponUpdating ? 'text-gray-500' : 'text-green-600'}`}>
                  {couponUpdating ? 'Đang cập nhật mã...' : `Đã áp dụng: ${appliedCode}`}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
              {currentDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedCode})</span>
                  <span>-{formatCurrency(currentDiscount)}</span>
                </div>
              )}
              {hasUnavailableItems && (
                <p className="text-xs text-red-600">
                  Có sản phẩm không đủ tồn kho hoặc đã ngừng bán. Vui lòng quay lại giỏ hàng.
                </p>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between text-base font-bold pt-1"><span>Tổng cộng</span><span className="text-blue-600">{formatCurrency(total)}</span></div>
            </div>
            <button type="submit" disabled={loading || couponUpdating || hasUnavailableItems} className="mt-5 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
            <Link to="/gio-hang" className="mt-2 block text-center text-sm text-blue-600 hover:underline">Quay lại giỏ hàng</Link>
          </div>
        </div>
      </form>
    </div>
  );
}