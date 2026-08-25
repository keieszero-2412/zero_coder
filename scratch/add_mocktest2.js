const fs = require('fs');
const path = require('path');

const problemsPath = path.join(__dirname, '../src/data/problems.js');
let content = fs.readFileSync(problemsPath, 'utf8');

const newProblems = `  },
  {
    id: "mock2_1",
    category: "Mock test 2",
    title: "1. Giá bán bình quân",
    description: "<p>Cùng một mặt hàng được bán ở nhiều mức giá khác nhau trong tháng. <code>prices</code> là các mức giá, <code>quantities</code> là số lượng bán ở mỗi mức giá.</p><p>Yêu cầu: Viết hàm <code>average_price(prices, quantities)</code> trả về giá bán bình quân gia quyền, làm tròn 2 chữ số thập phân.</p><p>Giá bình quân = tổng doanh thu ÷ tổng số lượng.<br/>Nếu tổng số lượng bằng 0 (hoặc danh sách rỗng) → trả về <code>0.0</code>.</p>",
    initialCode: "def average_price(prices, quantities):\\n    # Write your code here\\n",
    testCases: [
      { id: 1, code: "print(average_price([10.0, 20.0], [3, 1]))", expected: "12.5" }
    ]
  },
  {
    id: "mock2_2",
    category: "Mock test 2",
    title: "2. Chiết khấu theo số lượng",
    description: "<p>Cửa hàng bán sỉ áp dụng chiết khấu theo số lượng. Khác với thuế bậc thang: toàn bộ đơn hàng được hưởng một mức chiết khấu duy nhất, xác định theo tổng số lượng mua.</p><ul><li>Dưới 10: 0%</li><li>10 - 49: 5%</li><li>50 - 99: 10%</li><li>Từ 100 trở lên: 15%</li></ul><p>Yêu cầu: Viết hàm <code>bulk_price(unit_price, quantity)</code> trả về số tiền phải trả sau chiết khấu, làm tròn 2 chữ số thập phân.</p>",
    initialCode: "def bulk_price(unit_price, quantity):\\n    # Write your code here\\n",
    testCases: [
      { id: 1, code: "print(bulk_price(100.0, 10))", expected: "950.0" }
    ]
  },
  {
    id: "mock2_3",
    category: "Mock test 2",
    title: "3. Đếm số lượng sản phẩm theo nhóm",
    description: "<p>Danh mục hàng hoá được lưu thành danh sách các tuple <code>(ten_san_pham, nhom_hang)</code>.</p><p>Yêu cầu: Viết hàm <code>count_by_category(products)</code> trả về một dict cho biết mỗi nhóm hàng có bao nhiêu sản phẩm.</p><p>Giá trị là số nguyên (số lượng sản phẩm trong nhóm).<br/>Thứ tự các khoá theo lần xuất hiện đầu tiên của nhóm hàng.<br/>Danh sách rỗng → trả về <code>{}</code>.</p>",
    initialCode: "def count_by_category(products):\\n    # Write your code here\\n",
    testCases: [
      { id: 1, code: "print(count_by_category([(\\"Ao thun\\", \\"Thoi trang\\"), (\\"Quan jean\\", \\"Thoi trang\\"), (\\"Laptop\\", \\"Dien tu\\")]))", expected: "{'Thoi trang': 2, 'Dien tu': 1}" }
    ]
  },
  {
    id: "mock2_4",
    category: "Mock test 2",
    title: "4. Doanh thu luỹ kế",
    description: "<p>Kế toán cần báo cáo doanh thu luỹ kế: đến hết mỗi kỳ, tổng doanh thu tính từ đầu là bao nhiêu.</p><p>Yêu cầu: Viết hàm <code>cumulative(revenues)</code> trả về danh sách doanh thu luỹ kế, mỗi giá trị làm tròn 2 chữ số thập phân.</p><p>Phần tử thứ <code>i</code> = tổng của <code>revenues[0]</code> đến <code>revenues[i]</code>.<br/>Kết quả có cùng độ dài với <code>revenues</code>; danh sách rỗng → trả về <code>[]</code>.<br/>Doanh thu có thể âm (hàng bị trả lại).</p>",
    initialCode: "def cumulative(revenues):\\n    # Write your code here\\n",
    testCases: [
      { id: 1, code: "print(cumulative([10.0, 5.5, 4.5]))", expected: "[10.0, 15.5, 20.0]" }
    ]
  }
];`;

content = content.replace(/  \}\s*\];\s*$/, newProblems);
fs.writeFileSync(problemsPath, content, 'utf8');
console.log('Successfully appended Mock test 2');
