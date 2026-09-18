# TechStore – Website bán thiết bị công nghệ

Dự án Frontend E-commerce hoàn chỉnh phục vụ môn **DevOps**. Sử dụng React + Vite + TypeScript, Tailwind CSS, LocalStorage, Docker, Nginx và CI/CD với GitHub Actions + GHCR + Render.

## 1. Giới thiệu

TechStore là website thương mại điện tử bán thiết bị công nghệ (laptop, điện thoại, phụ kiện...). Toàn bộ dữ liệu lưu bằng **LocalStorage**, không cần Backend/Database. Có phân quyền USER / ADMIN, CRUD đầy đủ, Dashboard với biểu đồ.

## 2. Công nghệ

| Công nghệ | Mục đích |
|-----------|----------|
| React 19 + Vite + TypeScript | Frontend framework |
| React Router | Routing |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |
| Recharts | Biểu đồ Dashboard |
| Context API + LocalStorage | State & persistence |
| Docker + Nginx | Containerization & static serve |
| GitHub Actions | CI/CD |
| GHCR | Docker registry |
| Render | Deploy production |

## 3. Chức năng chính

### Public
- Trang chủ (Hero, danh mục, sản phẩm nổi bật / bán chạy)
- Danh sách sản phẩm: Search, Filter, Sort, Pagination
- Chi tiết sản phẩm + sản phẩm liên quan
- Giỏ hàng (thêm/xóa/sửa số lượng, lưu LocalStorage)
- Thanh toán & đặt hàng
- Đăng nhập / Đăng ký
- Tài khoản cá nhân, đổi mật khẩu
- Lịch sử đơn hàng

### Admin (`/admin`)
- Dashboard: doanh thu, đơn hàng, biểu đồ, top sản phẩm
- CRUD Sản phẩm
- Quản lý đơn hàng (đổi trạng thái)
- Quản lý người dùng (vai trò, khóa/mở)
- Quản lý danh mục

## 4. Tài khoản demo

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | admin@gmail.com | admin123 |
| **USER** | user@gmail.com | 123456 |

## 5. Cấu trúc thư mục

```
src/
├── components/     # UI components (auth, cart, common, layout, product)
├── contexts/       # AuthContext, CartContext, ToastContext
├── data/           # Mock data
├── layouts/        # MainLayout, AdminLayout
├── pages/          # Public + admin pages
├── routes/         # ProtectedRoute, AdminRoute
├── services/       # storage, auth, product, order services
├── types/          # TypeScript types
├── utils/          # format helpers
├── App.tsx
└── main.tsx
```

## 6. Chạy local

```bash
# Cài đặt
npm install

# Chạy dev
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

Mở http://localhost:5173

## 7. Docker

```bash
# Build image
docker build -t techstore .

# Chạy container
docker run -d -p 8080:80 techstore

# Hoặc dùng Compose
docker compose up -d
```

Truy cập: **http://localhost:8080**

Nginx đã cấu hình `try_files` hỗ trợ React Router (SPA).

## 8. GitHub Actions – CI/CD

Pipeline (`.github/workflows/ci-cd.yml`):

1. **Checkout** code
2. **Setup Node** + `npm ci`
3. **Lint** + **Build**
4. **Docker Build** & **Push** lên GHCR:
   - `ghcr.io/<user>/techstore:latest`
   - `ghcr.io/<user>/techstore:<sha>`
5. **Deploy** Render (nếu có secret)

### Secrets cần thiết

| Secret | Mô tả |
|--------|-------|
| `GITHUB_TOKEN` | Tự có sẵn (packages:write) |
| `RENDER_DEPLOY_HOOK` | (Tùy chọn) URL Deploy Hook của Render |

## 9. Deploy lên Render

1. Tạo tài khoản [Render.com](https://render.com)
2. **New → Web Service**
3. Chọn **Deploy an existing image from a registry**
4. Image URL: `ghcr.io/<github-username>/techstore:latest`
5. Hoặc dùng **Dockerfile** trực tiếp từ repo
6. Port: `80`
7. Tạo **Deploy Hook** và thêm vào GitHub Secret `RENDER_DEPLOY_HOOK` để auto-deploy

Hoặc dùng **Blueprint** / Docker Compose trên Render.

## 10. Quy trình CI/CD tóm tắt

```
git push → GitHub Actions
         → npm install + lint + build
         → Docker build
         → Push GHCR (latest + sha)
         → Trigger Render Deploy Hook
         → Production live
```

## 11. LocalStorage keys

- `techstore_users`
- `techstore_current_user`
- `techstore_products`
- `techstore_cart`
- `techstore_orders`
- `techstore_categories`

## 12. Ghi chú cho thuyết trình DevOps

- Multi-stage Dockerfile: build với Node, serve bằng Nginx (image nhỏ)
- Nginx SPA fallback cho React Router
- CI chạy lint + build trước khi push image
- Image tagging: `latest` + commit SHA (immutable)
- Secrets không hard-code
- Có thể scale / rollback bằng tag SHA trên Render

---

**TechStore** – Đồ án DevOps Frontend E-commerce © 2025
"# techstore" 
