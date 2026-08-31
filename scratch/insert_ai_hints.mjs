import fs from 'fs/promises';

const generatedHints = {
  "exam2_1": "Hãy tính Delta = b^2 - 4ac, sau đó dùng if/elif/else để xét dấu Delta và tìm số nghiệm.",
  "exam2_2": "Dùng list.sort() hoặc sorted() để sắp xếp danh sách, rồi chọn phần tử thỏa mãn yêu cầu.",
  "exam2_3": "Dùng vòng lặp for hoặc dùng list comprehension để duyệt và so sánh các phần tử, nhớ kiểm tra độ dài hai list.",
  "exam2_5": "Sử dụng list comprehension để lọc số, sau đó dùng các hàm có sẵn như sum() hoặc len().",
  "exam2_6": "Bạn có thể dùng vòng lặp while hoặc tìm ƯCLN (GCD) của N và M bằng thư viện math.gcd.",
  "exam2_7": "Đây là bài toán duyệt mảng, bạn có thể dùng đệ quy (backtracking) hoặc quy hoạch động để thử các dấu.",
  "exam2_8": "Có thể sử dụng vòng lặp while để cắt hình vuông lớn nhất cạnh min(N, M), sau đó cập nhật lại N và M.",
  "exam2_9": "Dùng dictionary để đếm số lần xuất hiện hoặc dùng collections.Counter(lst).most_common(1).",
  "exam2_10": "Đây là bài toán mua bán cổ phiếu (Buy and Sell Stock). Hãy duyệt mảng và lưu lại giá min từng ngày.",
  "exam2_11": "Dùng isinstance(x, str) để kiểm tra, sau đó đảo chuỗi bằng cú pháp cắt lát x[::-1].",
  "exam2_12": "Viết một hàm phụ is_prime(k) để kiểm tra số nguyên tố, rồi dùng vòng lặp while chạy từ N trở đi.",
  "exam2_13": "Mô phỏng trò chơi bằng vòng lặp while hoặc for, kiểm tra cẩn thận điều kiện dừng.",
  "exam2_15": "Chuyển số thành chuỗi để tính tổng các chữ số bằng sum(int(c) for c in str(n)), sau đó dùng phép chia dư %.",
  "exam2_16": "Sắp xếp danh sách trước, sau đó dùng 2 con trỏ (two pointers) trong vòng lặp for để đếm số bộ ba.",
  "exam2_17": "Sử dụng công thức n! / (k! * (n-k)!) với thư viện math.factorial hoặc dùng quy hoạch động.",
  "exam2_18": "Có thể dùng 2 con trỏ sau khi sắp xếp mảng, hoặc dùng một tập hợp (set) để lưu phần bù khi duyệt.",
  "exam2_19": "Dùng phương thức list.sort(key=lambda x: ...) để sắp xếp các dictionary theo thuộc tính yêu cầu.",
  "exam2_22": "Dùng phương pháp sắp xếp giảm dần theo value, hoặc dùng hàm max() với tham số key.",
  "exam2_23": "Chỉ cần ép kiểu list thành set để loại bỏ các phần tử trùng lặp và trả về độ dài len(set(a)).",
  "exam2_24": "Dùng set để loại bỏ trùng lặp rồi chuyển lại thành list, hoặc dùng vòng lặp duyệt thêm vào list mới.",
  "exam2_25": "Dùng phép chia lấy dư % 26. Ký tự thứ i của khóa sẽ là key[i % len(key)]. Hãy dùng hàm ord() và chr().",
  "exam2_26": "Bạn cần tìm BCNN (LCM) của chu kỳ (N+1) và (M+1). Lịch trùng nhau khi ngày chia hết cho cả hai.",
  "exam2_27": "Dùng ord(c) - 64 đối với chữ hoa để lấy số, và dùng chuỗi.split() để tách các số rồi chuyển đổi.",
  "exam2_28": "Dùng dictionary comprehension: {k: list(v.keys()) for k, v in graph.items()}.",
  "exam2_29": "Vì mã Atbash đối xứng, ký tự 'A' biến thành 'Z', ta dùng công thức: chr(155 - ord(c)) với c in hoa.",
  "exam2_30": "Tương tự bài giải mã, dùng chr(155 - ord(c.upper())) để mã hóa ngược chữ cái thành mã Atbash.",
  "exam2_31": "Dùng if s == 'p' và elif s == 'a'. Nhớ sử dụng hàm round(val, 2) để làm tròn số.",
  "exam2_32": "Dùng sorted(hostels, key=lambda x: x['rating']/x['price'] - x['distance']*0.1, reverse=True)[:3].",
  "exam2_33": "Dùng hàm sorted hoặc list.sort(key=lambda x: x['height']) để sắp xếp danh sách dictionary tăng dần.",
  "exam2_34": "Dùng vòng lặp for value in group.values(), sau đó cộng dồn value['commits']."
};

async function main() {
  // We use our existing dynamic import trick to read the array
  const { problems } = await import('../src/data/problems.js');
  
  let updated = 0;
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    if (generatedHints[p.id]) {
      p.hint = generatedHints[p.id];
      updated++;
    }
  }

  const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
  await fs.writeFile('src/data/problems.js', newContent, 'utf8');
  console.log(`Successfully updated ${updated} questions with AI generated hints!`);
}

main();
