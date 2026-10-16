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
