import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ForgotPasswordPage() {
  usePageTitle('Quên mật khẩu');
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setDone(true);
      if (res.resetToken) setDevToken(res.resetToken);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold">TechStore</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Chức năng demo: email chưa được gửi thật; liên kết đặt lại hiển thị trong console backend.</p>
        </div>

        {done ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Đây là chức năng demo, hệ thống chưa gửi email thật. Nếu email tồn tại, liên kết đặt lại được ghi trong console backend.
            </p>
            {devToken && (
              <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg break-all text-left">
                <p className="font-medium mb-1">[Dev] Token để test:</p>
                <Link
                  to={`/dat-lai-mat-khau?token=${devToken}`}
                  className="text-blue-600 underline"
                >
                  Đặt lại mật khẩu với token này
                </Link>
              </div>
            )}
            <Link to="/dang-nhap" className="inline-block text-sm text-blue-600 font-medium hover:underline">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@gmail.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
            </button>
            <div className="text-center text-sm text-gray-500">
              <Link to="/dang-nhap" className="text-blue-600 font-medium hover:underline">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
