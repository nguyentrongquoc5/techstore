import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, ChevronRight } from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/format';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = productService.getById(id || '');
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Không tìm thấy sản phẩm" actionLabel="Về trang sản phẩm" actionTo="/san-pham" />
      </div>
    );
  }

  const price = product.salePrice ?? product.price;
  const related = productService
    .getByCategory(product.categoryId)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    addItem(product.id, qty);
    showToast(`Đã thêm ${qty} sản phẩm vào giỏ`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/san-pham" className="hover:text-blue-600">Sản phẩm</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
            <img src={product.images[activeImg] || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-blue-600' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">{product.brand} · {product.categoryName}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span className="font-medium">{product.rating}</span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">{product.reviewCount} đánh giá</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">Còn {product.stock} sản phẩm</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(price)}</span>
              {product.salePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                  <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                    -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-gray-50">
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 hover:bg-gray-50">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <ShoppingCart size={20} /> Thêm vào giỏ hàng
          </button>

          <div className="mt-8">
            <h3 className="font-semibold mb-3">Thông số kỹ thuật</h3>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {Object.entries(product.specs).map(([k, v], i) => (
                <div key={k} className={`flex px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <span className="w-1/3 text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
