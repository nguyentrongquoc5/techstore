import { Link } from 'react-router-dom';
import { Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-white">TechStore</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Cửa hàng thiết bị công nghệ uy tín. Cung cấp laptop, điện thoại, phụ kiện chính hãng với giá tốt nhất.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 transition">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Danh mục</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/san-pham?category=cat-1" className="hover:text-white transition">Laptop</Link></li>
              <li><Link to="/san-pham?category=cat-2" className="hover:text-white transition">Điện thoại</Link></li>
              <li><Link to="/san-pham?category=cat-3" className="hover:text-white transition">Máy tính bảng</Link></li>
              <li><Link to="/san-pham?category=cat-4" className="hover:text-white transition">Màn hình</Link></li>
              <li><Link to="/san-pham?category=cat-7" className="hover:text-white transition">Tai nghe</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/san-pham" className="hover:text-white transition">Sản phẩm</Link></li>
              <li><Link to="/gio-hang" className="hover:text-white transition">Giỏ hàng</Link></li>
              <li><Link to="/don-hang" className="hover:text-white transition">Theo dõi đơn hàng</Link></li>
              <li><Link to="/tai-khoan" className="hover:text-white transition">Tài khoản</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                <span>support@techstore.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © 2025 TechStore. Đồ án môn DevOps – Frontend E-commerce.
        </div>
      </div>
    </footer>
  );
}
