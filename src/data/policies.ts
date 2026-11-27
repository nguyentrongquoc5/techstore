export type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Policy = {
  slug: string;
  title: string;
  sections: PolicySection[];
};

export const policies: Policy[] = [
  {
    slug: 'doi-tra',
    title: 'Chính sách đổi trả',
    sections: [
      {
        heading: 'Điều kiện đổi trả',
        bullets: [
          'Sản phẩm còn nguyên tem, hộp, phụ kiện; chưa qua sử dụng làm ảnh hưởng giá trị.',
          'Có hóa đơn / mã đơn hàng trên hệ thống TechStore.',
          'Thời hạn đổi trả: trong 7 ngày kể từ ngày nhận hàng (trừ sản phẩm có quy định riêng).',
        ],
      },
      {
        heading: 'Các trường hợp được hỗ trợ',
        bullets: [
          'Giao sai sản phẩm, sai màu/cấu hình so với đơn.',
          'Sản phẩm lỗi do nhà sản xuất được xác nhận khi tiếp nhận.',
          'Hư hỏng do vận chuyển (cần kiểm tra khi nhận và báo trong 24 giờ).',
        ],
      },
      {
        heading: 'Không áp dụng đổi trả',
        bullets: [
          'Sản phẩm đã kích hoạt bảo hành hoặc mất phụ kiện đi kèm.',
          'Lỗi phát sinh do người dùng (rơi vỡ, vào nước, can thiệp phần cứng/phần mềm trái phép).',
          'Sản phẩm trong danh mục không đổi trả theo quy định hãng (nếu có ghi trên trang sản phẩm).',
        ],
      },
      {
        heading: 'Quy trình',
        paragraphs: [
          'Liên hệ hỗ trợ qua trang Liên hệ hoặc hotline, cung cấp mã đơn và lý do. Sau khi được xác nhận, bạn gửi hàng về theo hướng dẫn và chờ xử lý đổi/hoàn trong thời gian cam kết.',
        ],
      },
    ],
  },
  {
    slug: 'bao-hanh',
    title: 'Chính sách bảo hành',
    sections: [
      {
        heading: 'Thời gian bảo hành',
        paragraphs: [
          'Thời hạn bảo hành theo quy định của hãng và được ghi trên hóa đơn / trang chi tiết sản phẩm. Phụ kiện có thể có thời hạn ngắn hơn máy chính.',
        ],
      },
      {
        heading: 'Điều kiện bảo hành',
        bullets: [
          'Tem bảo hành, serial còn nguyên và khớp hồ sơ.',
          'Lỗi kỹ thuật trong điều kiện sử dụng bình thường.',
          'Sản phẩm còn trong thời hạn bảo hành.',
        ],
      },
      {
        heading: 'Không bảo hành',
        bullets: [
          'Hư hỏng do tác động ngoại lực, cháy nổ, vào nước, động vật, thiên tai.',
          'Tự ý tháo máy, sửa chữa tại nơi không được ủy quyền.',
          'Hết hạn bảo hành hoặc không xác định được nguồn gốc mua tại TechStore.',
        ],
      },
      {
        heading: 'Tiếp nhận bảo hành',
        paragraphs: [
          'Mang sản phẩm và giấy tờ mua hàng đến điểm hỗ trợ hoặc gửi theo hướng dẫn sau khi liên hệ. Thời gian xử lý phụ thuộc linh kiện và chính sách hãng.',
        ],
      },
    ],
  },
  {
    slug: 'van-chuyen',
    title: 'Chính sách vận chuyển',
    sections: [
      {
        heading: 'Phí vận chuyển',
        bullets: [
          'Miễn phí vận chuyển khi tạm tính đơn (subtotal) trên 5.000.000đ.',
          'Đơn còn lại: phí vận chuyển 30.000đ.',
          'Phí được tính tự động khi đặt hàng trên hệ thống.',
        ],
      },
      {
        heading: 'Thời gian giao hàng',
        paragraphs: [
          'Nội thành các thành phố lớn: thường 1–3 ngày làm việc sau khi đơn được xác nhận. Ngoại tỉnh: 3–7 ngày làm việc tùy khu vực và đơn vị vận chuyển.',
        ],
      },
      {
        heading: 'Kiểm hàng',
        bullets: [
          'Được kiểm tra ngoại quan và đúng model trước khi thanh toán (với đơn COD) hoặc khi nhận hàng.',
          'Nếu hộp móp méo / niêm phong không còn, hãy từ chối nhận và liên hệ ngay bộ phận hỗ trợ.',
        ],
      },
      {
        heading: 'Lưu ý',
        paragraphs: [
          'Thời gian có thể kéo dài vào cao điểm hoặc khu vực xa. Trạng thái đơn được cập nhật trên mục Đơn hàng của tài khoản.',
        ],
      },
    ],
  },
];

export function getPolicyBySlug(slug: string | undefined): Policy | undefined {
  if (!slug) return undefined;
  return policies.find((policy) => policy.slug === slug);
}
