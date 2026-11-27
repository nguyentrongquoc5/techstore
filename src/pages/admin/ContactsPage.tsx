import { useEffect, useRef, useState } from 'react';
import { contactService, type ContactMessage } from '../../services/contactService';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

export default function AdminContactsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [perPage, setPerPage] = usePageSize('admin-contacts-page-size');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(perPage), sort };
    if (q.trim()) params.q = q.trim();
    if (from) params.from = from;
    if (to) params.to = to;
    contactService.list(params)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((error: unknown) => {
        if (active) showToast(error instanceof Error ? error.message : 'Không tải được liên hệ', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, q, from, to, sort, perPage, showToast]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQ(value);
      setPage(1);
    }, 350);
  };

  if (loading && items.length === 0) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tin nhắn liên hệ</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          value={qInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm tên, email, nội dung..."
          aria-label="Tìm tin nhắn liên hệ"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Từ
          <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="min-w-0 flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900" />
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Đến
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="min-w-0 flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900" />
        </label>
        <select aria-label="Sắp xếp tin nhắn" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name-asc">Người gửi A–Z</option>
          <option value="name-desc">Người gửi Z–A</option>
        </select>
        <p className="self-center text-sm text-gray-500">{total} tin nhắn</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {items.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">{total === 0 && (q || from || to) ? 'Không tìm thấy tin nhắn phù hợp.' : 'Chưa có tin nhắn liên hệ.'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3">Người gửi</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Ngày gửi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">{item.fullName}</p>
                    <a href={`mailto:${item.email}`} className="text-xs text-blue-600 hover:underline">{item.email}</a>
                  </td>
                  <td className="px-4 py-3 min-w-[240px] whitespace-pre-wrap">{item.message}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex justify-end">
        <PageSizeSelect
          value={perPage}
          onChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
