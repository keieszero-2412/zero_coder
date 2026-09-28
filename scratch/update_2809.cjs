const fs = require('fs');

const newProblems = [
  {
    id: 'final_2809_test_11',
    category: 'Last-term 2809 test',
    title: 'Question 1: Làm sạch dữ liệu lô hàng (clean_shipments)',
    description: '<p><b>Yêu cầu:</b></p><p>Phòng điều độ nhận danh sách lô hàng từ nhiều đại lý, mỗi lô là một <code>dict</code> gồm <code>\'id\'</code>, <code>\'port\'</code> (mã cảng), <code>\'weight\'</code> (tấn) và <code>\'status\'</code>. Dữ liệu nhập tay nên còn lỗi: thừa khoảng trắng, viết hoa/thường lộn xộn, trọng lượng sai.</p><p>Viết hàm <code>clean_shipments(shipments)</code> trả về <b>danh sách lô hàng hợp lệ đã làm sạch</b>, giữ nguyên thứ tự ban đầu.</p><ul><li>Bỏ lô có <code>weight</code> là <code>None</code> hoặc <code>&lt;= 0</code>.</li><li>Bỏ lô có trạng thái là <code>"cancelled"</code> (sau khi bỏ khoảng trắng hai đầu và đổi về chữ thường).</li><li>Mỗi lô giữ lại là dict mới chỉ gồm <code>\'id\'</code>, <code>\'port\'</code> (bỏ khoảng trắng hai đầu, viết HOA) và <code>\'weight\'</code> (làm tròn 2 chữ số thập phân).</li></ul>',
    hint: 'Duyệt qua từng lô hàng, kiểm tra điều kiện của weight (khác None và > 0) và status (không phải cancelled sau khi strip và lower). Sau đó chuẩn hóa port bằng strip().upper() và làm tròn weight với round(weight, 2).',
    initialCode: 'def clean_shipments(shipments):\n    # Your code here\n    pass\n',
    defaultCode: 'def clean_shipments(shipments):\n    # Your code here\n    pass\n',
    answer_key: 'def clean_shipments(shipments):\n    result = []\n    for s in shipments:\n        w = s.get(\'weight\')\n        if w is None or w <= 0:\n            continue\n        status = str(s.get(\'status\', \'\')).strip().lower()\n        if status == \'cancelled\':\n            continue\n        port = str(s.get(\'port\', \'\')).strip().upper()\n        result.append({\n            \'id\': s.get(\'id\'),\n            \'port\': port,\n            \'weight\': round(float(w), 2)\n        })\n    return result\n',
    testCases: [
      {
        id: 1,
        code: "print(clean_shipments([\n    {'id': 'S1', 'port': ' hph ', 'weight': 12.346, 'status': 'Delivered'},\n    {'id': 'S2', 'port': 'CLI', 'weight': 3.0, 'status': 'cancelled'},\n    {'id': 'S4', 'port': 'CLI', 'weight': 3.0, 'status': 'Delivered'}\n]))",
        expected: "[{'id': 'S1', 'port': 'HPH', 'weight': 12.35}, {'id': 'S4', 'port': 'CLI', 'weight': 3.0}]"
      },
      {
        id: 2,
        code: "print(clean_shipments([]))",
        expected: "[]"
      },
      {
        id: 3,
        code: "print(clean_shipments([\n    {'id': 'S2', 'port': 'sgn', 'weight': -5.5, 'status': 'Delivered'},\n    {'id': 'S3', 'port': 'sgn', 'weight': 0, 'status': 'Delivered'},\n    {'id': 'S5', 'port': 'sgn', 'weight': None, 'status': 'Delivered'},\n    {'id': 'S6', 'port': 'sgn', 'weight': 10, 'status': ' CANCELLED '}\n]))",
        expected: "[]"
      }
    ]
  },
  {
    id: 'final_2809_test_24',
    category: 'Last-term 2809 test',
    title: 'Question 2: Thống kê độ trễ theo cảng (port_delay_stats)',
    description: '<p><b>Yêu cầu:</b></p><p>Mỗi bản ghi giao hàng là một <code>tuple (cang, so_ngay_tre)</code>. Nếu <code>so_ngay_tre</code> âm nghĩa là tàu đến <b>sớm</b>.</p><p>Viết hàm <code>port_delay_stats(records)</code> trả về một <code>dict</code> thống kê độ trễ theo từng cảng, dạng <code>{cang: (so_lo, tre_trung_binh, tre_lon_nhat)}</code>.</p><ul><li>Số ngày trễ âm (đến sớm) được tính là <code>0</code> trước khi thống kê.</li><li><code>tre_trung_binh</code> làm tròn 2 chữ số thập phân.</li><li>Khoá của dict sắp xếp theo thứ tự bảng chữ cái của tên cảng; danh sách rỗng → <code>{}</code>.</li></ul>',
    hint: 'Duyệt qua từng bản ghi, thay số ngày trễ âm bằng 0. Nhóm theo tên cảng, tính số lô, trung bình (làm tròn 2), và max. Cuối cùng sắp xếp dict theo key bằng dict(sorted(...)).',
    initialCode: 'def port_delay_stats(records):\n    # Your code here\n    pass\n',
    defaultCode: 'def port_delay_stats(records):\n    # Your code here\n    pass\n',
    answer_key: 'def port_delay_stats(records):\n    if not records:\n        return {}\n    data = {}\n    for port, delay in records:\n        d = max(delay, 0)\n        if port not in data:\n            data[port] = []\n        data[port].append(d)\n    result = {}\n    for port in sorted(data.keys()):\n        vals = data[port]\n        n = len(vals)\n        avg = round(sum(vals) / n, 2)\n        mx = max(vals)\n        result[port] = (n, avg, mx)\n    return result\n',
    testCases: [
      {
        id: 1,
        code: "print(port_delay_stats([('HPH', 2), ('CLI', 0), ('HPH', 5), ('CLI', -1), ('DAD', 3)]))",
        expected: "{'CLI': (2, 0.0, 0), 'DAD': (1, 3.0, 3), 'HPH': (2, 3.5, 5)}"
      },
      {
        id: 2,
        code: "print(port_delay_stats([]))",
        expected: "{}"
      },
      {
        id: 3,
        code: "print(port_delay_stats([('SGN', -5), ('SGN', -2), ('UIH', -10)]))",
        expected: "{'SGN': (2, 0.0, 0), 'UIH': (1, 0.0, 0)}"
      }
    ]
  },
  {
    id: 'final_2809_test_1',
    category: 'Last-term 2809 test',
    title: 'Question 3: Mô hình hồi quy tuyến tính (fit_predict)',
    description: '<p><b>Yêu cầu:</b></p><p>Công ty vận tải muốn ước lượng <b>chi phí vận chuyển</b> y (triệu đồng) theo <b>quãng đường</b> x (km) bằng mô hình hồi quy tuyến tính một biến y = a \u00b7 x + b, huấn luyện bằng phương pháp bình phương tối thiểu.</p><p>Viết hàm <code>fit_predict(xs, ys, x_new)</code> trả về <code>tuple (a, b, y_du_doan)</code>. Không dùng thư viện ngoài.</p><ul><li>a = \u03a3(x - x\u0304)(y - y\u0304) / \u03a3(x - x\u0304)\u00b2, b = y\u0304 - a\u00b7x\u0304 (x\u0304, y\u0304 là trung bình của xs, ys).</li><li>y_du_doan = a \u00b7 x_new + b, tính bằng a, b <b>chưa làm tròn</b>.</li><li>Làm tròn a, b 4 chữ số thập phân và y_du_doan 2 chữ số thập phân.</li><li>Nếu mọi giá trị trong <code>xs</code> bằng nhau (mẫu số bằng 0) \u2192 trả về <code>None</code>.</li></ul>',
    hint: 'Tính x\u0304 = sum(xs)/len(xs), y\u0304 tương tự. Dùng vòng lặp tính tử số \u03a3(xi-x\u0304)(yi-y\u0304) và mẫu số \u03a3(xi-x\u0304)\u00b2. Nếu mẫu số = 0 thì return None. Tính a, b, y_pred rồi làm tròn theo đề bài.',
    initialCode: 'def fit_predict(xs, ys, x_new):\n    # Your code here\n    pass\n',
    defaultCode: 'def fit_predict(xs, ys, x_new):\n    # Your code here\n    pass\n',
    answer_key: 'def fit_predict(xs, ys, x_new):\n    n = len(xs)\n    x_bar = sum(xs) / n\n    y_bar = sum(ys) / n\n    num = sum((xs[i] - x_bar) * (ys[i] - y_bar) for i in range(n))\n    den = sum((xs[i] - x_bar) ** 2 for i in range(n))\n    if den == 0:\n        return None\n    a = num / den\n    b = y_bar - a * x_bar\n    y_pred = a * x_new + b\n    return (round(a, 4), round(b, 4), round(y_pred, 2))\n',
    testCases: [
      {
        id: 1,
        code: "print(fit_predict([100, 200, 300, 400], [2.1, 3.9, 6.2, 7.8], 500))",
        expected: "(0.0194, 0.15, 9.85)"
      },
      {
        id: 2,
        code: "print(fit_predict([100, 100, 100], [2.1, 3.9, 6.2], 500))",
        expected: "None"
      }
    ]
  },
  {
    id: 'final_2809_test_10',
    category: 'Last-term 2809 test',
    title: 'Question 4: Tính phí lưu container (demurrage_fee)',
    description: '<p><b>Yêu cầu:</b></p><p>Khi container được dỡ xuống cảng, chủ hàng có một số <b>ngày lưu miễn phí</b> (free time). Hết free time mà chưa lấy hàng thì phải trả <b>phí lưu container</b> (demurrage).</p><p>Viết hàm <code>demurrage_fee(arrival, pickup, free_days)</code> với <code>arrival</code>, <code>pickup</code> là đối tượng <code>datetime.date</code> (pickup >= arrival), trả về <code>tuple (so_ngay_tinh_phi, tong_phi_usd)</code>.</p><ul><li>Xét lần lượt từng ngày từ <code>arrival</code> đến <code>pickup</code> (tính cả hai đầu).</li><li>Free time chỉ được trừ vào các ngày <b>thứ Hai \u2013 thứ Bảy</b>, ngày Chủ nhật nằm trong thời gian free time thì không bị trừ và cũng không tính phí.</li><li>Sau khi hết <code>free_days</code> ngày miễn phí, <b>mọi ngày</b> (kể cả Chủ nhật) đều bị tính phí.</li><li>Biểu phí: 5 ngày tính phí đầu tiên 20 USD/ngày, từ ngày tính phí thứ 6 trở đi 40 USD/ngày.</li></ul>',
    hint: 'Duyệt từng ngày từ arrival đến pickup. Nếu còn free_days và ngày đó không phải Chủ nhật thì trừ free_days. Nếu còn free_days và là Chủ nhật thì bỏ qua. Hết free_days thì tính phí mọi ngày: 5 ngày đầu 20 USD, sau đó 40 USD.',
    initialCode: 'from datetime import date, timedelta\n\ndef demurrage_fee(arrival, pickup, free_days):\n    # Your code here\n    pass\n',
    defaultCode: 'from datetime import date, timedelta\n\ndef demurrage_fee(arrival, pickup, free_days):\n    # Your code here\n    pass\n',
    answer_key: 'from datetime import date, timedelta\n\ndef demurrage_fee(arrival, pickup, free_days):\n    charged = 0\n    total = 0\n    remaining_free = free_days\n    current = arrival\n    while current <= pickup:\n        dow = current.weekday()  # 0=Mon, 6=Sun\n        if remaining_free > 0:\n            if dow != 6:  # Not Sunday\n                remaining_free -= 1\n            # Sunday during free time: skip (no charge, no free day used)\n        else:\n            charged += 1\n            if charged <= 5:\n                total += 20\n            else:\n                total += 40\n        current += timedelta(days=1)\n    return (charged, total)\n',
    testCases: [
      {
        id: 1,
        code: "from datetime import date\nprint(demurrage_fee(date(2026, 10, 1), date(2026, 10, 12), 5))",
        expected: "(6, 140)"
      },
      {
        id: 2,
        code: "from datetime import date\nprint(demurrage_fee(date(2026, 10, 1), date(2026, 10, 1), 1))",
        expected: "(0, 0)"
      },
      {
        id: 3,
        code: "from datetime import date\nprint(demurrage_fee(date(2026, 10, 3), date(2026, 10, 5), 0))",
        expected: "(3, 60)"
      },
      {
        id: 4,
        code: "from datetime import date\nprint(demurrage_fee(date(2026, 10, 1), date(2026, 10, 3), 3))",
        expected: "(0, 0)"
      }
    ]
  }
];

const filePaths = [
  'D:/PYTHON/ZEROCODER/public/problems.json',
  'D:/PYTHON/ZEROCODER/dist/problems.json'
];

for (const filePath of filePaths) {
  if (!fs.existsSync(filePath)) {
    console.log('SKIP:', filePath);
    continue;
  }

  const problems = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const filtered = problems.filter(p => p.category !== 'Last-term 2809 test');
  console.log('Removed', problems.length - filtered.length, 'old entries from', filePath);

  let insertIdx = filtered.findIndex(p => p.category && p.category.startsWith('Last-term'));
  if (insertIdx === -1) insertIdx = filtered.length;

  filtered.splice(insertIdx, 0, ...newProblems);
  console.log('Inserted', newProblems.length, 'new entries at index', insertIdx);
  console.log('Total:', filtered.length);

  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
  console.log('Written:', filePath);
}

console.log('Done!');
