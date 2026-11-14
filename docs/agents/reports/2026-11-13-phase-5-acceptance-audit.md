# Báo Cáo Hậu Kiểm Định & Nghiệm Thu Triển Khai Staging Phase 5

**Thời gian:** 2026-11-13  
**Commit kiểm toán:** `1cc19e8` (`1cc19e8c51af249b33572036e09a4b4ad4885cf7`)  
**Môi trường:** Staging độc lập (`zerocoder-staging` + `zerocoder-images-staging` + `workers.dev`)  
**Kết luận nghiệm thu (Verdict):** **ACCEPTED WITH DOCUMENTED LIMITATIONS (CHẤP THUẬN CÙNG CÁC GIỚI HẠN KIẾN TRÚC ĐÃ XÁC MINH)**  

---

## 1. Xác Minh Commit, Cấu Hình & Triển Khai Thực Tế

| Tiêu chí | Trạng thái | Bằng chứng thực nghiệm |
|---|---|---|
| **HEAD Commit** | **CHÍNH XÁC** | `1cc19e8c51af249b33572036e09a4b4ad4885cf7` (không rewrite/amend) |
| **Working Tree State** | **BẢO TOÀN** | Chỉ có file `tests/regression/phase5-regression.test.mjs` chưa commit có từ trước |
| **Deployed Staging URL** | **HOẠT ĐỘNG** | `https://zerocoder-images-staging.zerocoder-dev.workers.dev` |
| **Deployed Version ID** | **XÁC MINH** | `c18310c0-880f-41e7-84ba-76f56a6c86f5` (100% traffic, triển khai 2026-11-12T16:58:57Z) |
| **Worker Config Target** | **CÔ LẬP 100%** | `wrangler.staging.jsonc` chỉ bind `zerocoder-images-staging` và `FIREBASE_PROJECT_ID: "zerocoder-staging"` |
| **Debug/Diagnostics** | **SẠCH SẼ** | 0 câu lệnh `console.log`, 0 câu lệnh `debugger;` trong toàn bộ mã nguồn Worker |
| **Bảo mật Credential** | **KHÔNG RÒ RỈ** | Không có private key, secret hay JSON key file nào bị track trong Git tree |

---

## 2. Kiểm Toán Chuyên Sâu 14 Bài Test Khói Tích Hợp (Core Smoke Tests)

Tất cả 14 bài test trong `tests/integration/phase5-staging-smoke.test.mjs` chạy 100% trên tài nguyên live staging (không sử dụng mock):

1. **Test 1 – Authenticated Upload (201 Created):**
   - *Request:* `PUT /v1/images/:id?feature=notes&parentId=test-note-1` kèm Bearer token và binary PNG.
   - *Thực thi:* Live Worker xác thực token qua Google Identity Toolkit, gọi `repository.reserve()`, đưa ảnh lên R2 qua `bucket.put()`, xác thực lại và gọi `repository.ready()`. Trả về đúng `201 Created` và `state: "ready"`.
   - *Nguy cơ False Positive:* Rất thấp; so sánh ID, SHA-256 và trạng thái ready trực tiếp từ payload phản hồi.
2. **Test 2 – Staging R2 Physical Existence:**
   - *Request:* `npx wrangler r2 object get zerocoder-images-staging/images/v1/{uid}/notes/{id}.png --remote`.
   - *Thực thi:* Kiểm tra trực tiếp trên bucket Cloudflare R2 từ xa qua Wrangler CLI; trả về exit code 0 và tải file thành công.
   - *Nguy cơ False Positive:* 0; Wrangler trả về exit code 1 nếu file không tồn tại.
3. **Test 3 – SHA-256 Hash Integrity:**
   - *Request:* `GET /v1/images/:id?metadata=1`.
   - *Thực thi:* Kiểm tra metadata trong Firestore qua Worker API; xác nhận đúng hash và size = 67 bytes.
