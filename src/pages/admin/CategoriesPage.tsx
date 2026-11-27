import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../types';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePageSize('admin-categories-page-size');

  const load = useCallback(async () => {
    try {
      const result = await productService.getCategories();
      setCategories(result);
      setPage((current) => Math.min(current, Math.max(1, Math.ceil(result.length / perPage))));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không tải được danh mục', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, perPage]);

  useEffect(() => { void load(); }, [load]);

  const filteredCategories = categories
    .filter((category) => {
      if (!`${category.name} ${category.description}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (productFilter === 'has-products' && !(category.productCount ?? 0)) return false;
      if (productFilter === 'empty' && (category.productCount ?? 0) > 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name, 'vi');
      if (sort === 'products-desc') return (b.productCount ?? 0) - (a.productCount ?? 0);
      if (sort === 'products-asc') return (a.productCount ?? 0) - (b.productCount ?? 0);
      return a.name.localeCompare(b.name, 'vi');
    });
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / perPage));
  const visibleCategories = filteredCategories.slice((page - 1) * perPage, page * perPage);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setDescription('');
    setFormError('');
  };

  const openCreateForm = () => {
    closeForm();
    setShowForm(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }
    if (trimmedName.length > 100) {
      setFormError('Tên danh mục tối đa 100 ký tự.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await productService.updateCategory(editing.id, {
          name: trimmedName,
          description: description.trim(),
        });
        showToast('Đã cập nhật danh mục', 'success');
      } else {
        await productService.createCategory({
          name: trimmedName,
          description: description.trim(),
        });
        showToast('Đã thêm danh mục', 'success');
      }
      closeForm();
      await load();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể lưu danh mục';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
    setDeletingId(category.id);
    try {
      await productService.deleteCategory(category.id);
      showToast('Đã xóa danh mục', 'success');
      await load();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa danh mục', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && categories.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Danh mục cửa hàng</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="mt-1 text-sm text-gray-500">{categories.length} danh mục đang được quản lý</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={17} /> Thêm danh mục
        </button>
      </header>

      {showForm && (
        <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5" aria-labelledby="category-form-title">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="category-form-title" className="font-semibold text-gray-900">
                {editing ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
              </h2>
              <p className="mt-1 text-xs text-gray-500">Thông tin danh mục sẽ hiển thị trong cửa hàng.</p>
            </div>
            <button type="button" onClick={closeForm} aria-label="Đóng biểu mẫu" className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Tên danh mục
              <input
                autoFocus
                value={name}
                maxLength={100}
                onChange={(event) => { setName(event.target.value); setFormError(''); }}
                placeholder="Ví dụ: Điện thoại"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Mô tả
              <input
                value={description}
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn về danh mục"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Tìm tên hoặc mô tả danh mục..."
            aria-label="Tìm danh mục"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select aria-label="Lọc danh mục theo số sản phẩm" value={productFilter} onChange={(event) => { setProductFilter(event.target.value); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Tất cả danh mục</option>
          <option value="has-products">Có sản phẩm</option>
          <option value="empty">Chưa có sản phẩm</option>
        </select>
        <select aria-label="Sắp xếp danh mục" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="name-asc">Tên A–Z</option>
          <option value="name-desc">Tên Z–A</option>
          <option value="products-desc">Nhiều sản phẩm nhất</option>
          <option value="products-asc">Ít sản phẩm nhất</option>
        </select>
        <p className="text-sm text-gray-500 sm:col-span-2 lg:col-span-3">{filteredCategories.length} kết quả</p>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <FolderOpen size={22} />
          </span>
          <h2 className="mt-4 font-semibold text-gray-900">
            {search || productFilter ? 'Không tìm thấy danh mục' : 'Chưa có danh mục'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {search || productFilter ? 'Thử từ khóa khác hoặc xóa bộ lọc.' : 'Tạo danh mục đầu tiên để sắp xếp sản phẩm.'}
          </p>
          {!search && !productFilter && (
            <button type="button" onClick={openCreateForm} className="mt-4 text-sm font-medium text-blue-600 hover:underline">
              Thêm danh mục
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => (
            <article key={category.id} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FolderOpen size={21} />
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {category.productCount ?? 0} sản phẩm
                </span>
              </div>
              <h2 className="mt-4 truncate text-base font-semibold text-gray-900">{category.name}</h2>
              <p className="mt-1 min-h-10 text-sm leading-5 text-gray-500 line-clamp-2">
                {category.description || 'Chưa có mô tả cho danh mục này.'}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                    setDescription(category.description);
                    setFormError('');
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Edit size={14} /> Sửa
                </button>
                <button
                  type="button"
                  disabled={(category.productCount ?? 0) > 0 || deletingId === category.id}
                  onClick={() => void handleDelete(category)}
                  title={(category.productCount ?? 0) > 0 ? 'Chỉ xóa được danh mục không còn sản phẩm' : 'Xóa danh mục'}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} /> {deletingId === category.id ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <PageSizeSelect value={perPage} onChange={(size) => { setPerPage(size); setPage(1); }} />
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
