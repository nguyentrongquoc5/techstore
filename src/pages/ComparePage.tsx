import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { formatCurrency } from '../utils/format';
import { mediaUrl } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ComparePage() {
  usePageTitle('So sánh sản phẩm');
  const { productIds, toggle, clear } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all(productIds.map((id) => productService.getById(id)))
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productIds]);

  const rows: Array<[string, (product: Product) => string]> = [
    ['Thương hiệu', (product) => product.brand],
    ['Danh mục', (product) => product.categoryName],
    ['Giá', (product) => formatCurrency(product.salePrice ?? product.price)],
    ['Đánh giá', (product) => `${product.rating}/5 (${product.reviewCount})`],
    ['Tồn kho', (product) => String(product.stock)],
    ...Array.from(new Set(products.flatMap((product) => Object.keys(product.specs || {})))).map((key) => [
      key,
      (product: Product) => String(product.specs?.[key] ?? '—'),
    ] as [string, (product: Product) => string]),
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">So sánh sản phẩm</h1>
        {products.length > 0 && <button type="button" onClick={clear} className="text-sm text-red-600">Xóa danh sách</button>}
      </div>
      {loading ? <p className="text-gray-500">Đang tải...</p> : products.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">Chưa có sản phẩm để so sánh.</p>
          <Link to="/san-pham" className="text-blue-600 hover:underline">Chọn sản phẩm</Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th className="w-40 p-3 text-left bg-gray-50">Thông tin</th>
                {products.map((product) => (
                  <th key={product.id} className="p-3 text-left border-l align-top">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/san-pham/${product.id}`} className="font-semibold hover:text-blue-600">{product.name}</Link>
                      <button type="button" onClick={() => toggle(product.id)} aria-label={`Bỏ ${product.name} khỏi so sánh`}><X size={16} /></button>
                    </div>
                    <img src={mediaUrl(product.images?.[0] || '')} alt={product.name} className="w-32 h-32 object-contain mt-3" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t">
                  <th className="p-3 text-left font-medium bg-gray-50">{label}</th>
                  {products.map((product) => <td key={product.id} className="p-3 border-l">{value(product)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
