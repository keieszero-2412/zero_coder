---
trigger: always_on
glob: "**/*"
description: "Core project knowledge, architecture and history for ZeroCoder"
---

# ZERO CODER - Project Overview & Guidelines

## 1. Thông tin cơ bản (Project Basics)
- **Tech Stack**: React 19, Vite 8, Firebase 12 (Auth/Firestore).
- **Core Feature**: Nền tảng học và chạy code Python trực tiếp trên trình duyệt (sử dụng Pyodide qua Web Worker chạy ngầm), tích hợp hệ thống Trợ lý AI đa nền tảng (Gemini, Groq, Mistral, OpenRouter) hỗ trợ chấm điểm, gợi ý lỗi, tự động sửa mã và diff review.
- **Styling**: Vanilla CSS thuần (không dùng Tailwind) tập trung toàn bộ ở file `src/index.css`. Giao diện theo phong cách hiện đại (Premium, Glassmorphism, Micro-animations) tương thích 6 bộ theme.

## 2. Cấu trúc dự án (Architecture)
- `src/pages/`: Các trang chính:
  - `Auth.jsx`: Đăng nhập, đăng ký, quên mật khẩu, yêu cầu cấp quyền truy cập.
  - `Dashboard.jsx`: Danh sách bài tập, phân loại theo kỳ/danh mục, tiến độ, ghi chú.
  - `Workspace.jsx`: Không gian lập trình bài tập (Editor, Test cases, Terminal, AI Assistant).
  - `LearningWorkspace.jsx` / `Learning.jsx`: Không gian học lý thuyết tương tác với Jupyter Notebook.
  - `Unauthorized.jsx`: Trang thông báo chưa được cấp quyền duyệt tài khoản.
- `src/components/`: Các UI Component tái sử dụng:
  - `CodeEditor.jsx`: Khung soạn thảo CodeMirror 6 (Python, Vim mode, đồng bộ theme).
  - `NotebookViewer.jsx`: Trình hiển thị & chạy từng cell notebook `.ipynb` (hỗ trợ KaTeX, Markdown, Output).
  - `AIAssistant.jsx` / `LearningAIChat.jsx`: Trợ lý AI "Zero" cho bài tập & bài giảng notebook.
  - `AdminPanel.jsx`: Bảng quản trị (duyệt học viên, cấp quyền, reset mật khẩu, seed bài tập).
  - `FeedbackWidget.jsx`: Widget gửi góp ý/báo lỗi kèm ảnh chụp màn hình (canvas/upload).
  - `FileBrowser.jsx`: Quản lý & xem trước file dataset (CSV, JSON, ảnh) bằng modal nổi.
  - `TerminalOutput.jsx`, `TestResults.jsx`, `ProblemDescription.jsx`, `SettingsModal.jsx`, `AboutModal.jsx`, `CheatsheetModal.jsx`.
- `src/context/`: Quản lý Global State:
  - `AuthContext.jsx`: Quản lý người dùng, phân quyền (admin / student), kiểm tra quyền email.
  - `ProblemsContext.jsx`: Quản lý danh sách bài tập (SWR cache từ localStorage & Firestore, auto-seed từ `problems.json`).
  - `SettingsContext.jsx`: Cài đặt giao diện (6 Themes, Font size, Vim mode).
  - `NotificationContext.jsx`: Modal thông báo & Toast custom (thay thế triệt để alert/confirm).
  - `TermContext.jsx`: Trạng thái kỳ học đang chọn (Midterm / Final).
- `src/config/`:
  - `firebase.js`: Cấu hình kết nối Firebase Auth & Firestore.
  - `aiService.js`: Dịch vụ AI đa nguồn (Groq, Gemini, OpenRouter, Mistral) với cơ chế tự động Fallback khi rate limit.
- `src/hooks/`:
  - `python.worker.js`: Web Worker chạy Pyodide (WASM), nạp package tự động, gắn mount dataset (`pyodide.FS`), chạy code & test cases.
  - `usePython.js`: React hook quản lý Shared Worker (pre-warm khởi động Pyodide từ sớm, hàng đợi request).
- `src/theme/`:
  - `CodeTheme.js`: Cấu hình theme CodeMirror (VS Code Dark / GitHub Light) trong suốt và đồng bộ hoàn hảo với 6 UI themes.
- `public/`:
  - `pyodide/`: Thư viện Pyodide offline phục vụ WebAssembly execution.
  - `lectures/`: Thư mục chứa các bài giảng `.ipynb`, dataset files, và file chỉ mục `lectures.json`.
  - `problems.json`: Ngân hàng bài tập dự phòng dùng để auto-seed lên Firestore khi database rỗng.

