import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../types';
import Loading from '../../components/common/Loading';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const load = () => productService.getCategories().then(setCategories).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await productService.updateCategory(editing.id, { name, description: desc });
        showToast('Cập nhật danh mục thành công', 'success');
      } else {
        await productService.createCategory({ name, description: desc });
        showToast('Thêm danh mục thành công', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setName('');
      setDesc('');
      load();
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa danh mục (và sản phẩm thuộc danh mục)?')) return;
    try {
      await productService.deleteCategory(id);
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
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setName(''); setDesc(''); }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Lưu</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Tên</th><th className="px-4 py-3">Mô tả</th><th className="px-4 py-3">Số SP</th><th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.description}</td>
                <td className="px-4 py-3">{c.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(c); setName(c.name); setDesc(c.description); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