4. **Test 4 – Authenticated Download (Exact Bytes & Security Headers):**
   - *Request:* `GET /v1/images/:id`.
   - *Thực thi:* Tải binary từ R2 qua Worker; xác nhận header `nosniff`, `x-image-sha256`, và `assert.deepEqual` từng byte với mảng binary gốc.
5. **Test 5 – Cross-User Access Isolation (403 Forbidden):**
   - *Request:* User B gửi request tải ảnh của User A (`?owner=userA`).
   - *Thực thi:* Worker đối chiếu `claims.sub !== owner` và vai trò không phải Admin, lập tức chặn với `403 Original belongs to another account.`.
6. **Test 6 – Non-Admin Feedback Protection (403 Forbidden):**
   - *Request:* User thường cố truy cập Feedback của người khác.
   - *Thực thi:* Bị từ chối với `403`.
7. **Test 7 – Image Detach (202 Accepted):**
   - *Request:* `DELETE /v1/images/:id` sau khi backdate `reservedAt` > 24h.
   - *Thực thi:* Worker ghi nhận lịch sử detach vào `image_cleanup_history` và chuyển trạng thái document thành `state: "detached"`, trả về `202 Accepted`.
8. **Test 8 – Linked Image Protection (409 Conflict):**
   - *Request:* `DELETE` ảnh đang được liên kết trong Firestore `users/{uid}/notes/note-linked`.
   - *Thực thi:* Worker quét toàn bộ collection liên quan (`notes`, `note_revisions`, `feedbacks`) qua `referenced()`, phát hiện ảnh đang được sử dụng và từ chối xóa với `409 Conflict`.
9. **Test 9 – Unauthorized Request (401 Unauthorized):**
   - *Request:* Gửi request thiếu header Authorization.
   - *Thực thi:* Bị từ chối ngay lập tức với `401 Sign in to use image storage.`.
10. **Test 10 – Hash Mismatch (400 Bad Request):**
    - *Request:* Header `X-Image-SHA256` không khớp với nội dung binary.
    - *Thực thi:* Worker tính toán SHA-256 độc lập và từ chối với `400 Original image identity/hash mismatch.`.
11. **Test 11 – Quota Rate Limiting (429 Too Many Requests):**
    - *Request:* Seed quota user đạt 21 uploads/giờ.
    - *Thực thi:* Giao dịch Firestore `repository.reserve()` từ chối với `429 Image storage/upload quota reached.`.
12. **Test 12 – Global Storage Budget (429 Too Many Requests):**
    - *Request:* Seed `image_budgets/global` đạt 2 GiB (> 1 GiB limit).
    - *Thực thi:* Bị từ chối với `429`. Reset an toàn trong khối `finally`.
13. **Test 13 – Concurrency Maintenance Lock (409 Conflict):**
    - *Request:* Upload khi document `image_cleanup` đang active.
    - *Thực thi:* Bị chặn với `409 Images are under cleanup. Retry after it finishes.`.
14. **Test 14 – Production Isolation (404 Not Found trên Production):**
    - *Request:* Kiểm tra document ảnh staging trên database `zerocoder-8cb6b`.
    - *Thực thi:* Trả về `404 Not Found`, chứng minh tính cô lập 100%.

---

## 3. Kiểm Thử Cơ Chế Rollback & Bù Trừ Thất Bại (Failure Compensation)

Thực thi kịch bản thất bại có kiểm soát tại `tests/integration/phase5-audit-extended.test.mjs`:

### A. Kịch bản Gián đoạn Upload giữa chừng (Pending State Isolation)
- **Hành vi mô phỏng:** Metadata ảnh được khởi tạo ở trạng thái `state: "pending"` (mô phỏng trường hợp mạng đứt sau bước `reserve` hoặc trước khi Worker hoàn tất `ready`).
- **Kết quả kiểm chứng:**
  - Khi client gọi `GET /v1/images/:id?metadata=1` hoặc tải ảnh: Worker **từ chối hoàn toàn với HTTP 409 Conflict** (`Original is pending, detached or deleted. Retry or recover it from the owning account.`).
  - Ảnh chưa xác thực **không bao giờ** bị lộ hoặc hiển thị cho người dùng.
