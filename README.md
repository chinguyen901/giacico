# Webex Call Viewer

Next.js app nhận raw data từ Webex Contact Center Flow Designer, lưu vào Neon PostgreSQL, hiển thị trên một dashboard đơn giản và cho export CSV. Deploy trên Vercel.

```text
Webex Flow Designer  →  POST /api/webex/events (Vercel)  →  Neon PostgreSQL  →  Dashboard (/) + Export CSV (/api/export)
```

## 1. Chạy thử ở local

```bash
cd webex-call-viewer
npm install
cp .env.example .env.local
# mở .env.local, điền DATABASE_URL, API_SECRET, DASHBOARD_USER, DASHBOARD_PASSWORD
npm run dev
```

Mở `http://localhost:3000` — sẽ hiện popup Basic Auth, đăng nhập bằng `DASHBOARD_USER`/`DASHBOARD_PASSWORD` đã điền trong `.env.local`.

## 2. Chuẩn bị database Neon

**Nếu bạn đã có Neon DB từ sandbox trước** (theo PLAN.md, đã tạo `call_interactions`, `call_events`, `call_raw_payloads`): chỉ cần lấy connection string cũ, bỏ qua bước tạo bảng.

**Nếu tạo Neon DB mới:**

1. Vào [neon.tech](https://neon.tech) → tạo project mới.
2. Vào **Connection Details**, copy connection string dạng `postgresql://user:password@host/dbname?sslmode=require`.
3. Vào **SQL Editor**, dán toàn bộ nội dung file [`db/schema.sql`](db/schema.sql) và chạy — tạo 3 bảng + index + trigger.
4. Dán connection string vào `DATABASE_URL` trong `.env.local` (và sau này trong Vercel Environment Variables).

## 3. Tạo GitHub repo (public) và push code

```bash
cd webex-call-viewer
git init
git add .
git commit -m "Initial commit: Webex call viewer"
```

Trên github.com: **New repository** → đặt tên (ví dụ `webex-call-viewer`) → chọn **Public** → không tick "Add README" (đã có sẵn) → Create.

GitHub sẽ cho bạn 2 dòng lệnh để nối repo local với repo vừa tạo, dạng:

```bash
git remote add origin https://github.com/<your-username>/webex-call-viewer.git
git branch -M main
git push -u origin main
```

Chạy đúng 2 dòng `git remote add` và `git push` mà GitHub hiển thị cho bạn (URL sẽ có username của bạn).

> Vì repo là public: `.gitignore` đã loại `.env`/`.env.local` ra khỏi commit. Trước khi push, kiểm tra lại `git status` — tuyệt đối không commit file chứa `DATABASE_URL` hay `API_SECRET` thật.

## 4. Deploy lên Vercel

1. Vào [vercel.com/new](https://vercel.com/new), đăng nhập bằng GitHub, chọn **Import** repo `webex-call-viewer` vừa tạo.
2. Vercel tự nhận diện đây là project Next.js — không cần chỉnh build command.
3. Ở bước **Environment Variables**, thêm 4 biến (copy từ `.env.local`):
   - `DATABASE_URL`
   - `API_SECRET`
   - `DASHBOARD_USER`
   - `DASHBOARD_PASSWORD`
4. Nhấn **Deploy**. Sau khi xong, Vercel cho bạn một URL dạng `https://webex-call-viewer-xxxx.vercel.app`.
5. Mở URL đó → sẽ hiện popup Basic Auth → đăng nhập bằng `DASHBOARD_USER`/`DASHBOARD_PASSWORD`.

## 5. Nối Webex Flow Designer vào endpoint

Trong Flow Designer, ở bước HTTP Request Activity:

- **URL**: `https://<your-project>.vercel.app/api/webex/events`
- **Method**: `POST`
- **Headers**: `x-api-secret: <giá trị API_SECRET>` (cùng giá trị đã nhập trong Vercel)
- **Body**: JSON chứa các biến Flow lấy được (xem Section 2 trong [PLAN.md](../PLAN.md) để biết field nào khả dụng). Endpoint chấp nhận cả payload theo cấu trúc mẫu trong PLAN.md Section 6, lẫn các biến phẳng như `ANI`, `DNIS`, `InteractionId` — luôn lưu raw payload dù field có khớp hay không.

Test nhanh bằng curl trước khi gắn vào Flow thật:

```bash
curl -X POST https://<your-project>.vercel.app/api/webex/events \
  -H "Content-Type: application/json" \
  -H "x-api-secret: <API_SECRET>" \
  -d '{
    "source": "webex_contact_center",
    "event_type": "CALL_STARTED",
    "interaction_id": "test-001",
    "calling_side": { "ani": "+14157629734", "dnis": "1001" },
    "classification": { "customer_type": "VIP", "vip_matched": true }
  }'
```

Sau đó mở dashboard, record `test-001` phải xuất hiện trong bảng, và nằm trong file khi bấm **Export CSV**.

## 6. Cấu trúc project

```text
webex-call-viewer/
├── app/
│   ├── page.tsx                      Dashboard: bảng data + filter + nút Export CSV
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── webex/events/route.ts     POST — nhận raw data từ Webex, lưu Neon
│       ├── interactions/route.ts     GET  — trả JSON cho dashboard (có filter/pagination)
│       └── export/route.ts           GET  — trả CSV (cùng filter)
├── lib/
│   ├── db.ts                         Kết nối Neon (@neondatabase/serverless)
│   ├── auth.ts                       Xác thực API_SECRET cho endpoint Webex gửi vào
│   ├── filters.ts                    Build điều kiện WHERE dùng chung cho list + export
│   └── csv.ts                        Chuyển rows → CSV
├── proxy.ts                           Basic Auth bảo vệ dashboard + /api/interactions + /api/export
├── db/schema.sql                     DDL tạo bảng cho Neon (nếu tạo DB mới)
└── .env.example
```

## 7. Bảo mật — lưu ý vì repo public

- Không bao giờ commit `.env`/`.env.local`. `.gitignore` đã chặn sẵn.
- `API_SECRET` và `DASHBOARD_PASSWORD` chỉ tồn tại trong Vercel Environment Variables, không hard-code trong source.
- Nếu nghi secret đã lỡ bị commit: đổi secret mới trong Vercel + Neon ngay (không chỉ xoá commit, vì lịch sử git vẫn còn).
- `/api/webex/events` xác thực bằng `x-api-secret`, tách biệt với Basic Auth của dashboard — Webex không cần biết `DASHBOARD_PASSWORD`.
