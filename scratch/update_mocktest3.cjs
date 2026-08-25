const fs = require('fs');
const path = require('path');

const problemsPath = path.join(__dirname, '../src/data/problems.js');
let content = fs.readFileSync(problemsPath, 'utf8');

const match = content.match(/export const problems = (\[[\s\S]*\]);/);
if (!match) {
  console.error("Could not find problems array");
  process.exit(1);
}

let problems = eval(match[1]);

// Add Mock test 3 problems
const mock3Problems = [
  {
    id: "mock3_1",
    category: "Mock test 3",
    title: "1. Lãi kép",
    description: "<p>Bạn gửi tiết kiệm <code>principal</code> triệu đồng với lãi suất <code>rate</code> %/năm, lãi nhập gốc mỗi năm (lãi kép), trong <code>years</code> năm.</p><p>Yêu cầu: Viết hàm <code>compound_balance(principal, rate, years)</code> trả về số dư cuối kỳ, làm tròn 2 chữ số thập phân.</p><ul><li>Mỗi năm: số dư mới = số dư cũ × (1 + rate/100).</li><li>rate nhập theo phần trăm (ví dụ 7.5 nghĩa là 7.5%/năm).</li></ul>",
    initialCode: "def compound_balance(principal, rate, years):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(compound_balance(100.0, 10.0, 2))", expected: "121.0" },
      { id: 2, code: "print(compound_balance(100.0, 7.5, 3))", expected: "124.23" },
      { id: 3, code: "print(compound_balance(50.0, 5.0, 0))", expected: "50.0" }
    ]
  },
  {
    id: "mock3_2",
    category: "Mock test 3",
    title: "2. Phân loại nhóm nợ",
    description: "<p>Ngân hàng phân loại khoản vay thành 5 nhóm nợ theo số ngày quá hạn thanh toán.</p><ul><li>0 - 9 ngày: Nhóm 1 (đủ tiêu chuẩn)</li><li>10 - 89 ngày: Nhóm 2 (cần chú ý)</li><li>90 - 179 ngày: Nhóm 3 (dưới tiêu chuẩn)</li><li>180 - 359 ngày: Nhóm 4 (nghi ngờ)</li><li>Từ 360 ngày trở lên: Nhóm 5 (có khả năng mất vốn)</li></ul><p>Yêu cầu: Viết hàm <code>debt_group(days_late)</code> trả về số nhóm nợ dưới dạng số nguyên từ 1 đến 5.</p>",
    initialCode: "def debt_group(days_late):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(debt_group(45))", expected: "2" },
      { id: 2, code: "print(debt_group(0))", expected: "1" },
      { id: 3, code: "print(debt_group(90))", expected: "3" },
      { id: 4, code: "print(debt_group(180))", expected: "4" },
      { id: 5, code: "print(debt_group(400))", expected: "5" }
    ]
  },
  {
    id: "mock3_3",
    category: "Mock test 3",
    title: "3. Tổng chi tiêu theo hạng mục",
    description: "<p>Ứng dụng ngân hàng xuất lịch sử giao dịch thành danh sách các dict, mỗi giao dịch có khoá <code>category</code> và <code>amount</code>.</p><p>Yêu cầu: Viết hàm <code>spending_by_category(transactions)</code> trả về một dict gộp tổng chi tiêu theo từng hạng mục.</p><ul><li>Mỗi giá trị làm tròn 2 chữ số thập phân.</li><li>Thứ tự các khoá theo lần xuất hiện đầu tiên của hạng mục.</li><li>Danh sách rỗng → trả về <code>{}</code>.</li></ul>",
    initialCode: "def spending_by_category(transactions):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(spending_by_category([{\"category\": \"An uong\", \"amount\": 120.5}, {\"category\": \"Di lai\", \"amount\": 40.0}, {\"category\": \"An uong\", \"amount\": 79.5}]))", expected: "{'An uong': 200.0, 'Di lai': 40.0}" },
      { id: 2, code: "print(spending_by_category([{\"category\": \"Mua sam\", \"amount\": 100.111}, {\"category\": \"Mua sam\", \"amount\": 200.222}]))", expected: "{'Mua sam': 300.33}" },
      { id: 3, code: "print(spending_by_category([]))", expected: "{}" }
    ]
  },
  {
    id: "mock3_4",
    category: "Mock test 3",
    title: "4. Trung bình trượt (Moving Average)",
    description: "<p>Để làm mượt biến động giá, nhà phân tích dùng trung bình trượt (moving average): lấy trung bình của <code>k</code> kỳ liên tiếp, rồi trượt cửa sổ sang phải một kỳ.</p><p>Yêu cầu: Viết hàm <code>moving_average(values, k)</code> trả về danh sách các trung bình trượt <code>k</code> kỳ, làm tròn 2 chữ số thập phân.</p><ul><li>Kết quả có <code>len(values) - k + 1</code> phần tử.</li><li>Nếu <code>k</code> lớn hơn số phần tử, hoặc <code>k &lt;= 0</code> → trả về <code>[]</code>.</li></ul>",
    initialCode: "def moving_average(values, k):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(moving_average([10, 20, 30, 40], 2))", expected: "[15.0, 25.0, 35.0]" },
      { id: 2, code: "print(moving_average([10, 20, 30], 3))", expected: "[20.0]" },
      { id: 3, code: "print(moving_average([10, 20], 3))", expected: "[]" },
      { id: 4, code: "print(moving_average([10, 20, 30], 0))", expected: "[]" },
      { id: 5, code: "print(moving_average([1, 2, 3, 4, 5], 1))", expected: "[1.0, 2.0, 3.0, 4.0, 5.0]" }
    ]
  },
  {
    id: "mock3_5",
    category: "Mock test 3",
    title: "5. Bảng xếp hạng quỹ đầu tư",
    description: "<p>Một dict lưu lợi suất năm (%) của các quỹ đầu tư. Bản tin chỉ đăng những quỹ có lãi.</p><p>Yêu cầu: Viết hàm <code>fund_ranking(returns)</code> trả về danh sách các tuple <code>(tên_quỹ, lợi_suất)</code> của những quỹ có lợi suất dương, xếp từ cao xuống thấp.</p><ul><li>Loại bỏ quỹ có lợi suất bằng 0 hoặc âm.</li><li>Hai quỹ cùng lợi suất → xếp theo thứ tự bảng chữ cái (A → Z).</li><li>Không còn quỹ nào → trả về <code>[]</code>.</li></ul>",
    initialCode: "def fund_ranking(returns):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(fund_ranking({\"Alpha\": 12.5, \"Beta\": -3.0, \"Gamma\": 12.5, \"Delta\": 7.0}))", expected: "[('Alpha', 12.5), ('Gamma', 12.5), ('Delta', 7.0)]" },
      { id: 2, code: "print(fund_ranking({\"A\": -1.0, \"B\": 0.0}))", expected: "[]" },
      { id: 3, code: "print(fund_ranking({\"X\": 5.0, \"Z\": 5.0, \"Y\": 5.0}))", expected: "[('X', 5.0), ('Y', 5.0), ('Z', 5.0)]" },
      { id: 4, code: "print(fund_ranking({}))", expected: "[]" }
    ]
  }
];

// Remove existing Mock test 3 if any (for idempotency)
problems = problems.filter(p => p.category !== 'Mock test 3');
problems.push(...mock3Problems);

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully added Mock test 3.');
