import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { getPolicyBySlug, policies } from '../data/policies';
import EmptyState from '../components/common/EmptyState';

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const policy = getPolicyBySlug(slug);

  usePageTitle(policy?.title ?? 'Chính sách');

  if (!policy) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState
          title="Không tìm thấy chính sách"
          description="Đường dẫn chính sách không tồn tại hoặc đã được thay đổi."
          actionLabel="Về trang chủ"
          actionTo="/"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-white rounded-xl border border-gray-100 p-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Chính sách</h2>
          <nav className="space-y-1">
            {policies.map((item) => (
              <Link
                key={item.slug}
                to={`/chinh-sach/${item.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm transition ${
                  item.slug === policy.slug
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{policy.title}</h1>
          <div className="space-y-6">
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.heading}</h2>
                {section.paragraphs?.map((text) => (
                  <p key={text} className="text-sm text-gray-600 leading-relaxed mb-2">
                    {text}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
