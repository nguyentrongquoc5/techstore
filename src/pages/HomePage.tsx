import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, Headphones } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { productService } from '../services/productService';

export default function HomePage() {
  const featured = productService.getFeatured().slice(0, 8);
  const bestSellers = productService.getBestSellers().slice(0, 8);
  const categories = productService.getCategories();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Công nghệ đỉnh cao,<br />Giá tốt mỗi ngày
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Laptop, điện thoại, phụ kiện chính hãng. Giao hàng nhanh toàn quốc.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/san-pham"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
              >
                Mua ngay <ArrowRight size={18} />
              </Link>
              <Link
                to="/san-pham?category=cat-1"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                Laptop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: Truck, title: 'Giao hàng nhanh', desc: 'Toàn quốc 1-3 ngày' },
            { icon: Shield, title: 'Chính hãng 100%', desc: 'Bảo hành đầy đủ' },
            { icon: Zap, title: 'Giá tốt nhất', desc: 'Khuyến mãi mỗi ngày' },
            { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Tư vấn tận tâm' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <f.icon size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Danh mục sản phẩm</h2>
          <Link to="/san-pham" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/san-pham?category=${cat.id}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition text-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {cat.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-gray-700 line-clamp-2">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
          <Link to="/san-pham" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Khuyến mãi lớn tháng này</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Giảm đến 30% cho laptop gaming và smartphone cao cấp. Số lượng có hạn!
          </p>
          <Link
            to="/san-pham"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Khám phá ngay <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Best sellers */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm bán chạy</h2>
          <Link to="/san-pham" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