## 3. Lịch sử các thay đổi & Cơ chế quan trọng (Past Changes & Key Mechanics)
*Agents cần tham khảo phần này để không làm hỏng các logic đã được tinh chỉnh kĩ:*
- **Hệ thống Theme (Theming)**: Hỗ trợ 6 bộ màu (Midnight, Daylight, Blush, Oceanic, Carbon, Amber). Logic nằm trong `SettingsContext` và CSS variables ở `:root` hoặc `body.theme-*` của `index.css`. **Theme mặc định khi chưa login/chưa lưu cài đặt bắt buộc phải là Midnight (dark mode gốc)**.
- **Code Editor (CodeMirror)**: Khung gõ code đã được cấu hình background đồng bộ với 6 giao diện theme (ví dụ: Blush có nền hồng phớt `#FFF5F7`). Đã xử lý triệt để lỗi "khoảng đen" ở dưới đáy khi gõ không hết màn hình (bằng flexbox kéo giãn 100% height).
- **Giao diện di động (Mobile UI)**: Các nút bấm (Run, Check, Reset, Ask AI) đã được CSS đồng bộ thành hình tròn hoàn hảo 36x36 (căn giữa icon, ẩn chữ) khi xem trên điện thoại. Các nút bấm dạng Text Toggle (như Flag/Flagged) phải được cố định Width (fixed width wrapper) để tránh bị giật khung (stutter/khựng animation) mỗi khi đổi chữ.
- **Hệ thống Thông báo (NotificationContext)**: Toàn bộ các cảnh báo gốc của trình duyệt (`window.alert`, `window.confirm`) đã được thay thế hoàn toàn bằng hệ thống Modal và Toast thông báo Custom đẹp mắt (nằm trong `NotificationContext.jsx`).
- **Scrollbar & Căn lề Sticky (Double Scrollbar Bug)**: Tuyệt đối không lồng ghép nhiều thẻ có `overflow: 'auto'` lồng nhau (vd: `Layout` và `Dashboard` không được cùng có overflow). Khi dùng `position: sticky` (vd: dải menu mục lục ở Dashboard), nó phải bám chuẩn vào mép thanh cuộn gốc để không bị hở khoảng trắng hoặc nhảy loạn xạ lên trên.
- **Điều hướng & Tải Dữ liệu (Router/Loader)**: Các trang link con như `/workspace/:id` phải chờ `isFetching` (tải nền Firebase) kết thúc trước khi đưa ra quyết định redirect `navigate('/')`. Không được redirect nóng khi `currentProblem` vắng mặt nếu hệ thống đang lấy dữ liệu.
- **Lỗi Sập Giao Diện (Vite Fatal Error):** Bất cứ lúc nào import các UI Icon (vd: `lucide-react`), phải kiểm tra thật kĩ tên icon có tồn tại trong version không (vd lỗi missing export `Github` icon). Lỗi này sẽ tạo ra màn hình đen thui che kín web.
- **Markdown & Toán Học**: Phần Interactive Learning (đọc notebook) đã được tích hợp render text markdown kết hợp công thức toán chuẩn (`remarkMath`, `rehypeKatex`), không tự ý chỉnh sửa phá vỡ luồng hiển thị này.
- **Chuyển bài liền mạch (Seamless Next/Prev):** Khi tính toán bài tập tiếp theo ở `Workspace.jsx`, tuyệt đối không dùng mảng `problems` gốc chưa phân loại vì thứ tự ID trong cơ sở dữ liệu có thể bị loạn. Bắt buộc phải tuân thủ logic tạo mảng `orderedProblems` (lọc theo `currentTerm` và gộp theo nhóm `category` y hệt như cách Dashboard làm). Nút Next phải hiện tên bài tiếp theo (vd: `Next: Mock test 2`) khi nhảy sang phần mới, và chuyển thành nút `Finish` (về trang chủ) ở bài cuối cùng, nghiêm cấm việc để nút Next biến mất đột ngột.
- **Xem trước File Dataset (File Preview Modal):** Không dùng thẻ a (anchor) để mở file Dataset trực tiếp (trong FileBrowser) vì React Router/Firebase có thể bắt nhầm đường dẫn tĩnh `/lectures/...` và vô tình redirect người dùng về trang chủ (mất trạng thái hiện tại). Luôn dùng `fetch` để lấy nội dung text/csv/json hoặc dùng thẻ hình ảnh và hiển thị nó lên một Popup Modal nổi (kèm chức năng phóng to/thu nhỏ) ngay tại trang hiện tại.
- **Tối Ưu Thời Gian Tải Trang (Chống Lỗi Đen Màn Hình/Flicker):** Khi điều hướng giữa các trang con (vd: từ Dashboard vào Workspace, hay LearningWorkspace), TUYỆT ĐỐI không để các hiệu ứng `isLoading`/`isFetching` cản trở việc hiển thị nếu dữ liệu đã có sẵn trong Local Cache hoặc Global State. Việc render ra một thẻ `div` chứa spinner Loading trên một nền đen (`var(--bg-base)` của dark mode) sẽ bị user nhầm tưởng là "lỗi đen màn hình". Các state loading (như đọc JSON/Markdown nội dung bài học) phải được cache ngay vào bộ nhớ đệm (như `useMemo` hoặc Map cache) để khi bấm vào lần tiếp theo, trang sẽ render lập tức (Instant Render) mà không hiện lại loader.
- **An Toàn Khi Cập Nhật Interactive Learning (Chống Lỗi Đen Màn Hình Chết Chóc):** Bất cứ khi nào sửa đổi component trong trang Interactive Learning (như `LearningWorkspace.jsx`, `NotebookViewer.jsx`), TUYỆT ĐỐI KHÔNG import bừa bãi các thư viện, icon (`lucide-react`) hoặc Component chưa được kiểm chứng. Bất kỳ một import lỗi (missing export) hoặc syntax error nào ở đây đều có thể làm sập toàn bộ cây React (React Tree Crash), dẫn đến hiện tượng người dùng vừa bấm vào bài học là bị "màn hình đen thui" ngay từ đầu. Phải luôn double-check kỹ tên icon và đảm bảo component bọc (wrapper) đã có Error Boundary nếu có rủi ro cao.
- **Cơ Chế Shared Web Worker (Pyodide Singleton):** `usePython.js` khởi tạo `sharedWorker` toàn cục (Pre-warm) ngay khi file hook được import. Khi người dùng chuyển đổi qua lại giữa các bài tập hoặc trang học, Worker KHÔNG bị khởi tạo lại từ đầu, giữ nguyên môi trường Pyodide đã tải, giúp tốc độ chạy code luôn đạt mức tức thì.
- **Dịch Vụ AI Đa Nền Tảng (Multi-Provider Fallback):** Hệ thống AI trong `aiService.js` tự động luân chuyển từ Groq -> Gemini -> OpenRouter -> Mistral nếu một bên gặp sự cố hoặc vượt quá giới hạn (Rate limit / 429). Trong chế độ sửa lỗi (`isFixMode = true`), AI bắt buộc chỉ trả về mã nguồn trong block Python thuần (không kèm văn bản giải thích) để phục vụ tính năng Diff Viewer so sánh code tự động.

