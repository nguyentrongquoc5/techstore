# TechStore – Fullstack (React + Express + Prisma/SQLite)

Website bán thiết bị công nghệ: **Frontend React** + **Backend API** + **Database SQLite (Prisma)**.

## Công nghệ

| Tầng | Stack |
|------|--------|
| Frontend | React, Vite, TypeScript, Tailwind, React Router, Recharts |
| Backend | Node.js, Express, JWT, bcrypt |
| Database | SQLite + Prisma ORM |
| Ảnh | `backend/public/images/products/` |
| DevOps | Docker, docker-compose, Nginx, GitHub Actions |

## Tài khoản demo

- Admin: `admin@gmail.com` / `admin123`
- User: `user@gmail.com` / `123456`

## Ảnh sản phẩm

Cần **43 file ảnh** (9 loại). Xem chi tiết:

`backend/public/images/products/README_ANH.md`

Đặt file đúng tên (vd `phone-01.jpg`) vào thư mục đó.

## Chạy local

### 1. Backend API

```bash
cd backend
npm install
npm run db:setup
npm run dev
```

API: http://localhost:4000

### 2. Frontend

```bash
# ở thư mục gốc techstore
npm install
npm run dev
```

Web: http://localhost:5173  
File `.env`: `VITE_API_URL=http://localhost:4000/api`

## Docker Compose

```bash
docker compose up -d --build
```

- Web: http://localhost:8080  
- API: http://localhost:4000  

## Các tính năng mở rộng

- Thanh toán VNPay và MoMo được xác minh bằng chữ ký callback/IPN; cổng chỉ hoạt động khi khai báo đủ biến merchant. Chạy API trực tiếp thì cấu hình `backend/.env` (xem `backend/.env.example`); Docker Compose đọc cấu hình từ `.env` ở thư mục gốc (xem `.env.example`). `VNPAY_RETURN_URL` và `MOMO_REDIRECT_URL` trỏ về `/thanh-toan/ket-qua`; callback MoMo và IPN VNPay cần URL backend công khai qua HTTPS và phải khai báo đúng trong trang merchant. Không đưa secret vào frontend hoặc commit lên Git.
- Email xác nhận đơn dùng SMTP. Cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` và tùy chọn `SMTP_FROM`. Không cấu hình SMTP thì đơn vẫn được tạo, API trả `emailSent: false`.
- Biến thể sản phẩm (màu/cấu hình/SKU, giá tùy chọn, tồn kho riêng) quản lý trong form admin. Tồn kho biến thể được kiểm tra và trừ/hoàn cùng giao dịch đặt/hủy đơn.
- So sánh lưu trên trình duyệt (tối đa 4 sản phẩm); sổ địa chỉ và sửa/xóa đánh giá chỉ giới hạn cho chủ sở hữu.
- Admin có thể tạo/xóa user (user có lịch sử đơn cần khóa thay vì xóa) và tải CSV đơn hàng/doanh thu từ dashboard.

Sau khi cập nhật schema, chạy trong `backend`:

```bash
npm run db:generate
npm run db:push
```

## API chính

- `POST /api/auth/login` `register` `GET /me`
- `GET /api/products` `POST/PUT/DELETE` (admin)
- `GET /api/categories`
- `GET/POST /api/orders` `PATCH /orders/:id/status`
- `GET /api/users` (admin)
- `GET /api/stats/dashboard` (admin)
- Ảnh tĩnh: `GET /images/products/...`

## Cấu trúc

```
techstore/
├── backend/           # Express + Prisma
│   ├── prisma/        # schema + seed
│   ├── public/images/products/  # Ảnh SP
│   └── src/
├── src/               # React frontend
├── docker-compose.yml
└── Dockerfile         # Frontend Nginx
```

## DevOps / CI/CD (GitHub Actions + Render)

Pipeline đã được cập nhật đầy đủ cho báo cáo kết thúc môn:

- **CI**: Lint frontend, Prisma generate + type-check + Vitest backend, Trivy security scan
- **CD**: Build Docker image → push GHCR → trigger Render Deploy Hook + health check

Xem hướng dẫn chi tiết (bí mật, biến môi trường, Render setup, checklist báo cáo):

**[docs/HUONG_DAN_CI_CD_RENDER.md](docs/HUONG_DAN_CI_CD_RENDER.md)**

```bash
# Local full-stack giống production
docker compose up -d --build
```
