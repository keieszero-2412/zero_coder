# Báo Cáo Triển Khai & Kiểm Thử Tích Hợp Staging Phase 5

**Thời gian:** 2026-11-13  
**Commit cơ sở:** `5f53c8a`  
**Giai đoạn:** Phase 5 — Staging Infrastructure Provisioning, Least-Privilege IAM & Worker Integration Smoke Tests  
**Trạng thái:** **PASS (14/14 Real Integration Smoke Tests Đạt 100% trên Hạ Tầng Live Staging)**  

---

## 1. Tổng Quan Kiến Trúc Staging Đã Triển Khai (Design A - Cách Ly Tuyệt Đối)

Theo đúng thiết kế được phê duyệt trong [2026-11-12-iam-staging-audit.md](2026-11-12-iam-staging-audit.md), môi trường Staging được cô lập hoàn toàn khỏi hệ thống Production:

| Thành phần | Production (`zerocoder-8cb6b`) | Staging (`zerocoder-staging`) | Trạng thái bảo vệ |
|---|---|---|---|
| **Firebase Project** | `zerocoder-8cb6b` (Spark, Free) | `zerocoder-staging` (Spark, Free, Num: `295463810709`) | Cách ly 100%, không dùng chung tài nguyên |
| **Firestore Database** | `(default)` Native mode | `(default)` Native mode, location `nam5` | Đã deploy `firestore.rules` nguyên bản |
| **Cloudflare R2 Bucket** | `zerocoder-images-private` (APAC) | `zerocoder-images-staging` (APAC, Standard) | Public `r2.dev` tắt, 0 custom domains |
| **Cloudflare Worker** | Chưa deploy | `zerocoder-images-staging` trên `zerocoder-dev.workers.dev` | Version ID: `c18310c0-880f-41e7-84ba-76f56a6c86f5` |
| **Google Service Account** | Chưa tạo | `zerocoder-images-staging@zerocoder-staging.iam.gserviceaccount.com` | Gắn 2 Custom Roles tối thiểu, 0 quyền delete |
| **Worker Secrets** | Chưa cấu hình | `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Đã mã hóa trên Cloudflare, không lưu file/Git |

---

## 2. Chi Tiết Cấu Hình Least-Privilege IAM (Chính Xác 6 Quyền)

Không sử dụng các role rộng như `roles/datastore.user` hay `roles/firebaseauth.viewer`. Thay vào đó, hai project-level Custom IAM Roles đã được khởi tạo và gán độc quyền:

1. **`projects/zerocoder-staging/roles/zerocoderImageMetadataWorker`**:
   - `datastore.databases.get` (beginTransaction, rollback)
   - `datastore.entities.get` (get, batchGet)
   - `datastore.entities.list` (documents cursor pagination)
   - `datastore.entities.create` (commit insert)
   - `datastore.entities.update` (commit update)
   - *Lưu ý:* Quyền `datastore.entities.delete` hoàn toàn **KHÔNG** được cấp.
2. **`projects/zerocoder-staging/roles/zerocoderAuthLookupWorker`**:
   - `firebaseauth.users.get` (identitytoolkit accounts:lookup)

---

## 3. Bằng Chứng Triển Khai Cloudflare Worker

- **Lệnh triển khai:**
  ```bash
  cd workers/images
  npx wrangler deploy --config wrangler.staging.jsonc
  ```
- **Kết quả xuất bản:**
  - **Worker Name:** `zerocoder-images-staging`
  - **Deployed URL:** `https://zerocoder-images-staging.zerocoder-dev.workers.dev`
  - **R2 Binding:** `PRIVATE_R2` ➔ `zerocoder-images-staging`
  - **Biến môi trường:** `FIREBASE_PROJECT_ID = "zerocoder-staging"`, `IMAGES_ENABLED = "true"`, `ALLOWED_ORIGINS = "http://localhost:5173"`
  - **Secrets:** `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (được bảo vệ an toàn).

---

## 4. Kết Quả 14 Bài Test Kiểm Thử Tích Hợp Staging Thực Tế (Smoke Tests)

File kiểm thử thực tế: `tests/integration/phase5-staging-smoke.test.mjs`  
Lệnh thực thi: `node --test tests/integration/phase5-staging-smoke.test.mjs`

| # | Mục kiểm thử | Hành vi kiểm tra | Kết quả | Thời gian |
|---|---|---|---|---|
| **1** | **Upload hình ảnh xác thực** | Gửi ảnh PNG 1x1 qua `PUT /v1/images/:id` với Firebase Token hợp lệ | **PASS (201 Created)** | 12.07s |
| **2** | **Tồn tại vật lý trên R2** | Kiểm tra object `images/v1/{uid}/notes/{id}.png` trên `zerocoder-images-staging` qua `wrangler r2 object get --remote` | **PASS (Status 0)** | 6.42s |
| **3** | **Toàn vẹn SHA-256** | Kiểm tra metadata endpoint `GET /v1/images/:id?metadata=1` trả về đúng SHA-256 và kích thước byte | **PASS (200 OK)** | 2.59s |
| **4** | **Tải ảnh xác thực & Header** | Tải ảnh `GET /v1/images/:id`, so sánh byte-for-byte và xác thực header `nosniff`, `x-image-sha256` | **PASS (200 OK, Exact Bytes)** | 2.02s |
| **5** | **Cách ly giữa người dùng** | Người dùng B cố truy cập ảnh của Người dùng A (`?owner=userA`) | **PASS (403 Forbidden)** | 0.60s |
| **6** | **Bảo vệ Feedback không phải Admin** | Người dùng thường cố truy cập Feedback của người khác | **PASS (403 Forbidden)** | 1.50s |
| **7** | **Cơ chế Detach ảnh chưa tham chiếu** | Yêu cầu `DELETE /v1/images/:id` trên ảnh đủ điều kiện lưu giữ (>24h) | **PASS (202 Accepted, state: detached)** | 6.41s |
| **8** | **Ngăn xóa ảnh đang được liên kết** | Yêu cầu `DELETE` ảnh đang được gắn trong tài liệu ghi chú Firestore | **PASS (409 Conflict)** | 12.82s |
| **9** | **Yêu cầu không xác thực** | Gửi request tải ảnh khi không truyền Authorization Bearer | **PASS (401 Unauthorized)** | 0.13s |
| **10** | **Dữ liệu sai lệch / Hash mismatch** | Gửi header `X-Image-SHA256` sai lệch so với nội dung binary | **PASS (400 Bad Request)** | 1.48s |
| **11** | **Giới hạn Rate/Quota người dùng** | Seed quota người dùng vượt ngưỡng 20 upload/giờ, request upload tiếp theo | **PASS (429 Too Many Requests)** | 3.93s |
| **12** | **Ngân sách lưu trữ toàn cục (Budget)** | Seed ngân sách `image_budgets/global` vượt mức 1 GiB | **PASS (429 Too Many Requests)** | 4.61s |
| **13** | **Khóa cạnh tranh (Concurrency Lock)** | Gửi upload khi đang có tiến trình bảo trì/rollback gắn active lock | **PASS (409 Conflict)** | 3.77s |
| **14** | **Nhất quán Firestore & Cách ly Production** | Xác nhận metadata đã chuyển `detached` trên Staging và hoàn toàn `404 Not Found` trên Production `zerocoder-8cb6b` | **PASS (404 trên Production)** | 0.99s |

**Tổng kết:** **14/14 PASS**, 0 thất bại, 0 bị hủy.

---

## 5. Kết Quả Bộ Kiểm Thử Hồi Quy & Toàn Vẹn Hệ Thống

1. **Bộ Unit, Integration & Regression tests:**
   - Lệnh: `node --test tests/images/*.test.mjs tests/integration/phase3-app.test.mjs tests/migration/*.test.mjs tests/regression/*.test.mjs`
   - Kết quả: **40/40 PASS** (0 fail, 4.22s).
2. **Bộ Offline Tests:**
   - Lệnh: `npm run test:offline`
   - Kết quả: **15/15 PASS** (0 fail, 2.62s).
3. **Kiểm tra cấu hình & liên kết tài liệu:**
   - Lệnh: `node tools/agents/check-config.mjs`
   - Kết quả: **0 errors** (33 files markdown, 92 local links, 12 skill entries).
4. **Linter:**
   - Lệnh: `npm run lint` (`oxlint`)
   - Kết quả: **0 errors**, 111 warnings (toàn bộ là warning có từ trước).
5. **Production Build:**
   - Lệnh: `npm run build` (`vite build`)
   - Kết quả: **Thành công (built in 18.37s)**, toàn bộ bundle hợp lệ.
6. **GitNexus Graph Analysis:**
   - Lệnh: `detect_changes(scope: "all")`
   - Kết quả: `risk_level: "low"`, `changed_count: 0`, `affected_count: 0`.
7. **Bảo toàn thay đổi trước:**
   - File `tests/regression/phase5-regression.test.mjs` được giữ nguyên vẹn 100%.

---

## 6. Kết Luận & Sẵn Sàng Chuyển Giao

Giai đoạn Staging Phase 5 đã hoàn tất toàn bộ các mục tiêu kỹ thuật:
- Môi trường Staging biệt lập đã hoạt động ổn định trên live Cloudflare + Google Cloud.
- Hệ thống quyền Least-Privilege IAM 6 quyền đã được kiểm chứng hoạt động chính xác với Firestore REST API.
- Cloudflare Worker đã xử lý thông suốt toàn bộ luồng upload, download, SHA-256 verify, quota limit, concurrency lock, và detach lifecycle.
- Tuyệt đối không có bất kỳ rò rỉ credential nào vào mã nguồn hay git tree.
- Hạ tầng Production `zerocoder-8cb6b` được bảo vệ an toàn 100%, không bị sửa đổi.
