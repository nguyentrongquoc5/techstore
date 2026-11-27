import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/format';
import { mediaUrl } from '../../services/api';
import type { Category, Product } from '../../types';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = usePageSize('admin-products-page-size');

  useEffect(() => {
    let active = true;
    setLoading(true);
    productService
      .getAll({
        status: statusFilter,
        page: String(page),
        limit: String(perPage),
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(brandFilter ? { brand: brandFilter } : {}),
        ...(minPrice ? { minPrice } : {}),
        ...(maxPrice ? { maxPrice } : {}),
        sort,
      })
      .then((result) => {
        if (!active) return;
        setProducts(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((error: unknown) => {
        console.error(error);
        showToast(error instanceof Error ? error.message : 'Không tải được sản phẩm', 'error');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [page, perPage, search, categoryFilter, brandFilter, statusFilter, minPrice, maxPrice, sort, showToast]);

  useEffect(() => {
    let active = true;
    Promise.all([productService.getCategories(), productService.getBrands(undefined, 'all')])
      .then(([categoryList, brandList]) => {
        if (!active) return;
        setCategories(categoryList);
        setBrands(brandList);
      })
      .catch((error: unknown) => {
        if (active) showToast(error instanceof Error ? error.message : 'Không tải được bộ lọc', 'error');
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      const nextTotal = total - 1;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / perPage));
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      setPage((current) => Math.min(current, nextTotalPages));
      showToast('Đã xóa sản phẩm', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  if (loading && products.length === 0 && !hasLoaded) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Link to="/admin/san-pham/them" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm sản phẩm..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <select aria-label="Lọc danh mục" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select aria-label="Lọc thương hiệu" value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả thương hiệu</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select aria-label="Lọc trạng thái sản phẩm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đang ẩn</option>
        </select>
        <input aria-label="Giá thấp nhất" type="number" min="0" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Giá từ" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input aria-label="Giá cao nhất" type="number" min="0" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Giá đến" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <select aria-label="Sắp xếp sản phẩm" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name-asc">Tên A–Z</option>
          <option value="name-desc">Tên Z–A</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="stock-asc">Tồn kho tăng dần</option>
          <option value="stock-desc">Tồn kho giảm dần</option>
          <option value="rating">Đánh giá cao nhất</option>
          <option value="bestseller">Bán chạy</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{total} sản phẩm</p>
        <PageSizeSelect
          value={perPage}
          onChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Kho</th>
              <th className="px-4 py-3">TT</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={mediaUrl(p.images?.[0])} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-medium line-clamp-1 max-w-[220px]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(p.salePrice ?? p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.status === 'active' ? 'Hiện' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link to={`/admin/san-pham/${p.id}`} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit size={16} /></Link>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {search || categoryFilter || brandFilter || statusFilter !== 'all' || minPrice || maxPrice
                    ? 'Không tìm thấy sản phẩm phù hợp'
                    : 'Chưa có sản phẩm'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
