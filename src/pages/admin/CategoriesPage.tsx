import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { productService } from '../../services/productService';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../types';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(productService.getCategories());
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = () => setCategories(productService.getCategories());

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      productService.updateCategory(editing.id, { name, description: desc });
      showToast('Cập nhật danh mục thành công', 'success');
    } else {
      productService.createCategory({ name, description: desc });
      showToast('Thêm danh mục thành công', 'success');
    }
    setName('');
    setDesc('');
    setEditing(null);
    setShowForm(false);
    refresh();
  };

  const handleEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDesc(c.description);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xóa danh mục này?')) return;
    productService.deleteCategory(id);
    refresh();
    showToast('Đã xóa danh mục', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setName(''); setDesc(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h3 className="font-semibold">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Lưu</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Mô tả</th>
              <th className="px-4 py-3 font-medium">Số SP</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.description}</td>
                <td className="px-4 py-3">{c.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
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
