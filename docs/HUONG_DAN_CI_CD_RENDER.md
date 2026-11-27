# Hướng dẫn chi tiết CI/CD + Deploy Render – Dự án TechStore (DEVOPS)

> Tài liệu dùng cho **báo cáo dự án kết thúc môn DEVOPS**.  
> Pipeline hiện tại: **GitHub Actions → Build/Test → Push image GHCR → Deploy Render**.

---

## 1. Tổng quan kiến trúc DevOps của dự án

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| Source control | GitHub | Repo chứa, trigger pipeline |
| CI | GitHub Actions | Lint, test, build, security scan |
| Container Registry | GHCR (ghcr.io) | Lưu Docker image API + Web |
| CD | Render Deploy Hook | Tự động deploy khi push `main`/`master` |
| Orchestration local | Docker Compose | Chạy full stack trên máy dev |
| Database | SQLite + Prisma | Seed dữ liệu demo mỗi lần container start |
| Reverse proxy | Nginx (frontend image) | Serve SPA + SPA routing |

**Luồng CI/CD:**

```
Push/PR → Frontend job (lint + build)
        → Backend job (prisma + tsc + vitest)
        → Security job (Trivy)
        → (chỉ push main) Docker build & push GHCR
        → Deploy job: gọi Render Deploy Hook + health check
```

---

## 2. Cấu trúc file quan trọng

```
techstore/
├── .github/workflows/ci-cd.yml     ← Pipeline chính (đã cập nhật)
├── Dockerfile                      ← Frontend (multi-stage Vite → Nginx)
├── backend/Dockerfile              ← Backend (Node + Prisma + seed)
├── docker-compose.yml              ← Local full-stack
├── backend/prisma/schema.prisma    ← Model dữ liệu
├── backend/prisma/seed.ts          ← Dữ liệu demo (users, products, orders…)
└── docs/HUONG_DAN_CI_CD_RENDER.md  ← File này
```

---

## 3. Dữ liệu seed (đã có sẵn – không cần thêm nhiều)

Seed chạy tự động khi container API start (`npx tsx prisma/seed.ts`).

**Dữ liệu mặc định:**

- **Users**
  - Admin: `admin@gmail.com` / `admin123`
  - User: `user@gmail.com` / `123456`
- **9 categories** (Laptop, Điện thoại, Tablet, Màn hình, Bàn phím, Chuột, Tai nghe, Webcam, Phụ kiện)
- **~40 sản phẩm** với giá, sale, brand, ảnh
- **Coupons**: `GIAM10`, `FREESHIP`, `SALE50K`
- **Orders + Reviews** mẫu để dashboard admin có số liệu

Nếu muốn **force seed lại** (xóa data cũ):

```bash
cd backend
npx tsx prisma/seed.ts --force
```

Ảnh sản phẩm: đặt file đúng tên vào `backend/public/images/products/` (xem `README_ANH.md`). Thiếu ảnh vẫn chạy được (dùng placeholder).

---

## 4. Chạy local (kiểm tra trước khi đẩy CI/CD)

### 4.1. Không Docker (dev mode)

```bash
# Terminal 1 – Backend
cd backend
cp .env.example .env          # chỉnh JWT_SECRET nếu muốn
npm install
npm run db:setup              # generate + push + seed
npm run dev                   # http://localhost:4000

# Terminal 2 – Frontend
cd ..                         # về thư mục gốc
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

### 4.2. Docker Compose (gần giống production)

```bash
docker compose up -d --build
# Web:  http://localhost:8080
# API:  http://localhost:4000/api/health
docker compose logs -f api
```

Kiểm tra health:

```bash
curl -s http://localhost:4000/api/health | jq
```

---

## 5. Cấu hình GitHub Secrets & Variables (bắt buộc cho CD)

Vào **Settings → Secrets and variables → Actions**:

### Secrets (Repository secrets)

| Name | Mô tả |
|------|-------|
| `RENDER_DEPLOY_HOOK` | Deploy Hook của **Backend service** trên Render |
| `RENDER_DEPLOY_HOOK_WEB` | (Tuỳ chọn) Deploy Hook của Frontend service / Static Site |

### Variables (Repository variables – optional)

| Name | Ví dụ | Mục đích |
|------|-------|----------|
| `VITE_API_URL` | `https://techstore-api.onrender.com/api` | Build-arg frontend image |
| `API_HEALTH_URL` | `https://techstore-api.onrender.com/api/health` | Health check sau deploy |

> Lấy Deploy Hook trên Render: Service → Settings → Deploy Hook → Copy URL.

---

## 6. Deploy lên Render (hướng dẫn từng bước)

### 6.1. Backend (Web Service – Docker)

