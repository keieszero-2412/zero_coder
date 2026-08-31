import fs from 'fs/promises';

const mockHints = {
  "mock1_1": "Dùng vòng lặp for kết hợp hàm zip(prices, quantities) để tính tổng các tích p*q, sau đó trả về round(total, 2).",
  "mock1_2": "Tính hoa hồng lũy tiến bằng if/elif/else: Nếu > 500 thì (sales-500)*0.06 + 400*0.04 + 100*0.02, vv. Chú ý tính đúng các mốc trước đó.",
  "mock1_3": "Khởi tạo dict rỗng, duyệt qua vòng lặp for kv, dt in transactions, rồi cộng dồn bằng d[kv] = d.get(kv, 0) + dt.",
  "mock1_4": "Dùng list comprehension: [round((revenues[i] - revenues[i-1]) / revenues[i-1] * 100, 2) for i in range(1, len(revenues))].",
  "mock1_5": "Dùng sorted() trên sales.items() với key=lambda x: (-x[1], x[0]) rồi dùng vòng lặp hoặc list comprehension cắt [:n] để lấy tên sản phẩm.",
  
  "mock2_1": "Sử dụng hàm zip(prices, quantities) để tính tổng doanh thu (sum(p*q)) và tổng số lượng (sum(quantities)), sau đó chia cho nhau và round(..., 2).",
  "mock2_2": "Dùng if/elif/else dựa vào sum(quantities). Nếu sum >= 100 thì discount = 0.1, sau đó trả về round(sum(p*q) * (1 - discount), 2).",
  "mock2_3": "Tạo dict rỗng. Dùng vòng lặp for ten, nhom in products, rồi tăng đếm d[nhom] = d.get(nhom, 0) + 1.",
  "mock2_4": "Dùng biến total để cộng dồn trong vòng lặp for r in revenues, mỗi bước append total vào danh sách kết quả, hoặc dùng itertools.accumulate.",
  "mock2_5": "Tính avg = sum(sales.values()) / len(sales). Dùng list comprehension [k for k, v in sales.items() if v > avg] và gọi hàm .sort().",
  
  "mock3_1": "Sử dụng công thức lãi kép: principal * (1 + rate/100)**years. Đừng quên làm tròn bằng round(..., 2).",
  "mock3_2": "Dùng câu lệnh if/elif/else để kiểm tra số ngày quá hạn (0-9, 10-89, 90-179, ...) và trả về con số nhóm nợ (1 đến 5).",
  "mock3_3": "Dùng dictionary để gom nhóm: duyệt for t in transactions, cộng dồn d[t['category']] = d.get(t['category'], 0) + t['amount'].",
  "mock3_4": "Dùng list comprehension kết hợp cắt list (slicing): [round(sum(prices[i:i+k])/k, 2) for i in range(len(prices) - k + 1)].",
  "mock3_5": "Lọc các quỹ có v > 0, dùng sorted() với key=lambda x: (-x[1], x[0]), sau đó lấy list các tuple kết quả.",
  
  "mock4_1": "Tính tổng doanh thu (chưa VAT) bằng sum(p*q for p,q in zip(prices, quantities)), sau đó nhân với (1 + vat_rate/100) và làm tròn 2 chữ số.",
  "mock4_2": "Kiểm tra bằng if/elif/else: Nếu w <= 1 thì 20, nếu w <= 3 thì 20 + 10*(w-1), nếu > 3 thì 40 + 5*(w-3). Gợi ý: dùng math.ceil() nếu đề yêu cầu làm tròn lên số kg.",
  "mock4_3": "Tạo dict d. Duyệt qua từng đơn o in orders, cộng dồn doanh thu (price * quantity) vào d[o['channel']].",
  "mock4_4": "Sắp xếp revenues giảm dần, tính tổng total. Dùng biến cộng dồn current, duyệt từng giá trị, tính (current/total)*100, làm tròn 2 chữ số rồi đưa vào list.",
  "mock4_5": "Tính biên lợi nhuận (prices[k] - costs[k]) / prices[k] cho từng sản phẩm. Dùng sorted với key=lambda k: (-(prices[k]-costs[k])/prices[k], k)."
};

async function main() {
  const { problems } = await import('../src/data/problems.js');
  
  let updated = 0;
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    if (mockHints[p.id]) {
      p.hint = mockHints[p.id];
      updated++;
    }
  }

  const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
  await fs.writeFile('src/data/problems.js', newContent, 'utf8');
  console.log(`Successfully updated ${updated} mock test questions with highly specific hints!`);
}

main();
