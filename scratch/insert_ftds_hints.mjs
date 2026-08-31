import fs from 'fs/promises';

const generatedHints = {
  "cp_5": "Hãy sử dụng hàm sentence.split() để tách các từ dựa trên khoảng trắng, sau đó dùng len() để đếm số phần tử.",
  "cp_6": "Sử dụng list comprehension kết hợp điều kiện distance <= 3 để lọc, sau đó sorted theo price và dùng slice [:3] để lấy 3 nhà trọ rẻ nhất."
};

async function main() {
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
