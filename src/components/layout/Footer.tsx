import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Category } from '../../types';

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.error);
  }, []);

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
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Youtube"
                className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 transition"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Danh mục</h4>
            <ul className="space-y-2 text-sm">
              {categories.length === 0 ? (
                <li>
                  <Link to="/san-pham" className="hover:text-white transition">
                    Tất cả sản phẩm
                  </Link>
                </li>
              ) : (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/san-pham?category=${cat.id}`} className="hover:text-white transition">
                      {cat.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/gioi-thieu" className="hover:text-white transition">Giới thiệu</Link></li>
              <li><Link to="/lien-he" className="hover:text-white transition">Liên hệ</Link></li>
              <li><Link to="/chinh-sach/doi-tra" className="hover:text-white transition">Chính sách đổi trả</Link></li>
              <li><Link to="/chinh-sach/bao-hanh" className="hover:text-white transition">Chính sách bảo hành</Link></li>
              <li><Link to="/chinh-sach/van-chuyen" className="hover:text-white transition">Chính sách vận chuyển</Link></li>
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
          © {new Date().getFullYear()} TechStore. Bảo lưu mọi quyền.
        </div>
      </div>
    </footer>
  );
}
