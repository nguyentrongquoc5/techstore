import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

type AdminReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  product: { id: string; name: string };
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" title={`${rating} sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [perPage, setPerPage] = usePageSize('admin-reviews-page-size');

  const load = useCallback((nextPage = 1, nextRating = ratingFilter, nextQ = q) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(nextPage), limit: String(perPage) };
    if (nextRating) params.rating = nextRating;
    if (nextQ.trim()) params.q = nextQ.trim();
    params.sort = sort;

    reviewService.listAll(params)
      .then((result) => {
        setItems(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((e: unknown) => {
        console.error(e);
        showToast(e instanceof Error ? e.message : 'Không tải được đánh giá', 'error');
      })
      .finally(() => setLoading(false));
  }, [q, ratingFilter, showToast, sort, perPage]);

  useEffect(() => {
    load(1, ratingFilter, q);
  }, [load, q, ratingFilter, sort]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQ(value);
      setPage(1);
    }, 400);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await reviewService.remove(id);
      showToast('Đã xóa đánh giá', 'success');
      load(items.length === 1 && page > 1 ? page - 1 : page, ratingFilter, q);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa thất bại', 'error');
    }
  };

  if (loading && items.length === 0) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="search"
          value={qInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo nội dung, sản phẩm, người dùng..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={String(rating)}>{rating} sao</option>
          ))}
        </select>
        <select
          aria-label="Sắp xếp đánh giá"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="rating-desc">Nhiều sao nhất</option>
          <option value="rating-asc">Ít sao nhất</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {items.length === 0 && !loading ? (
          <p className="p-8 text-center text-gray-500 text-sm">Không có đánh giá nào.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Số sao</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((review) => (
                <tr key={review.id} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3">
                    <Link
                      to={`/san-pham/${review.product.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {review.product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{review.user.fullName}</div>
                    <div className="text-xs text-gray-500">{review.user.email}</div>
                  </td>
                  <td className="px-4 py-3"><Stars rating={review.rating} /></td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">
                      {review.comment || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      className="inline-flex items-center gap-1 text-red-600 text-xs hover:underline"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <PageSizeSelect
          value={perPage}
          onChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => load(nextPage, ratingFilter, q)}
      />
    </div>
  );
}
