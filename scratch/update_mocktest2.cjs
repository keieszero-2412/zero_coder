const fs = require('fs');
const path = require('path');

const problemsPath = path.join(__dirname, '../src/data/problems.js');
let content = fs.readFileSync(problemsPath, 'utf8');

// Load the current problems
const match = content.match(/export const problems = (\[[\s\S]*\]);/);
if (!match) {
  console.error("Could not find problems array");
  process.exit(1);
}

let problems = eval(match[1]);

// Remove existing Mock test 2 problems
problems = problems.filter(p => p.category !== 'Mock test 2');

// Add the updated ones
const mock2Problems = [
  {
    id: "mock2_1",
    category: "Mock test 2",
    title: "1. Giá bán bình quân",
    description: "<p>Cùng một mặt hàng được bán ở nhiều mức giá khác nhau trong tháng. <code>prices</code> là các mức giá, <code>quantities</code> là số lượng bán ở mỗi mức giá.</p><p>Yêu cầu: Viết hàm <code>average_price(prices, quantities)</code> trả về giá bán bình quân gia quyền, làm tròn 2 chữ số thập phân.</p><p>Giá bình quân = tổng doanh thu ÷ tổng số lượng.<br/>Nếu tổng số lượng bằng 0 (hoặc danh sách rỗng) → trả về <code>0.0</code>.</p>",
    initialCode: "def average_price(prices, quantities):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(average_price([10.0, 20.0], [3, 1]))", expected: "12.5" },
      { id: 2, code: "print(average_price([5.0, 8.0, 12.0], [10, 5, 5]))", expected: "7.5" },
      { id: 3, code: "print(average_price([100.0], [7]))", expected: "100.0" },
      { id: 4, code: "print(average_price([9.5, 4.5], [0, 0]))", expected: "0.0" },
      { id: 5, code: "print(average_price([], []))", expected: "0.0" }
    ]
  },
  {
    id: "mock2_2",
    category: "Mock test 2",
    title: "2. Chiết khấu theo số lượng",
    description: "<p>Cửa hàng bán sỉ áp dụng chiết khấu theo số lượng. Khác với thuế bậc thang: toàn bộ đơn hàng được hưởng một mức chiết khấu duy nhất, xác định theo tổng số lượng mua.</p><ul><li>Dưới 10: 0%</li><li>10 - 49: 5%</li><li>50 - 99: 10%</li><li>Từ 100 trở lên: 15%</li></ul><p>Yêu cầu: Viết hàm <code>bulk_price(unit_price, quantity)</code> trả về số tiền phải trả sau chiết khấu, làm tròn 2 chữ số thập phân.</p>",
    initialCode: "def bulk_price(unit_price, quantity):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(bulk_price(100.0, 10))", expected: "950.0" },
      { id: 2, code: "print(bulk_price(100.0, 5))", expected: "500.0" },
      { id: 3, code: "print(bulk_price(20.0, 60))", expected: "1080.0" },
      { id: 4, code: "print(bulk_price(12.5, 100))", expected: "1062.5" },
      { id: 5, code: "print(bulk_price(99.99, 1))", expected: "99.99" }
    ]
  },
  {
    id: "mock2_3",
    category: "Mock test 2",
    title: "3. Đếm số lượng sản phẩm theo nhóm",
    description: "<p>Danh mục hàng hoá được lưu thành danh sách các tuple <code>(ten_san_pham, nhom_hang)</code>.</p><p>Yêu cầu: Viết hàm <code>count_by_category(products)</code> trả về một dict cho biết mỗi nhóm hàng có bao nhiêu sản phẩm.</p><p>Giá trị là số nguyên (số lượng sản phẩm trong nhóm).<br/>Thứ tự các khoá theo lần xuất hiện đầu tiên của nhóm hàng.<br/>Danh sách rỗng → trả về <code>{}</code>.</p>",
    initialCode: "def count_by_category(products):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(count_by_category([(\"Ao thun\", \"Thoi trang\"), (\"Quan jean\", \"Thoi trang\"), (\"Laptop\", \"Dien tu\")]))", expected: "{'Thoi trang': 2, 'Dien tu': 1}" },
      { id: 2, code: "print(count_by_category([(\"Sua\", \"Thuc pham\"), (\"Tai nghe\", \"Dien tu\"), (\"Banh\", \"Thuc pham\"), (\"Chuot\", \"Dien tu\"), (\"Kem\", \"Thuc pham\")]))", expected: "{'Thuc pham': 3, 'Dien tu': 2}" },
      { id: 3, code: "print(count_by_category([(\"But\", \"Van phong pham\")]))", expected: "{'Van phong pham': 1}" },
      { id: 4, code: "print(count_by_category([(\"A\", \"X\"), (\"B\", \"X\"), (\"C\", \"X\")]))", expected: "{'X': 3}" },
      { id: 5, code: "print(count_by_category([]))", expected: "{}" }
    ]
  },
  {
    id: "mock2_4",
    category: "Mock test 2",
    title: "4. Doanh thu luỹ kế",
    description: "<p>Kế toán cần báo cáo doanh thu luỹ kế: đến hết mỗi kỳ, tổng doanh thu tính từ đầu là bao nhiêu.</p><p>Yêu cầu: Viết hàm <code>cumulative(revenues)</code> trả về danh sách doanh thu luỹ kế, mỗi giá trị làm tròn 2 chữ số thập phân.</p><p>Phần tử thứ <code>i</code> = tổng của <code>revenues[0]</code> đến <code>revenues[i]</code>.<br/>Kết quả có cùng độ dài với <code>revenues</code>; danh sách rỗng → trả về <code>[]</code>.<br/>Doanh thu có thể âm (hàng bị trả lại).</p>",
    initialCode: "def cumulative(revenues):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(cumulative([10.0, 5.5, 4.5]))", expected: "[10.0, 15.5, 20.0]" },
      { id: 2, code: "print(cumulative([3.33, 3.33, 3.34]))", expected: "[3.33, 6.66, 10.0]" },
      { id: 3, code: "print(cumulative([50, -20, 10]))", expected: "[50.0, 30.0, 40.0]" },
      { id: 4, code: "print(cumulative([100]))", expected: "[100.0]" },
      { id: 5, code: "print(cumulative([]))", expected: "[]" }
    ]
  },
  {
    id: "mock2_5",
    category: "Mock test 2",
    title: "5. Doanh thu theo sản phẩm",
    description: "<p>Doanh thu theo sản phẩm nằm trong một dict. Giám đốc chỉ muốn xem những sản phẩm bán trên mức trung bình.</p><p>Yêu cầu: Viết hàm <code>above_average(sales)</code> trả về danh sách tên các sản phẩm có doanh thu lớn hơn doanh thu trung bình, xếp từ cao xuống thấp.</p><ul><li>So sánh lớn hơn hẳn (bằng trung bình thì loại).</li><li>Nếu hai sản phẩm bằng doanh thu → xếp theo thứ tự bảng chữ cái (A → Z).</li><li>dict rỗng → trả về <code>[]</code>.</li></ul>",
    initialCode: "def above_average(sales):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(above_average({\"A\": 10, \"B\": 20, \"C\": 30}))", expected: "['C']" },
      { id: 2, code: "print(above_average({\"A\": 30, \"B\": 30, \"C\": 10}))", expected: "['A', 'B']" },
      { id: 3, code: "print(above_average({\"X\": 50, \"A\": 50, \"C\": 20}))", expected: "['A', 'X']" },
      { id: 4, code: "print(above_average({}))", expected: "[]" }
    ]
  }
];

problems.push(...mock2Problems);

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully updated Mock test 2 with full tests and question 5.');
