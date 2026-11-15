# PTIT Blog — Đề tài số 5 (Môn Lập trình Web)

Website quản lý và chia sẻ bài viết Blog xây dựng bằng **ReactJS + ExpressJS + Prisma ORM + PostgreSQL**.

## Cấu trúc dự án

- `client/` — Frontend ReactJS (Vite + TailwindCSS + TinyMCE self-hosted + DOMPurify)
- `server/` — Backend ExpressJS (TypeScript + Prisma + PostgreSQL)

## Hướng dẫn chạy độc lập ở máy cá nhân (Local)

Mỗi thành viên khi clone repo về chỉ cần tự tạo file `.env` riêng trên máy mình, **không bị phụ thuộc** vào tài khoản Supabase, Render hay Vercel của người khác.

### 1. Chuẩn bị Database PostgreSQL
Chọn **1 trong 2 cách**:
- **Cách A (PostgreSQL cài trên máy / Docker local)**: Tạo sẵn 1 database rỗng (ví dụ `ptit_blog`).
- **Cách B (Supabase miễn phí riêng)**: Tạo project Supabase của riêng bạn (chọn region Singapore) và lấy `DATABASE_URL` + `DIRECT_URL`.

### 2. Cấu hình & chạy Backend (`server/`)
```bash
cd server
cp .env.example .env
```
Mở `server/.env` vừa tạo và chỉnh:
- Điền `DATABASE_URL` và `DIRECT_URL` của máy bạn (nếu dùng PostgreSQL local thì 2 dòng này giống nhau, ví dụ `postgresql://postgres:123456@localhost:5432/ptit_blog`).
- Phần `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`: **có thể để trống** — khi đó tính năng upload ảnh sẽ tự động lưu vào thư mục `server/uploads/` trên máy.

Sau đó chạy:
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```
> Backend mặc định chạy ở `http://localhost:5000`.  
> Lưu ý trên Windows PowerShell nếu bị chặn `npm`, hãy dùng `npm.cmd`.

### 3. Chạy Frontend (`client/`)
Mở terminal mới:
```bash
cd client
npm install
npm run dev
```
> Frontend mặc định chạy ở `http://localhost:5173` và tự gọi về `http://localhost:5000/api` (không cần tạo `client/.env`, chỉ cần `client/.env` khi muốn trỏ sang backend online như Render).

## Tài khoản mẫu (từ Seed Data)

- **Admin** (`/admin/login`): `admin@ptitblog.vn` / `Admin@123`
- **User** (`/login`): `nguyen@ptitblog.vn` / `User@123` (hoặc `liem@ptitblog.vn` / `User@123`)
