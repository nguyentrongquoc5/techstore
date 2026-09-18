import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import type { Product } from '../../types';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'them';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const categories = productService.getCategories();

  const [form, setForm] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    brand: '',
    price: '',
    salePrice: '',
    stock: '',
    description: '',
    image: '',
    isFeatured: false,
    isBestSeller: false,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (isEdit && id) {
      const p = productService.getById(id);
      if (p) {
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          brand: p.brand,
          price: String(p.price),
          salePrice: p.salePrice ? String(p.salePrice) : '',
          stock: String(p.stock),
          description: p.description,
          image: p.images[0] || '',
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          status: p.status,
        });
      }
    }
  }, [id, isEdit]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === form.categoryId);
    const data = {
      name: form.name,
      categoryId: form.categoryId,
      categoryName: cat?.name || '',
      brand: form.brand,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      stock: Number(form.stock),
      description: form.description,
      specs: { 'Thương hiệu': form.brand, 'Bảo hành': '12 tháng' },
      images: [form.image || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      status: form.status,
      rating: 4.5,
      reviewCount: 0,
    };

    if (isEdit && id) {
      productService.update(id, data);
      showToast('Cập nhật sản phẩm thành công', 'success');
    } else {
      productService.create(data as any);
      showToast('Thêm sản phẩm thành công', 'success');
    }
    navigate('/admin/san-pham');
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/admin/san-pham" className="text-sm text-blue-600 hover:underline">Sản phẩm</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục *</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thương hiệu *</label>
            <input required value={form.brand} onChange={(e) => set('brand', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá *</label>
            <input required type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá KM</label>
            <input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tồn kho *</label>
            <input required type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL ảnh</label>
          <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded" />
            Nổi bật
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} className="rounded" />
            Bán chạy
          </label>
          <div>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="active">Hoạt động</option>
              <option value="inactive">Ẩn</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            {isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}
          </button>
          <Link to="/admin/san-pham" className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
