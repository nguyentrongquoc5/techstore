import { useEffect, useMemo, useState } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';
import type { User, Role } from '../../types';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import { UserPlus, Trash2 } from 'lucide-react';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'locked'>('ALL');
  const [sort, setSort] = useState('newest');
  const [creating, setCreating] = useState(false);
  const [perPage, setPerPage] = usePageSize('admin-users-page-size');
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', phone: '', role: 'USER' as Role });

  const filteredUsers = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (statusFilter === 'active' && !user.isActive) return false;
      if (statusFilter === 'locked' && user.isActive) return false;
      if (!keyword) return true;
      return `${user.fullName} ${user.email} ${user.phone || ''}`.toLowerCase().includes(keyword);
    }).sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.createdAt.localeCompare(b.createdAt);
        case 'name-asc': return a.fullName.localeCompare(b.fullName, 'vi');
        case 'name-desc': return b.fullName.localeCompare(a.fullName, 'vi');
        case 'email-asc': return a.email.localeCompare(b.email);
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [users, q, roleFilter, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const visibleUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    userService.getAll().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, statusFilter, sort]);

  const patch = async (id: string, data: Partial<User>) => {
    try {
      const u = await userService.update(id, data);
      setUsers((prev) => prev.map((x) => (x.id === id ? u : x)));
      showToast('Cập nhật thành công', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const user = await userService.create(newUser);
      setUsers((current) => [user, ...current]);
      setPage(1);
      setNewUser({ email: '', password: '', fullName: '', phone: '', role: 'USER' });
      setCreating(false);
      showToast('Đã tạo người dùng', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể tạo người dùng', 'error');
    }
  };

  const remove = async (user: User) => {
    if (!window.confirm(`Xóa người dùng ${user.email}? Tài khoản có đơn hàng sẽ không thể xóa.`)) return;
    try {
      await userService.remove(user.id);
      setUsers((current) => current.filter((entry) => entry.id !== user.id));
      showToast('Đã xóa người dùng', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa người dùng', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <button type="button" onClick={() => setCreating((value) => !value)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          <UserPlus size={16} /> Tạo user
        </button>
      </div>
      {creating && (
        <form onSubmit={create} className="bg-white rounded-xl border p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input required type="text" value={newUser.fullName} onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })} placeholder="Họ tên" className="border rounded-lg px-3 py-2 text-sm" />
          <input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" />
          <input required minLength={6} type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Mật khẩu (≥6 ký tự)" className="border rounded-lg px-3 py-2 text-sm" />
          <input type="tel" value={newUser.phone} onChange={(event) => setNewUser({ ...newUser, phone: event.target.value })} placeholder="Số điện thoại" className="border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as Role })} className="min-w-0 flex-1 border rounded-lg px-2 py-2 text-sm">
              <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
            </select>
            <button className="px-3 bg-blue-600 text-white rounded-lg text-sm">Tạo</button>
          </div>
        </form>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo họ tên, email, SĐT..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'ALL' | Role)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'active' | 'locked')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
        <select
          aria-label="Sắp xếp người dùng"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name-asc">Tên A–Z</option>
          <option value="name-desc">Tên Z–A</option>
          <option value="email-asc">Email A–Z</option>
        </select>
      </div>
      <div className="flex justify-end">
        <PageSizeSelect value={perPage} onChange={(size) => { setPerPage(size); setPage(1); }} />
      </div>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                  Không tìm thấy người dùng.
                </td>
              </tr>
            ) : visibleUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value as Role })} className="text-xs px-2 py-1 border rounded">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => patch(u.id, { isActive: !u.isActive })} className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => void remove(u)} title="Xóa user" className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
