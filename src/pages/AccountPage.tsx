import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function AccountPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const [info, setInfo] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
  });
  const [pass, setPass] = useState({ old: '', newP: '', confirm: '' });

  if (!user) {
    navigate('/dang-nhap');
    return null;
  }

  const handleInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateProfile(info);
    if (result.success) showToast('Cập nhật thành công', 'success');
    else showToast(result.message || 'Lỗi', 'error');
  };

  const handlePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.newP !== pass.confirm) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    const result = changePassword(pass.old, pass.newP);
    if (result.success) {
      showToast('Đổi mật khẩu thành công', 'success');
      setPass({ old: '', newP: '', confirm: '' });
    } else showToast(result.message || 'Lỗi', 'error');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản của tôi</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('info')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Thông tin cá nhân</button>
        <button onClick={() => setTab('password')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Đổi mật khẩu</button>
      </div>
      {tab === 'info' ? (
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
