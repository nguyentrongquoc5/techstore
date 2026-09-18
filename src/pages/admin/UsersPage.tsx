import { useState } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';
import type { Role } from '../../types';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(authService.getUsers());

  const toggleActive = (id: string, isActive: boolean) => {
    authService.updateUserByAdmin(id, { isActive: !isActive });
    setUsers(authService.getUsers());
    showToast(isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', 'success');
  };

  const changeRole = (id: string, role: Role) => {
    authService.updateUserByAdmin(id, { role });
    setUsers(authService.getUsers());
    showToast('Cập nhật vai trò thành công', 'success');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.phone}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