1. Tạo **New → Web Service**.
2. Connect GitHub repo **hoặc** chọn **Deploy an existing image from a registry**:
   - Image URL: `ghcr.io/<username>/<repo>:api-latest`
   - (Cần public package hoặc Authenticate với GHCR).
3. **Environment**:
   - `DATABASE_URL` = `file:./data/prod.db` (hoặc dùng Render Disk nếu muốn persistent)
   - `JWT_SECRET` = chuỗi bí mật dài
   - `FRONTEND_URL` = URL frontend (ví dụ `https://techstore.onrender.com`)
   - `PORT` = `4000` (Render tự inject, nhưng giữ cho chắc)
4. **Health Check Path**: `/api/health`
5. **Disk** (khuyến nghị): mount `/app/prisma/data` để SQLite không mất khi redeploy.
6. Sau khi service chạy, copy **Deploy Hook** → dán vào GitHub Secret `RENDER_DEPLOY_HOOK`.

### 6.2. Frontend

**Cách A – Static Site (khuyến nghị, rẻ & nhanh)**

1. New → Static Site.
2. Build Command: `npm ci && npm run build`
3. Publish Directory: `dist`
4. Environment Variable: `VITE_API_URL` = `https://<backend-service>.onrender.com/api`
5. (Optional) Deploy Hook → `RENDER_DEPLOY_HOOK_WEB`

**Cách B – Web Service Docker**

- Image: `ghcr.io/<username>/<repo>:web-latest`
- Port 80

### 6.3. Lưu ý Free Tier Render

- Service sleep sau ~15 phút không request → cold start 30–60s.
- Pipeline health-check đã được thiết kế **không fail** pipeline nếu cold start lâu.

---

## 7. Pipeline chi tiết (file `ci-cd.yml`)

### Job 1 – Frontend
- `npm ci` → `oxlint` → `vite build`
- Artifact `dist/` được upload (giữ 3 ngày)

### Job 2 – Backend
- `npm ci` → `prisma generate` → `tsc --noEmit` → `vitest run`
- Dùng SQLite file tạm trong CI

### Job 3 – Security (Trivy)
- Quét filesystem tìm lỗ hổng CRITICAL/HIGH
- `exit-code: 0` để không chặn pipeline (có thể đổi thành 1 khi muốn strict)

### Job 4 – Docker Build & Push (chỉ push main/master)
- Login GHCR bằng `GITHUB_TOKEN`
- Build frontend với `VITE_API_URL` từ Variables
- Tag: `web-latest`, `web-<sha>`, `web-<run_number>` (tương tự cho api)
- Cache layer với GitHub Actions cache (`type=gha`)

### Job 5 – Deploy
- Gọi 1 hoặc 2 Deploy Hook
- Sleep 45s + retry health check 6 lần
- Ghi summary vào GitHub Step Summary

---

## 8. Cách kiểm tra pipeline đã chạy đúng

1. Push một commit nhỏ lên `main`:
   ```bash
   git add .
   git commit -m "chore: update CI/CD for DEVOPS final report"
   git push origin main
   ```
2. Vào tab **Actions** → xem workflow chạy xanh.
3. Kiểm tra **Packages** (GHCR) có image `api-latest` và `web-latest`.
4. Vào Render Dashboard → xem Deploy log mới.
5. Mở browser:
   - Frontend URL
   - `https://<api>.onrender.com/api/health`
   - Login admin / user demo.

---

## 9. Checklist báo cáo DEVOPS (gợi ý)

- [ ] Mô tả kiến trúc (diagram CI/CD + component)
- [ ] Giải thích từng stage trong pipeline
- [ ] Screenshot GitHub Actions (success)
- [ ] Screenshot GHCR packages
- [ ] Screenshot Render service + health
- [ ] Screenshot website chạy + login admin + danh sách sản phẩm (seed)
- [ ] Giải thích Docker multi-stage / healthcheck / volume
- [ ] Giải thích seed data & Prisma
- [ ] Điểm mạnh / hạn chế (SQLite trên free tier, cold start…)
- [ ] Hướng dẫn tái tạo (README + file này)

---

## 10. Lệnh nhanh tham khảo

```bash
# Local full stack
docker compose up -d --build

# Chỉ backend test
cd backend && npm test

# Force seed lại
cd backend && npx tsx prisma/seed.ts --force

# Xem log pipeline (sau khi push)
# → GitHub → Actions

# Trigger deploy thủ công
curl -X POST "$RENDER_DEPLOY_HOOK"
```

---

**Tài khoản demo sau khi seed:**

| Vai trò | Email | Password |
|---------|-------|----------|
| Admin | admin@gmail.com | admin123 |
| User | user@gmail.com | 123456 |

Chúc bạn bảo vệ đồ án thành công!
