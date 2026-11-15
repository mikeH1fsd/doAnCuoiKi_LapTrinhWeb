# PTIT Blog — Đề tài số 5 (Môn Lập trình Web)

Website quản lý và chia sẻ bài viết Blog xây dựng bằng **ReactJS + ExpressJS + Prisma ORM + PostgreSQL (Supabase)**.

## Cấu trúc dự án

- `client/` — Frontend ReactJS (Vite + TailwindCSS + TinyMCE + DOMPurify)
- `server/` — Backend ExpressJS (TypeScript + Prisma + PostgreSQL)

## Hướng dẫn chạy ở máy cá nhân (Local)

### 1. Chạy Backend (`server/`)
```bash
cd server
npm install
npx prisma generate
npm run dev
```
> Server mặc định chạy ở `http://localhost:5000`.  
> Để đẩy schema & tạo lại dữ liệu mẫu: `npm run db:push` và `npm run db:seed`.

### 2. Chạy Frontend (`client/`)
Mở terminal mới:
```bash
cd client
npm install
npm run dev
```
> Frontend mặc định chạy ở `http://localhost:5173`.

## Tài khoản mẫu (từ Seed Data)

- **Admin** (`/admin/login`): `admin@ptitblog.vn` / `Admin@123`
- **User** (`/login`): `nguyen@ptitblog.vn` / `User@123`
