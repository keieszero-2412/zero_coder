const fs = require('fs');
const path = require('path');

const newProblem = {
  id: 'final_2809_test_11',
  category: 'Last-term 2809 test',
  title: 'Question 11: Làm sạch dữ liệu lô hàng (clean_shipments)',
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
    },
    {
      id: 4,
      code: "print(clean_shipments([\n    {'id': 'S10', 'port': '  vungtau  ', 'weight': 45.6789, 'status': 'In Transit'},\n    {'id': 'S11', 'port': 'dad', 'weight': 100.0, 'status': 'completed'},\n    {'id': 'S12', 'port': 'sgn', 'weight': -1, 'status': 'Delivered'}\n]))",
      expected: "[{'id': 'S10', 'port': 'VUNGTAU', 'weight': 45.68}, {'id': 'S11', 'port': 'DAD', 'weight': 100.0}]"
    }
  ]
};

const targets = [
  path.join(__dirname, '../public/problems.json'),
  path.join(__dirname, '../dist/problems.json')
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    const list = JSON.parse(fs.readFileSync(target, 'utf8'));
    const filtered = list.filter(p => p.id !== newProblem.id);
    const firstLastTermIdx = filtered.findIndex(p => (p.category || '').toLowerCase().includes('last'));
    if (firstLastTermIdx >= 0) {
      filtered.splice(firstLastTermIdx, 0, newProblem);
    } else {
      filtered.unshift(newProblem);
    }
    fs.writeFileSync(target, JSON.stringify(filtered, null, 2), 'utf8');
    console.log(`Updated ${target}, total: ${filtered.length} problems.`);
  }
}
