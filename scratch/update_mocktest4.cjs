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

// Remove existing Mock test 4 problems if any
problems = problems.filter(p => p.category !== 'Mock test 4');

const mock4Problems = [
  {
    id: "mock4_1",
    category: "Mock test 4",
    title: "1. Tổng tiền đơn hàng",
    description: "<p>Một đơn hàng gồm nhiều mặt hàng. <code>prices</code> là đơn giá, <code>quantities</code> là số lượng, <code>vat_rate</code> là thuế VAT tính theo phần trăm (ví dụ 8 nghĩa là 8%).</p><p>Yêu cầu: Viết hàm <code>order_total(prices, quantities, vat_rate)</code> trả về tổng tiền phải trả đã bao gồm VAT, làm tròn 2 chữ số thập phân.</p><ul><li>Tiền hàng = tổng của đơn giá × số lượng; sau đó cộng VAT trên tổng tiền hàng.</li><li>Đơn hàng rỗng → trả về <code>0.0</code>.</li></ul>",
    initialCode: "def order_total(prices, quantities, vat_rate):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(order_total([100.0, 50.0], [1, 2], 8.0))", expected: "216.0" },
      { id: 2, code: "print(order_total([10.5, 20.0], [3, 4], 10.0))", expected: "122.65" },
      { id: 3, code: "print(order_total([], [], 8.0))", expected: "0.0" }
    ]
  },
  {
    id: "mock4_2",
    category: "Mock test 4",
    title: "2. Phí giao hàng",
    description: "<p>Sàn thương mại điện tử tính phí giao hàng theo cân nặng (đơn vị: nghìn đồng).</p><ul><li>Đến 1 kg: 20</li><li>Trên 1 đến 3 kg: 20 + 10 × (số kg vượt quá 1)</li><li>Trên 3 kg: 40 + 8 × (số kg vượt quá 3)</li></ul><p>Yêu cầu: Viết hàm <code>shipping_fee(weight)</code> trả về phí giao hàng, làm tròn 2 chữ số thập phân.</p>",
    initialCode: "def shipping_fee(weight):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(shipping_fee(2.5))", expected: "35.0" },
      { id: 2, code: "print(shipping_fee(0.5))", expected: "20.0" },
      { id: 3, code: "print(shipping_fee(1.0))", expected: "20.0" },
      { id: 4, code: "print(shipping_fee(3.0))", expected: "40.0" },
      { id: 5, code: "print(shipping_fee(5.5))", expected: "60.0" }
    ]
  },
  {
    id: "mock4_3",
    category: "Mock test 4",
    title: "3. Doanh thu theo kênh bán",
    description: "<p>Đơn hàng được xuất thành danh sách các dict, mỗi đơn có khoá <code>channel</code> (kênh bán), <code>price</code> và <code>quantity</code>.</p><p>Yêu cầu: Viết hàm <code>revenue_by_channel(orders)</code> trả về một dict gộp doanh thu theo từng kênh bán.</p><ul><li>Doanh thu mỗi đơn = price × quantity.</li><li>Mỗi giá trị làm tròn 2 chữ số thập phân; thứ tự khoá theo lần xuất hiện đầu tiên.</li><li>Danh sách rỗng → trả về <code>{}</code>.</li></ul>",
    initialCode: "def revenue_by_channel(orders):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(revenue_by_channel([{\"channel\": \"Shopee\", \"price\": 100.0, \"quantity\": 2}, {\"channel\": \"Web\", \"price\": 50.0, \"quantity\": 1}, {\"channel\": \"Shopee\", \"price\": 25.0, \"quantity\": 4}]))", expected: "{'Shopee': 300.0, 'Web': 50.0}" },
      { id: 2, code: "print(revenue_by_channel([{\"channel\": \"Lazada\", \"price\": 10.5, \"quantity\": 3}]))", expected: "{'Lazada': 31.5}" },
      { id: 3, code: "print(revenue_by_channel([]))", expected: "{}" }
    ]
  },
  {
    id: "mock4_4",
    category: "Mock test 4",
    title: "4. Tỷ trọng tích luỹ (Quy tắc Pareto)",
    description: "<p>Nguyên lý Pareto (80/20): thường một số ít sản phẩm tạo ra phần lớn doanh thu. Để kiểm chứng, ta xếp doanh thu từ cao xuống thấp rồi xem tỷ trọng tích luỹ.</p><p>Yêu cầu: Viết hàm <code>cumulative_share(revenues)</code> trả về danh sách tỷ trọng tích luỹ (%), làm tròn 2 chữ số thập phân.</p><ul><li>Sắp xếp doanh thu giảm dần trước khi cộng dồn.</li><li>Phần tử thứ <code>i</code> = (tổng <code>i+1</code> giá trị lớn nhất ÷ tổng tất cả) × 100.</li><li>Danh sách rỗng (hoặc tổng bằng 0) → trả về <code>[]</code>. Phần tử cuối luôn là <code>100.0</code>.</li></ul>",
    initialCode: "def cumulative_share(revenues):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(cumulative_share([10, 40, 50]))", expected: "[50.0, 90.0, 100.0]" },
      { id: 2, code: "print(cumulative_share([20, 20, 20, 20, 20]))", expected: "[20.0, 40.0, 60.0, 80.0, 100.0]" },
      { id: 3, code: "print(cumulative_share([100]))", expected: "[100.0]" },
      { id: 4, code: "print(cumulative_share([0, 0, 0]))", expected: "[]" },
      { id: 5, code: "print(cumulative_share([]))", expected: "[]" }
    ]
  },
  {
    id: "mock4_5",
    category: "Mock test 4",
    title: "5. Xếp hạng biên lợi nhuận",
    description: "<p>Hai dict có cùng bộ khoá: <code>prices</code> là giá bán, <code>costs</code> là giá vốn của từng sản phẩm.</p><p>Yêu cầu: Viết hàm <code>margin_ranking(prices, costs)</code> trả về danh sách tên sản phẩm xếp theo biên lợi nhuận từ cao xuống thấp.</p><ul><li>Biên lợi nhuận (%) = (giá bán − giá vốn) / giá bán × 100.</li><li>Bỏ qua sản phẩm có giá bán nhỏ hơn hoặc bằng 0.</li><li>Hai sản phẩm cùng biên lợi nhuận → xếp theo thứ tự bảng chữ cái (A → Z).</li></ul>",
    initialCode: "def margin_ranking(prices, costs):\n    # Write your code here\n",
    testCases: [
      { id: 1, code: "print(margin_ranking({\"A\": 100.0, \"B\": 200.0, \"C\": 50.0}, {\"A\": 60.0, \"B\": 100.0, \"C\": 45.0}))", expected: "['B', 'A', 'C']" },
      { id: 2, code: "print(margin_ranking({\"A\": 100.0, \"B\": 100.0}, {\"A\": 50.0, \"B\": 50.0}))", expected: "['A', 'B']" },
      { id: 3, code: "print(margin_ranking({\"A\": 0.0, \"B\": -10.0, \"C\": 100.0}, {\"A\": 50.0, \"B\": 50.0, \"C\": 50.0}))", expected: "['C']" },
      { id: 4, code: "print(margin_ranking({}, {}))", expected: "[]" }
    ]
  }
];

problems.push(...mock4Problems);

const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
fs.writeFileSync(problemsPath, newContent, 'utf8');
console.log('Successfully added Mock test 4.');
