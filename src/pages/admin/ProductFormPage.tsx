import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../types';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'them';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    brand: '',
    price: '',
    salePrice: '',
    stock: '',
    description: '',
    image: '',
    isFeatured: false,
    isBestSeller: false,
    status: 'active',
  });

  useEffect(() => {
    productService.getCategories().then((c) => {
      setCategories(c);
      if (!isEdit && c[0]) setForm((f) => ({ ...f, categoryId: c[0].id }));
    });
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      productService.getById(id).then((p) => {
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          brand: p.brand,
          price: String(p.price),
          salePrice: p.salePrice != null ? String(p.salePrice) : '',
          stock: String(p.stock),
          description: p.description,
          image: p.images?.[0] || '',
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          status: p.status,
        });
      });
    }
  }, [id, isEdit]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      brand: form.brand,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock),
      description: form.description,
      images: [form.image || '/images/products/placeholder.jpg'],
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      status: form.status,
    };
    try {
      if (isEdit && id) {
        await productService.update(id, payload as any);
        showToast('Cập nhật thành công', 'success');
      } else {
        await productService.create(payload as any);
        showToast('Thêm sản phẩm thành công', 'success');
      }
      navigate('/admin/san-pham');
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/admin/san-pham" className="text-sm text-blue-600 hover:underline">Sản phẩm</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục *</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thương hiệu *</label>
            <input required value={form.brand} onChange={(e) => set('brand', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá *</label>
            <input required type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá KM</label>
            <input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tồn kho *</label>
            <input required type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Đường dẫn ảnh (vd: /images/products/phone-01.jpg)</label>
          <input value={form.image} onChange={(e) => set('image', e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="/images/products/laptop-01.jpg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Nổi bật</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} /> Bán chạy</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="active">Hoạt động</option>
            <option value="inactive">Ẩn</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">{isEdit ? 'Cập nhật' : 'Thêm'}</button>
          <Link to="/admin/san-pham" className="px-6 py-2.5 border rounded-lg text-sm">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
