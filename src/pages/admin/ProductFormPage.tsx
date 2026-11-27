import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { X, Upload } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import { mediaUrl } from '../../services/api';
import type { Category } from '../../types';

interface VariantDraft {
  id?: string;
  color: string;
  configuration: string;
  sku: string;
  price: string;
  stock: string;
  isActive: boolean;
}

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
    images: [] as string[],
    isFeatured: false,
    isBestSeller: false,
    status: 'active',
    variants: [] as VariantDraft[],
  });
  const [uploading, setUploading] = useState(false);

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
          images: Array.isArray(p.images) ? p.images : [],
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          status: p.status,
          variants: (p.variants || []).map((variant) => ({
            ...variant,
            price: variant.price == null ? '' : String(variant.price),
            stock: String(variant.stock),
          })),
        });
      });
    }
  }, [id, isEdit]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const { paths } = await productService.uploadImages(Array.from(files));
      setForm((f) => ({ ...f, images: [...f.images, ...paths] }));
      showToast(`Đã tải lên ${paths.length} ảnh`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload thất bại', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

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
      images: form.images.length ? form.images : ['/images/products/placeholder.jpg'],
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      status: form.status,
      variants: form.variants.map((variant) => ({
        ...variant,
        price: variant.price ? Number(variant.price) : null,
        stock: Number(variant.stock),
      })),
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
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-2">Biến thể (màu sắc / cấu hình)</label>
            <button type="button" onClick={() => setForm((current) => ({
              ...current,
              variants: [...current.variants, {
                color: '', configuration: '', sku: `SKU-${Date.now()}`, price: '', stock: '0', isActive: true,
              }],
            }))} className="text-sm text-blue-600">+ Thêm biến thể</button>
          </div>
          <div className="space-y-3">
            {form.variants.map((variant, index) => (
              <div key={variant.id || variant.sku} className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2 rounded-lg border p-3">
                <input value={variant.color} onChange={(event) => {
                  const variants = [...form.variants]; variants[index] = { ...variant, color: event.target.value }; set('variants', variants);
                }} placeholder="Màu sắc" className="px-2 py-2 border rounded text-sm" />
                <input value={variant.configuration} onChange={(event) => {
                  const variants = [...form.variants]; variants[index] = { ...variant, configuration: event.target.value }; set('variants', variants);
                }} placeholder="Cấu hình" className="px-2 py-2 border rounded text-sm" />
                <input required value={variant.sku} onChange={(event) => {
                  const variants = [...form.variants]; variants[index] = { ...variant, sku: event.target.value }; set('variants', variants);
                }} placeholder="SKU" className="px-2 py-2 border rounded text-sm" />
                <input type="number" min="0" value={variant.price} onChange={(event) => {
                  const variants = [...form.variants]; variants[index] = { ...variant, price: event.target.value }; set('variants', variants);
                }} placeholder="Giá riêng (tùy chọn)" className="px-2 py-2 border rounded text-sm" />
                <input required type="number" min="0" value={variant.stock} onChange={(event) => {
                  const variants = [...form.variants]; variants[index] = { ...variant, stock: event.target.value }; set('variants', variants);
                }} placeholder="Tồn kho" className="px-2 py-2 border rounded text-sm" />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={variant.isActive} onChange={(event) => {
                    const variants = [...form.variants]; variants[index] = { ...variant, isActive: event.target.checked }; set('variants', variants);
                  }} /> Bán</label>
                  <button type="button" onClick={() => set('variants', form.variants.filter((_, i) => i !== index))} className="text-red-600 text-xs">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ảnh sản phẩm</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {form.images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-gray-50">
                <img src={mediaUrl(src)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Xóa ảnh"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Upload size={16} />
            {uploading ? 'Đang tải...' : 'Chọn ảnh (JPG/PNG/WEBP, tối đa 2MB)'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400 mt-1">Hoặc dán đường dẫn có sẵn vào danh sách bên dưới</p>
          <input
            value={form.images.join(', ')}
            onChange={(e) =>
              set(
                'images',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            className="w-full mt-2 px-3 py-2.5 border rounded-lg text-sm"
            placeholder="/images/products/laptop-01.jpg, /images/products/..."
          />
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
