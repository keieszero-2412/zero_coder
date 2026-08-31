import fs from 'fs/promises';

const updatedHints = {
  "exam2_5": "Dùng list comprehension [x**2 for x in lst if x % 2 != 0] để lọc số lẻ và bình phương, rồi return danh sách đó.",
  "exam2_7": "Để được tổng lớn nhất, bạn chỉ cần biến tất cả các số thành số dương bằng hàm abs() rồi tính tổng sum().",
  "exam2_13": "Bất kể thứ tự gộp như thế nào, phần tử cuối cùng luôn là tổng của toàn bộ danh sách ban đầu. Bạn chỉ cần return sum(list).",
  "exam2_19": "Dùng phương thức jobs.sort(key=lambda x: (-x['pay'], x['hours'])). Lưu ý dấu trừ để ưu tiên sắp xếp giảm dần theo tiền lương.",
  "exam2_22": "Dùng hàm max(items, key=lambda k: items[k]) để tìm đồ vật (key) có giá trị (value) lớn nhất trong dictionary."
};

async function main() {
  const { problems } = await import('../src/data/problems.js');
  
  let updated = 0;
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    if (updatedHints[p.id]) {
      p.hint = updatedHints[p.id];
      updated++;
    }
  }

  const newContent = `export const problems = ${JSON.stringify(problems, null, 2)};\n`;
  await fs.writeFile('src/data/problems.js', newContent, 'utf8');
  console.log(`Successfully updated ${updated} questions with specific hints!`);
}

main();