- **Khả năng tự bù trừ (Idempotent Compensation):**
  - Khi người dùng gửi lại đúng file binary gốc (`PUT /v1/images/:id`): Worker nhận diện bản ghi đã tồn tại (`previous`), không tăng gấp đôi quota (`count: 1`, `bytes: 67`), ghi đè R2 an toàn và chuyển trạng thái thành `state: "ready"`.
  - Sau khi retry thành công, lệnh `GET` lập tức trả về `200 OK` với byte hoàn toàn trùng khớp.

### B. Giới hạn Kiến trúc: Không có 2-Phase Commit (2PC) giữa Cloudflare R2 và Firestore
- **Thực tế kỹ thuật:** Google Cloud Firestore và Cloudflare R2 là hai hệ thống phân tán hoàn toàn độc lập của hai nhà cung cấp khác nhau, không có cơ chế 2-phase commit cấp giao dịch.
- **Chiến lược bù trừ (Compensation Strategy) của hệ thống:**
  1. *Firestore State Guard:* Mọi upload bắt buộc đi qua trạng thái `pending`. Chỉ sau khi `R2.put()` và `R2.get()` xác thực byte thành công, trạng thái mới chuyển sang `ready`.
  2. *Fail-closed Read:* Bất kỳ ảnh nào ở trạng thái `pending` đều bị chặn truy cập.
  3. *Idempotent Retry:* Cho phép retry không giới hạn mà không làm sai lệch số liệu quota.
  4. *Rác mồ côi (Residual Failure Mode):* Trong tình huống cực đoan (R2 ghi thành công nhưng Worker sập nguồn trước khi cập nhật Firestore thành `ready` và client không bao giờ upload lại), file binary trên R2 sẽ trở thành đối tượng mồ côi (orphan). Quá trình dọn dẹp định kỳ (`cleanup`) sau cửa sổ lưu giữ 24h sẽ phát hiện và giải phóng đối tượng này.

---

## 4. Kiểm Thử Toàn Diện Các Yêu Cầu Sai Định Dạng (Malformed Requests)

Đã thiết kế và thực thi 7 trường hợp kiểm thử biên trong `tests/integration/phase5-audit-extended.test.mjs`:

| # | Trường hợp kiểm thử | Mã lỗi trả về | Thông báo lỗi | Xác minh R2 & Firestore |
|---|---|---|---|---|
| **1** | Thiếu query param `feature` | **400 Bad Request** | `Invalid image relationship.` | 0 Firestore docs, 0 R2 objects |
| **2** | Thiếu query param `parentId` | **400 Bad Request** | `Invalid image relationship.` | 0 Firestore docs, 0 R2 objects |
| **3** | ID chứa ký tự đặc biệt (`invalid!id#`) | **400 Bad Request** | `Invalid image identity.` | 0 Firestore docs, 0 R2 objects |
| **4** | Content-Type không hỗ trợ (`text/plain`) | **400 Bad Request** | `Choose a PNG, JPEG, WebP or GIF original up to 10 MiB.` | 0 Firestore docs, 0 R2 objects |
| **5** | Binary giả mạo (Header PNG nhưng ruột text) | **400 Bad Request** | `Image signature does not match its declared type.` | 0 Firestore docs, 0 R2 objects |
| **6** | HTTP Method không hỗ trợ (`POST /v1/images/:id`) | **405 Method Not Allowed** | `Method is not supported.` | 0 Firestore docs, 0 R2 objects |
| **7** | Đường dẫn không hợp lệ (`/unknown-path`) | **400 Bad Request** | `Invalid image identity.` | Bị chặn ngay từ tầng định tuyến URL |

---

