import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, GitCompareArrows } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { mediaUrl } from '../../services/api';
import { useCompare } from '../../contexts/CompareContext';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const compare = useCompare();
  const liked = isWishlisted(product.id);
  const price = product.salePrice ?? product.price;
  const hasVariants = Boolean(product.variants?.length);
  const hasAvailableVariant = product.variants?.some((variant) => variant.isActive && variant.stock > 0) ?? false;
  const unavailable = hasVariants ? !hasAvailableVariant : product.stock <= 0;
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const image = mediaUrl(product.images?.[0] || '');

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      navigate(`/san-pham/${product.id}`);
      return;
    }
    try {
      await addItem(product.id, 1);
      showToast('Đã thêm vào giỏ hàng', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm yêu thích', 'info');
      return;
    }
    try {
      await toggle(product.id);
      showToast(liked ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích', 'success');
    } catch {
      showToast('Không thể cập nhật yêu thích', 'error');
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const added = compare.toggle(product.id);
      showToast(added ? 'Đã thêm vào danh sách so sánh' : 'Đã bỏ khỏi danh sách so sánh', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm sản phẩm', 'error');
    }
  };

  return (
    <Link
      to={`/san-pham/${product.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.includes('/placeholder.svg')) {
              e.currentTarget.src = mediaUrl('');
            }
          }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-{discount}%</span>
        )}
        {product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded">Bán chạy</span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition"
          title={liked ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        >
          <Heart size={16} className={liked ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
        </button>
        <button
          onClick={handleCompare}
          className="absolute bottom-2 left-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition"
          title={compare.has(product.id) ? 'Bỏ khỏi so sánh' : 'So sánh sản phẩm'}
        >
          <GitCompareArrows size={16} className={compare.has(product.id) ? 'text-blue-600' : 'text-gray-500'} />
        </button>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{product.brand} · {product.categoryName}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <span className="text-xs text-gray-600">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-bold text-blue-600">{formatCurrency(price)}</p>
            {product.salePrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>}
          </div>
          <button
            onClick={handleAdd}
            disabled={unavailable}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={unavailable ? 'Hết hàng' : hasVariants ? 'Chọn biến thể' : 'Thêm vào giỏ'}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
