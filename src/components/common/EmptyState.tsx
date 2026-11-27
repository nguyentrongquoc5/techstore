import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có mục nào.',
  actionLabel,
  actionTo,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
