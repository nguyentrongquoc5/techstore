import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { productService } from '../services/productService';
import type { Product, Category } from '../types';

const PER_PAGE = 12;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilter, setMobileFilter] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (sort) params.sort = sort === 'newest' ? '' : sort;
    productService
      .getAll(params)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, category, brand, sort]);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => setSearchInput(q), [q]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const totalPages = Math.ceil(products.length / PER_PAGE) || 1;
  const paged = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-sm mb-2">Danh mục</h4>
        <div className="space-y-1">
          <button onClick={() => updateParam('category', '')} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${!category ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Tất cả</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => updateParam('category', c.id)} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${category === c.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-2">Thương hiệu</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button onClick={() => updateParam('brand', '')} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${!brand ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Tất cả</button>
          {brands.map((b) => (
            <button key={b} onClick={() => updateParam('brand', b)} className={`block w-full text-left px-2 py-1.5 rounded text-sm ${brand === b ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{b}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm {q && <span className="text-gray-500 font-normal text-lg">· "{q}"</span>}</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); updateParam('q', searchInput); }} className="relative flex-1 sm:w-64">
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></button>
          </form>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="rating">Đánh giá cao</option>
            <option value="bestseller">Bán chạy</option>
          </select>
          <button onClick={() => setMobileFilter(true)} className="lg:hidden p-2 border border-gray-200 rounded-lg"><SlidersHorizontal size={18} /></button>
        </div>
      </div>
      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24"><FilterPanel /></div>
        </aside>
        <div className="flex-1 min-w-0">
          {loading ? <Loading /> : (
            <>
              <p className="text-sm text-gray-500 mb-4">{products.length} sản phẩm</p>
              {paged.length === 0 ? (
                <EmptyState title="Không tìm thấy sản phẩm" actionLabel="Xem tất cả" actionTo="/san-pham" />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paged.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => updateParam('page', String(p))} />
                </>
              )}
            </>
          )}
        </div>
      </div>
      {mobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Bộ lọc</h3><button onClick={() => setMobileFilter(false)}><X size={20} /></button></div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
