import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { couponService } from '../../services/couponService';
import { useToast } from '../../contexts/ToastContext';
import type { Coupon } from '../../types';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/format';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

const emptyForm = {
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [perPage, setPerPage] = usePageSize('admin-coupons-page-size');
  const filteredCoupons = useMemo(() => coupons
    .filter((coupon) => {
      if (search.trim() && !coupon.code.toLowerCase().includes(search.trim().toLowerCase())) return false;
      const expired = coupon.expiresAt != null && new Date(coupon.expiresAt).getTime() < Date.now();
      if (statusFilter === 'active' && (!coupon.isActive || expired)) return false;
      if (statusFilter === 'inactive' && coupon.isActive) return false;
      if (statusFilter === 'expired' && !expired) return false;
      if (typeFilter && coupon.type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'code-asc') return a.code.localeCompare(b.code);
      if (sort === 'code-desc') return b.code.localeCompare(a.code);
      if (sort === 'usage-desc') return b.usedCount - a.usedCount;
      if (sort === 'expiry-asc') {
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return a.expiresAt.localeCompare(b.expiresAt);
      }
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    }), [coupons, search, statusFilter, typeFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / perPage));
  const visibleCoupons = filteredCoupons.slice((page - 1) * perPage, page * perPage);

  const load = () =>
    couponService
      .getAll()
      .then((result) => {
        setCoupons(result);
        setPage((current) => Math.min(current, Math.max(1, Math.ceil(result.length / perPage))));
      })
      .catch((error: unknown) => {
        console.error(error);
        showToast(error instanceof Error ? error.message : 'Không tải được mã giảm giá', 'error');
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, sort]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: String(c.minOrder),
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) {
      showToast('Vui lòng nhập mã và giá trị', 'error');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: form.type !== 'percent' || form.maxDiscount === '' ? null : Number(form.maxDiscount),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await couponService.update(editing.id, payload);
        showToast('Cập nhật mã thành công', 'success');
      } else {
        await couponService.create(payload);
        showToast('Thêm mã thành công', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await couponService.update(c.id, { isActive: !c.isActive });
      showToast(c.isActive ? 'Đã tắt mã' : 'Đã bật mã', 'success');
      load();
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa mã giảm giá này?')) return;
    try {
      await couponService.remove(id);
      showToast('Đã xóa', 'success');
      load();
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          <Plus size={16} /> Thêm mã
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã giảm giá..." className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" />
        </div>
        <select aria-label="Lọc trạng thái mã giảm giá" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã tắt</option>
          <option value="expired">Đã hết hạn</option>
        </select>
        <select aria-label="Lọc loại mã giảm giá" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả loại mã</option>
          <option value="percent">Phần trăm</option>
          <option value="fixed">Số tiền cố định</option>
        </select>
        <select aria-label="Sắp xếp mã giảm giá" value={sort} onChange={(e) => setSort(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="code-asc">Mã A–Z</option>
          <option value="code-desc">Mã Z–A</option>
          <option value="expiry-asc">Sắp hết hạn</option>
          <option value="usage-desc">Dùng nhiều nhất</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">{filteredCoupons.length} mã giảm giá</p>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã (viết hoa)</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="GIAM10"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá trị</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder={form.type === 'percent' ? '10' : '50000'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn tối thiểu (VND)</label>
              <input
                type="number"
                value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giảm tối đa (chỉ % , để trống = không giới hạn)</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={form.type !== 'percent'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giới hạn lượt dùng (để trống = không giới hạn)</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hết hạn</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Đang hoạt động
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              Lưu
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Giá trị</th>
              <th className="px-4 py-3">Đơn tối thiểu</th>
              <th className="px-4 py-3">Đã dùng</th>
              <th className="px-4 py-3">Hết hạn</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibleCoupons.map((c) => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.type === 'percent' ? 'Phần trăm' : 'Cố định'}</td>
                <td className="px-4 py-3">
                  {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value)}
                  {c.maxDiscount != null && c.type === 'percent' && (
                    <span className="text-xs text-gray-400 block">tối đa {formatCurrency(c.maxDiscount)}</span>
                  )}
                </td>
                <td className="px-4 py-3">{formatCurrency(c.minOrder)}</td>
                <td className="px-4 py-3">
                  {c.usedCount}
                  {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.expiresAt ? formatDate(c.expiresAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.isActive ? 'Đang bật' : 'Đã tắt'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleCoupons.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  {coupons.length === 0 ? 'Chưa có mã giảm giá' : 'Không tìm thấy mã phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <PageSizeSelect value={perPage} onChange={(size) => { setPerPage(size); setPage(1); }} />
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