## 4. Nguyên tắc chung khi code (Rules for Agents)
- Luôn ưu tiên thiết kế hiện đại, tránh màu sắc tẻ nhạt. Nút bấm, panel phải có hover, transition, box-shadow.
- Khi thay đổi giao diện, phải kiểm tra khả năng tương thích của tất cả 6 themes và kích thước mobile/laptop.
- **Tính đáp ứng & Mức Zoom (Responsive & Zooming):** Mỗi lần chỉnh sửa giao diện, BẮT BUỘC phải đảm bảo thiết kế hiển thị đẹp, hoàn hảo trên cả Laptop và Điện thoại (Mobile), đồng thời không bị vỡ layout ở bất kỳ mức zoom (phóng to/thu nhỏ) nào trên trình duyệt của máy.
- Không bao giờ thêm các file CSS thư viện bên thứ 3 (như Tailwind) trừ khi người dùng yêu cầu rõ ràng. Tất cả viết vào `index.css`.
- Dùng dấu link tuyệt đối (absolute file links) khi trích dẫn file/code.
- **Kiểm Soát Hồi Quy (Regression Prevention):** Bất cứ khi nào sửa đổi hoặc fix bug mới, BẮT BUỘC phải rà soát lại các lỗi cũ đã từng xảy ra (đặc biệt là các lỗi được ghi chép trong mục 3) và cẩn trọng để không làm "tái phát" những lỗi đó. Mỗi khi thêm code mới, tuyệt đối không được vô tình phá vỡ hay ghi đè các tính năng, biến số (variables) đang hoạt động tốt.
- **Bảo Toàn Các File Đang Hoạt Động (Preserve Unaffected Files):** Khi phát triển tính năng mới (features) hoặc sửa bất kỳ lỗi nào (bug fixes), TUYỆT ĐỐI KHÔNG được sửa đổi lan man, xóa bỏ hoặc làm hỏng các file đang hoạt động bình thường và không liên quan đến lỗi. Chỉ khoanh vùng chỉnh sửa chính xác các file/hàm mục tiêu cần can thiệp. Phải luôn đánh giá phạm vi ảnh hưởng (impact & side effects), đảm bảo rằng mã mới được tích hợp hoàn toàn tương thích và không làm gián đoạn bất kỳ chức năng nào của các file khác.
- **Bảo Toàn Bài Giảng Đã Sửa (Notebook Freeze):** Đối với các file Notebook (`.ipynb`) trong thư mục `public/lectures/`, nếu một bài giảng đã được sửa và hoạt động tốt (đã fix lỗi hiển thị, lỗi API...), TUYỆT ĐỐI KHÔNG can thiệp, chỉnh sửa hay đè code lên file đó nữa. Tránh tình trạng sửa một lỗi nhỏ ở chỗ này nhưng lại làm hỏng định dạng hoặc phá vỡ cấu trúc của file notebook đã hoàn thiện.
