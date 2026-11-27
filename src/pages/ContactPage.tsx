import { useState, type FormEvent } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../contexts/ToastContext';
import { contactService } from '../services/contactService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  usePageTitle('Liên hệ');
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; message?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ tên';
    if (!email.trim()) next.email = 'Vui lòng nhập email';
    else if (!emailRegex.test(email.trim())) next.email = 'Email không hợp lệ';
    if (!message.trim()) next.message = 'Vui lòng nhập nội dung';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await contactService.submit({ fullName, email, message });
      showToast(result.message, 'success');
      setFullName('');
      setEmail('');
      setMessage('');
      setErrors({});
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể gửi liên hệ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Liên hệ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Thông tin cửa hàng</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-blue-600" />
              <span>1900 1234</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-blue-600" />
              <span>support@techstore.vn</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <span>Thứ 2 – Thứ 7: 8:00 – 20:00 · Chủ nhật: 9:00 – 18:00</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Gửi tin nhắn</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"
                placeholder="Nội dung cần hỗ trợ..."
              />
              {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {submitting ? 'Đang gửi...' : 'Gửi liên hệ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
