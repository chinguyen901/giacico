# Hướng Dẫn Deploy lên Vercel + Neon

## Tổng quan kiến trúc

```
Browser → Vercel (Next.js) → Neon PostgreSQL
                ↑
         API Routes:
         /api/orders
         /api/materials
         /api/products
         /api/production
         /api/stats
```

---

## Bước 1: Tạo Neon Database

1. Vào [neon.tech](https://neon.tech) → **Sign up** (miễn phí)
2. **Create project** → đặt tên: `giacico-production`
3. Chọn region gần nhất: **Singapore** hoặc **US East**
4. Copy **Connection string** dạng:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Bước 2: Tạo Schema trên Neon

1. Vào Neon Console → **SQL Editor**
2. Copy toàn bộ nội dung file [`lib/schema.sql`](lib/schema.sql) và paste vào SQL Editor
3. Click **Run** → tất cả các bảng sẽ được tạo

---

## Bước 3: Seed dữ liệu thật từ Excel

Chạy lệnh sau trên máy local (cần có file Excel gốc):

```bash
# Trong thư mục web-demo/
python3 scripts/seed.py > scripts/seed.sql

# Kiểm tra output (xem trước)
head -30 scripts/seed.sql
```

Sau đó paste nội dung `scripts/seed.sql` vào Neon SQL Editor và **Run**.

> **Kết quả mong đợi:**
> - `products`: 12 sản phẩm
> - `materials`: 12 vật tư
> - `orders`: ~53 đơn hàng thật từ file Excel
> - `production_slots`: 14 ca sản xuất
> - `aged_inventory`: ~35 lô tồn kho > 2 tháng

---

## Bước 4: Push code lên GitHub

```bash
# Trong thư mục web-demo/
git init
git add .
git commit -m "feat: web demo với Neon DB"

# Tạo repo trên GitHub rồi:
git remote add origin https://github.com/YOUR_USERNAME/giacico-demo.git
git push -u origin main
```

---

## Bước 5: Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → **Add New Project**
2. **Import** repo GitHub vừa tạo
3. Vercel tự nhận diện Next.js — giữ nguyên cài đặt
4. Trong **Environment Variables**, thêm:
   ```
   DATABASE_URL = postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require
   ```
   (paste connection string từ Bước 1)
5. Click **Deploy** → chờ ~2 phút

---

## Bước 6: Kiểm tra sau deploy

Sau khi deploy xong, test các URL:

| URL | Mong đợi |
|-----|----------|
| `https://your-app.vercel.app/` | Dashboard với số liệu thật |
| `https://your-app.vercel.app/orders` | Danh sách ~53 đơn hàng |
| `https://your-app.vercel.app/api/orders` | JSON array đơn hàng |
| `https://your-app.vercel.app/api/stats` | JSON thống kê tổng quan |

---

## Cấu trúc file quan trọng

```
web-demo/
├── lib/
│   ├── db.ts           # Kết nối Neon (lazy init)
│   └── schema.sql      # CREATE TABLE statements
├── scripts/
│   ├── seed.py         # Đọc Excel → SQL
│   └── seed.sql        # SQL được generate (chạy trên Neon)
├── app/api/
│   ├── orders/         # GET /api/orders?line=AV&status=DL
│   ├── materials/      # GET /api/materials?type=raw
│   ├── products/       # GET /api/products
│   ├── production/     # GET /api/production?from=&to=
│   └── stats/          # GET /api/stats
└── .env.example        # Template cho .env.local
```

---

## Local development với Neon

```bash
# Copy .env.example thành .env.local
cp .env.example .env.local

# Điền DATABASE_URL vào .env.local
# (lấy từ Neon Console)

# Chạy dev server
npm run dev
```

---

## Cập nhật dữ liệu khi Excel thay đổi

```bash
# Re-generate seed.sql
python3 scripts/seed.py > scripts/seed.sql

# Chạy trên Neon SQL Editor
# (TRUNCATE + INSERT lại toàn bộ)
```

> Lưu ý: Lệnh TRUNCATE xóa toàn bộ dữ liệu cũ trước khi insert mới.
> Nếu muốn chỉ cập nhật một phần, cần sửa script seed.py.
