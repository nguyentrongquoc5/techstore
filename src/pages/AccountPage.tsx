import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { addressService, type AddressInput } from '../services/addressService';
import type { Address } from '../types';
import { isValidVietnamPhone } from '../utils/phone';

export default function AccountPage() {
  usePageTitle('Tài khoản');
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'addresses' | 'password'>('info');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<AddressInput>({
    label: 'Nhà riêng',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: '',
    district: '',
    city: '',
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [info, setInfo] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
  });
  const [pass, setPass] = useState({ old: '', newP: '', confirm: '' });

  useEffect(() => {
    addressService.list().then(setAddresses).catch((error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Không tải được sổ địa chỉ', 'error');
    });
  }, [showToast]);

  if (!user) {
    navigate('/dang-nhap');
    return null;
  }

  const handleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (info.phone && !isValidVietnamPhone(info.phone)) {
      showToast('Số điện thoại không hợp lệ', 'error');
      return;
    }
    const result = await updateProfile(info);
    if (result.success) showToast('Cập nhật thành công', 'success');
    else showToast(result.message || 'Lỗi', 'error');
  };

  const handlePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.newP !== pass.confirm) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    const result = await changePassword(pass.old, pass.newP);
    if (result.success) {
      showToast('Đổi mật khẩu thành công', 'success');
      setPass({ old: '', newP: '', confirm: '' });
    } else showToast(result.message || 'Lỗi', 'error');
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidVietnamPhone(addressForm.phone)) {
      showToast('Số điện thoại không hợp lệ', 'error');
      return;
    }
    try {
      const saved = editingAddressId
        ? await addressService.update(editingAddressId, addressForm)
        : await addressService.create(addressForm);
      setAddresses((current) => {
        const next = editingAddressId
          ? current.map((address) => address.id === saved.id ? saved : address)
          : [...current, saved];
        return saved.isDefault ? next.map((address) => ({ ...address, isDefault: address.id === saved.id })) : next;
      });
      setEditingAddressId(null);
      setAddressForm({
        label: 'Nhà riêng',
        fullName: user.fullName,
        phone: user.phone,
        address: '',
        district: '',
        city: '',
        isDefault: false,
      });
      showToast('Đã lưu địa chỉ', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu địa chỉ', 'error');
    }
  };

  const removeAddress = async (address: Address) => {
    try {
      await addressService.remove(address.id);
      const next = await addressService.list();
      setAddresses(next);
      showToast('Đã xóa địa chỉ', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa địa chỉ', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản của tôi</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('info')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Thông tin cá nhân</button>
        <button onClick={() => setTab('addresses')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'addresses' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Sổ địa chỉ</button>
        <button onClick={() => setTab('password')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Đổi mật khẩu</button>
      </div>
      {tab === 'addresses' ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{address.fullName} · {address.phone} {address.isDefault && <span className="ml-2 text-xs text-blue-600">Mặc định</span>}</p>
                  <p className="text-sm text-gray-600">{address.label} · {address.address}, {address.district}, {address.city}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button type="button" onClick={() => { setEditingAddressId(address.id); setAddressForm({ ...address }); }} className="text-blue-600">Sửa</button>
                  <button type="button" onClick={() => void removeAddress(address)} className="text-red-600">Xóa</button>
                </div>
              </div>
            ))}
            {!addresses.length && <p className="text-sm text-gray-500">Chưa có địa chỉ giao hàng.</p>}
          </div>
          <form onSubmit={saveAddress} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold">{editingAddressId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                ['label', 'Tên gợi nhớ'],
                ['fullName', 'Người nhận'],
                ['phone', 'Số điện thoại'],
                ['address', 'Địa chỉ'],
                ['district', 'Quận/Huyện'],
                ['city', 'Tỉnh/Thành phố'],
              ] as const).map(([key, label]) => (
                <label key={key} className="text-sm">
                  {label}
                  <input required value={addressForm[key]} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
              Đặt làm địa chỉ mặc định
            </label>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingAddressId ? 'Cập nhật' : 'Thêm địa chỉ'}</button>
              {editingAddressId && <button type="button" onClick={() => setEditingAddressId(null)} className="px-4 py-2 border rounded-lg">Hủy</button>}
            </div>
          </form>
        </div>
      ) : tab === 'info' ? (
        <form onSubmit={handleInfo} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={user.email} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50" />
          </div>
          {[{ key: 'fullName', label: 'Họ và tên' }, { key: 'phone', label: 'Số điện thoại' }, { key: 'address', label: 'Địa chỉ' }, { key: 'city', label: 'Tỉnh/Thành phố' }, { key: 'district', label: 'Quận/Huyện' }].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input value={(info as any)[f.key]} onChange={(e) => setInfo({ ...info, [f.key]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Lưu thay đổi</button>
            <button type="button" onClick={() => { logout(); navigate('/'); }} className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Đăng xuất</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePass} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          {[{ key: 'old', label: 'Mật khẩu cũ' }, { key: 'newP', label: 'Mật khẩu mới' }, { key: 'confirm', label: 'Xác nhận mật khẩu mới' }].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type="password" value={(pass as any)[f.key]} onChange={(e) => setPass({ ...pass, [f.key]: e.target.value })} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Đổi mật khẩu</button>
        </form>
      )}
    </div>
  );
}
