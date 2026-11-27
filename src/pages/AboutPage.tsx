import { Link } from 'react-router-dom';
import { Shield, Truck, Headphones, BadgeCheck } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const commitments = [
  {
    icon: BadgeCheck,
    title: 'Hàng chính hãng',
    desc: 'Sản phẩm nhập chính hãng, hóa đơn đầy đủ, nguồn gốc rõ ràng.',
  },
  {
    icon: Truck,
    title: 'Giao hàng nhanh',
    desc: 'Giao toàn quốc; miễn phí ship khi đơn tạm tính trên 5.000.000đ.',
  },
  {
    icon: Shield,
    title: 'Bảo hành rõ ràng',
    desc: 'Chính sách bảo hành minh bạch theo từng sản phẩm và hãng.',
  },
  {
    icon: Headphones,
    title: 'Hỗ trợ tận tâm',
    desc: 'Tư vấn trước và sau bán; kênh liên hệ phản hồi nhanh.',
  },
];

export default function AboutPage() {
  usePageTitle('Giới thiệu');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <section className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Về TechStore</h1>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          TechStore là cửa hàng thiết bị công nghệ hướng tới trải nghiệm mua sắm đơn giản, giá hợp lý
          và dịch vụ hậu mãi đáng tin. Chúng tôi cung cấp laptop, điện thoại, phụ kiện chính hãng,
          kèm quy trình đặt hàng – giao nhận – bảo hành rõ ràng.
        </p>
        <p className="text-gray-600 leading-relaxed max-w-3xl mt-3">
          Sứ mệnh của chúng tôi là giúp khách hàng chọn đúng sản phẩm, nhận hàng đúng cam kết và được
          hỗ trợ khi cần — từ tư vấn kỹ thuật đến đổi trả theo chính sách cửa hàng.
        </p>
        <Link
          to="/san-pham"
          className="inline-flex mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Xem sản phẩm
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cam kết của chúng tôi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {commitments.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <item.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