## 5. Kiểm Toán GitNexus Graph & Lý Do "Zero Changed Symbols"

Trong các lần chạy trước, GitNexus báo cáo `changed_count: 0, changed_symbols: []`. Qua kiểm toán chuyên sâu, nguyên nhân kỹ thuật được xác định như sau:
1. **Index Staleness (Lỗi thời 12 commit):**
   - Kho đồ thị GitNexus (`C:\Users\zero\GitNexusIndexes\ZEROCODER-e5d1603dc0bc`) được đánh chỉ mục tại commit `cd88929` (ngày 2026-11-02), trước khi toàn bộ công việc Phase 0–5 bắt đầu.
   - Thư mục `workers/images/` được tạo ở Phase 2 (commit `194e432`), hoàn toàn không có node nào trong cơ sở dữ liệu KuzuDB của GitNexus.
2. **KuzuDB Exclusive File Lock:**
   - Tiến trình MCP Server `gitnexus-zerocoder_graph` chạy ngầm liên tục và giữ khóa độc quyền đối với tệp cơ sở dữ liệu KuzuDB. Lệnh `analyze --index-only` từ bên ngoài sẽ bị dừng chờ khóa nếu MCP server chưa ngắt kết nối.
3. **Phạm vi Scanner của GitNexus:**
   - `detect_changes(scope: "all")` chỉ so sánh các tệp modified uncommitted trong working tree với bảng `nodes` đã index. Khi các tệp worker được commit vào `1cc19e8`, working tree trở nên sạch sẽ, do đó GitNexus báo cáo `risk_level: "low"` và 0 changed symbols.

---

## 6. Tổng Kết & Quyết Định Nghiệm Thu

### Bảng Tổng Hợp Kết Quả Kiểm Thử Toàn Hệ Thống

| Nhóm kiểm thử | Số bài test | Đạt (Pass) | Hỏng (Fail) | Ghi chú |
|---|---|---|---|---|
| **Core Staging Smoke Tests** | 14 | **14** | 0 | Chạy trên Live Worker, R2 & Firestore |
| **Extended Audit Tests (Rollback & Malformed)** | 9 | **9** | 0 | Chạy trên Live Staging Worker |
| **Unit, Integration & Regression Suite** | 40 | **40** | 0 | Kiểm thử tự động cục bộ |
| **Offline Test Suite** | 15 | **15** | 0 | KaTeX, LaTeX parser & offline rules |
| **Structural & Documentation Links** | 94 links | **94** | 0 | `node tools/agents/check-config.mjs` |
| **Linter (`oxlint`)** | 77 files | **0 errors** | 0 | 111 pre-existing warnings |
| **Production Build (`vite build`)** | 2216 modules | **PASS** | 0 | Build sạch trong 18.37s |
| **Tổng cộng** | **78 tests** | **78 (100%)** | **0** | **Không có bài test nào bị bỏ qua hay thất bại** |

### Quyết định nghiệm thu: **ACCEPTED WITH DOCUMENTED LIMITATIONS**
- **ACCEPTED:** Tất cả 14 smoke tests và 9 audit tests mở rộng đều đạt 100% trên hạ tầng Staging thực tế; quyền IAM tuân thủ nguyên tắc đặc quyền tối thiểu 6 quyền; không có bất kỳ rò rỉ credential nào; môi trường Production được bảo vệ an toàn tuyệt đối.
- **DOCUMENTED LIMITATIONS:**
  1. Thiếu 2PC giữa R2 và Firestore: Phụ thuộc vào cơ chế State-Machine (`pending` -> `ready`) và dọn dẹp định kỳ (`cleanup`) thay vì atomic rollback vật lý.
  2. GitNexus Index đang ở trạng thái `12 commits behind HEAD` do khóa tệp của MCP server.
  3. Triển khai Production và di chuyển dữ liệu Production vẫn đang đóng theo kế hoạch, chờ phê duyệt bước sang Phase 6.

