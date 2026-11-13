import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import { mediaUrl } from '../../services/api';
import type { Category } from '../../types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'them';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
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

  /** Chọn file → kiểm tra client → upload → gán url vào form.image */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input để chọn lại cùng một file được
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setImageError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP';
      setImageError(msg);
      showToast(msg, 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      const msg = 'Ảnh vượt quá 5MB';
      setImageError(msg);
      showToast(msg, 'error');
      return;
    }

    setUploading(true);
    try {
      const { url } = await productService.uploadImage(file);
      set('image', url);
      showToast('Upload ảnh thành công', 'success');
    } catch (err: any) {
      const msg = err.message || 'Upload ảnh thất bại';
      setImageError(msg);
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
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

        {/* Ảnh sản phẩm: upload + nhập tay */}
        <div>
          <label className="block text-sm font-medium mb-2">Ảnh sản phẩm</label>
          <div className="flex flex-wrap items-start gap-4">
            {/* Khung xem trước */}
            <div className="w-28 h-28 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {uploading ? (
                <span className="text-xs text-gray-500 animate-pulse">Đang tải…</span>
              ) : form.image ? (
                <img
                  src={mediaUrl(form.image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">Chưa có ảnh</span>
              )}
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Đang upload…' : 'Chọn ảnh từ máy'}
              </button>
              <p className="text-xs text-gray-500">JPG, PNG, WebP — tối đa 5MB</p>
              {imageError && <p className="text-xs text-red-600">{imageError}</p>}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hoặc nhập đường dẫn thủ công</label>
                <input
                  value={form.image}
                  onChange={(e) => {
                    setImageError('');
                    set('image', e.target.value);
                  }}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  placeholder="/images/products/laptop-01.jpg"
                />
              </div>
            </div>
          </div>
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
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Cập nhật' : 'Thêm'}
          </button>
          <Link to="/admin/san-pham" className="px-6 py-2.5 border rounded-lg text-sm">Hủy</Link>
        </div>
      </form>
    </div>
  );
}