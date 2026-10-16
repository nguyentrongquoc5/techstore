import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, ChevronRight } from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/format';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { mediaUrl } from '../services/api';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productService
      .getById(id)
      .then(async (p) => {
        setProduct(p);
        const all = await productService.getAll({ category: p.categoryId });
        setRelated(all.filter((x) => x.id !== p.id).slice(0, 4));
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Không tìm thấy sản phẩm" actionLabel="Về trang sản phẩm" actionTo="/san-pham" />
      </div>
    );
  }

  const price = product.salePrice ?? product.price;
  const images = product.images?.length ? product.images : ['/images/products/placeholder.jpg'];

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
            <img src={mediaUrl(images[activeImg])} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-blue-600' : 'border-transparent'}`}>
                  <img src={mediaUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">{product.brand} · {product.categoryName}</p>
          <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span className="font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.reviewCount} đánh giá) · Còn {product.stock}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <span className="text-3xl font-bold text-blue-600">{formatCurrency(price)}</span>
            {product.salePrice && <span className="ml-3 text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>}
          </div>
          <p className="text-gray-600 text-sm mb-6">{product.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2"><Minus size={16} /></button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2"><Plus size={16} /></button>
            </div>
          </div>
          <button
            onClick={async () => {
              await addItem(product.id, qty);
              showToast('Đã thêm vào giỏ', 'success');
            }}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <ShoppingCart size={20} /> Thêm vào giỏ hàng
          </button>
          {product.specs && typeof product.specs === 'object' && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3">Thông số kỹ thuật</h3>
              <div className="border rounded-xl overflow-hidden">
                {Object.entries(product.specs as Record<string, string>).map(([k, v], i) => (
                  <div key={k} className={`flex px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <span className="w-1/3 text-gray-500">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
