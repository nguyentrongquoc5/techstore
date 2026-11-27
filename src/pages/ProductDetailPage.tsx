import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, ChevronRight, Heart, Pencil, Trash2 } from 'lucide-react';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatCurrency } from '../utils/format';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { mediaUrl } from '../services/api';
import type { Product, Review } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isWishlisted, toggle } = useWishlist();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewBlockedMsg, setReviewBlockedMsg] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  usePageTitle(product?.name);

  const loadReviews = (productId: string, page = 1) => {
    return reviewService
      .list(productId, page, 5)
      .then((response) => {
        setReviews(response.items);
        setReviewTotal(response.total);
        setReviewPage(response.page);
        setReviewTotalPages(response.totalPages);
        setProduct((current) =>
          current ? { ...current, rating: response.rating, reviewCount: response.reviewCount } : current
        );
      })
      .catch(() => setReviews([]));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setReviewBlockedMsg('');
    productService
      .getById(id)
      .then(async (p) => {
        setProduct(p);
        setSelectedVariantId(p.variants?.find((variant) => variant.isActive)?.id || '');
        const all = await productService.getAll({ category: p.categoryId, limit: '8' });
        setRelated(all.items.filter((x) => x.id !== p.id).slice(0, 4));
        await loadReviews(p.id, 1);
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

  const selectedVariant = product.variants?.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price ?? product.salePrice ?? product.price;
  const availableStock = selectedVariant?.stock ?? product.stock;
  const images = product.images?.length ? product.images : ['/images/products/placeholder.svg'];

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
            <img
              src={mediaUrl(images[activeImg])}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(event) => {
                if (!event.currentTarget.src.includes('/placeholder.svg')) {
                  event.currentTarget.src = mediaUrl('');
                }
              }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-blue-600' : 'border-transparent'}`}>
                  <img
                    src={mediaUrl(img)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      if (!event.currentTarget.src.includes('/placeholder.svg')) {
                        event.currentTarget.src = mediaUrl('');
                      }
                    }}
                  />
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
          {!!product.variants?.length && (
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Màu sắc / cấu hình</label>
              <select value={selectedVariantId} onChange={(event) => { setSelectedVariantId(event.target.value); setQty(1); }} className="w-full max-w-md px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                {product.variants.filter((variant) => variant.isActive).map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {[variant.color, variant.configuration].filter(Boolean).join(' · ') || variant.sku} · {formatCurrency(variant.price ?? product.salePrice ?? product.price)} · Còn {variant.stock}
                  </option>
                ))}
              </select>
              {!selectedVariant && <p className="text-xs text-red-600 mt-1">Sản phẩm hiện không có biến thể khả dụng.</p>}
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2" disabled={availableStock <= 0}><Minus size={16} /></button>
              <span className="w-12 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(availableStock, qty + 1))} className="p-2" disabled={availableStock <= 0 || qty >= availableStock}><Plus size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!isAuthenticated) {
                  showToast('Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng', 'info');
                  navigate('/dang-nhap', {
                    state: { from: `${location.pathname}${location.search}` },
                  });
                  return;
                }
                try {
                  await addItem(product.id, qty, selectedVariant?.id);
                  showToast('Đã thêm vào giỏ', 'success');
                } catch (error: unknown) {
                  showToast(error instanceof Error ? error.message : 'Không thể thêm vào giỏ', 'error');
                }
              }}
              disabled={availableStock <= 0 || (!!product.variants?.length && !selectedVariant)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={20} /> {availableStock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            </button>
            <button
              onClick={async () => {
                if (!isAuthenticated) {
                  showToast('Vui lòng đăng nhập để thêm yêu thích', 'info');
                  return;
                }
                const liked = isWishlisted(product.id);
                try {
                  await toggle(product.id);
                  showToast(liked ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích', 'success');
                } catch {
                  showToast('Không thể cập nhật yêu thích', 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              title={isWishlisted(product.id) ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            >
              <Heart
                size={20}
                className={isWishlisted(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-500'}
              />
            </button>
          </div>
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
      <section className="mb-12 border-t pt-8">
        <h2 className="text-xl font-bold mb-4">
          Đánh giá ({reviewTotal || product.reviewCount}) · {product.rating}/5
        </h2>

        {isAuthenticated ? (
          <div ref={reviewFormRef} className="bg-white border rounded-xl p-4 mb-6 space-y-3">
            <p className="text-sm font-medium">Viết đánh giá của bạn</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setMyRating(star)} className="p-0.5" aria-label={`${star} sao`}>
                  <Star size={22} className={star <= myRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={myComment}
              onChange={(event) => setMyComment(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Chia sẻ trải nghiệm sản phẩm..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {reviewBlockedMsg && <p className="text-sm text-amber-600">{reviewBlockedMsg}</p>}
            <button
              type="button"
              disabled={reviewSubmitting}
              onClick={async () => {
                if (!id) return;
                setReviewSubmitting(true);
                setReviewBlockedMsg('');
                try {
                  if (editingReviewId) {
                    await reviewService.update(editingReviewId, { rating: myRating, comment: myComment });
                    showToast('Đã cập nhật đánh giá', 'success');
                  } else {
                    await reviewService.create(id, { rating: myRating, comment: myComment });
                    showToast('Đã gửi đánh giá', 'success');
                  }
                  setEditingReviewId(null);
                  setMyComment('');
                  setMyRating(5);
                  await loadReviews(id, 1);
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Không gửi được đánh giá';
                  setReviewBlockedMsg(message);
                  showToast(message, 'error');
                } finally {
                  setReviewSubmitting(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {reviewSubmitting ? 'Đang lưu...' : editingReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
            {editingReviewId && (
              <button type="button" onClick={() => { setEditingReviewId(null); setMyComment(''); setMyRating(5); }} className="ml-2 px-4 py-2 border rounded-lg text-sm">
                Hủy sửa
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            <Link to="/dang-nhap" className="text-blue-600 hover:underline">Đăng nhập</Link> để viết đánh giá.
          </p>
        )}

        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-sm text-gray-400">Chưa có đánh giá nào.</p>}
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{review.userName}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={12} className={index < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                  ))}
                </span>
                </div>
                {user?.id === review.userId && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      setEditingReviewId(review.id);
                      setMyRating(review.rating);
                      setMyComment(review.comment);
                      reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }} className="text-blue-600" aria-label="Sửa đánh giá">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={async () => {
                      if (!id || !window.confirm('Xóa đánh giá này?')) return;
                      try {
                        await reviewService.remove(review.id);
                        if (editingReviewId === review.id) setEditingReviewId(null);
                        await loadReviews(id, reviewPage);
                        showToast('Đã xóa đánh giá', 'success');
                      } catch (error: unknown) {
                        showToast(error instanceof Error ? error.message : 'Không thể xóa đánh giá', 'error');
                      }
                    }} className="text-red-600" aria-label="Xóa đánh giá">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          ))}
        </div>
        {reviewTotalPages > 1 && (
          <div className="flex gap-2 mt-4">
            <button type="button" disabled={reviewPage <= 1} onClick={() => id && loadReviews(id, reviewPage - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">
              Trước
            </button>
            <span className="text-sm text-gray-500 self-center">{reviewPage}/{reviewTotalPages}</span>
            <button type="button" disabled={reviewPage >= reviewTotalPages} onClick={() => id && loadReviews(id, reviewPage + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-40">
              Sau
            </button>
          </div>
        )}
      </section>

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
