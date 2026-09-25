const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync('ftds_quizzes_all_1790358017153.json', 'utf8'));

// Format question text cleanly
function cleanQuestionText(text, qNum) {
  if (!text) return `**Câu ${qNum}:**`;
  let parts = text.split('\n\n').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Vietnamese first, English italicized
    const vn = parts[0];
    const en = parts.slice(1).join('\n\n');
    return `**Câu ${qNum}:** ${vn}\n\n*${en}*`;
  }
  return `**Câu ${qNum}:** ${text.trim()}`;
}

// Format options cleanly
function cleanOptions(options) {
  return options.map(opt => {
    // If option has \n\n or \n separating Vietnamese and English
    const lines = opt.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      // First line starts with e.g. "A. ..."
      const first = lines[0];
      const rest = lines.slice(1).join(' - ');
      return `${first} (${rest})`;
    }
    return opt.trim();
  });
}

// ==================== QUIZ 8 ====================
const q8Raw = rawData[1].questions;
const quiz8Questions = q8Raw.map((q, idx) => {
  return {
    text: cleanQuestionText(q.question, idx + 1),
    options: cleanOptions(q.options)
  };
});

const quiz8Answers = {
  "0": ["A", "C"],
  "1": "B",
  "2": "C",
  "3": "A",
  "4": ["A", "B", "E"],
  "5": "A",
  "6": "B",
  "7": ["A", "B"],
  "8": ["B", "D"],
  "9": ["B", "C"],
  "10": ["B", "C"],
  "11": "B",
  "12": "A",
  "13": "A",
  "14": ["A", "C"],
  "15": ["A", "B", "C", "D"],
  "16": ["A", "B", "C"],
  "17": ["A", "C", "D"]
};

const quiz8Problem = {
  id: "last_term_quiz_8",
  category: "Last-term Quiz",
  subcategory: "Quiz 8",
  title: "Quiz 8: Model Development",
  description: "Bài kiểm tra trắc nghiệm lý thuyết <b>Quiz 8: Model Development</b> (18 câu hỏi) bao gồm các kiến thức về nền tảng học máy, mô hình hồi quy tuyến tính (Linear Regression), đánh giá R², hàm mất mát, và chuẩn hoá dữ liệu.",
  type: "multiple_choice",
  initialCode: "{}",
  questions: quiz8Questions,
  correctAnswers: quiz8Answers
};

// ==================== QUIZ 11 ====================
const q11Raw = rawData[2].questions;
const quiz11Questions = q11Raw.map((q, idx) => {
  return {
    text: cleanQuestionText(q.question, idx + 1),
    options: cleanOptions(q.options)
  };
});

const quiz11Answers = {
  "0": ["A", "C"],
  "1": ["A", "D"],
  "2": "B",
  "3": ["A", "B"],
  "4": ["A", "C", "D"],
  "5": ["A", "B"],
  "6": ["A", "B", "D"],
  "7": "D",
  "8": ["A", "C", "D"],
  "9": "B",
  "10": ["A", "C", "D"],
  "11": ["B", "D"]
};

const quiz11Problem = {
  id: "last_term_quiz_11",
  category: "Last-term Quiz",
  subcategory: "Quiz 11",
  title: "Quiz 11: Monitoring System",
  description: "Bài kiểm tra trắc nghiệm lý thuyết <b>Quiz 11: Monitoring System</b> (12 câu hỏi) bao gồm các kiến thức về hàm Sigmoid, Hồi quy Logistic, Maximum Likelihood Estimation (MLE), hàm Entropy, và các chỉ số đánh giá mô hình (Precision, Recall, F1-Score).",
  type: "multiple_choice",
  initialCode: "{}",
  questions: quiz11Questions,
  correctAnswers: quiz11Answers
};

// ==================== QUIZ 12 ====================
const q12Raw = rawData[3].questions;
const quiz12Questions = q12Raw.map((q, idx) => {
  let qText = q.question;
  let options = q.options;

  // Fix Q9 (Ordering question that was missing options)
  if (idx === 8) {
    qText = `**Câu 9:** Đâu là quy trình hợp lý để một doanh nghiệp F&B áp dụng học máy và khoa học dữ liệu nhằm phân tích xu hướng tiêu thụ đồ ăn trong những năm gần đây?

*What is a logical process for an F&B business to apply machine learning and data science to analyze food consumption trends in recent years?*

Các bước gồm:
1. **(1)** Xác định vấn đề và loại dữ liệu cần thu thập *(Define the problem and determine data)*
2. **(2)** Thu thập dữ liệu từ các nguồn liên quan *(Collect data from relevant sources)*
3. **(3)** Làm sạch và tiền xử lý dữ liệu *(Clean and preprocess the data)*
4. **(4)** Sử dụng các mô hình thống kê và thuật toán học máy để phân tích dữ liệu *(Apply models & ML algorithms)*`;

    options = [
      "A. (1) → (2) → (3) → (4)",
      "B. (2) → (1) → (3) → (4)",
      "C. (1) → (3) → (2) → (4)",
      "D. (4) → (3) → (2) → (1)"
    ];
  }

  return {
    text: idx === 8 ? qText : cleanQuestionText(qText, idx + 1),
    options: idx === 8 ? options : cleanOptions(options)
  };
});

const quiz12Answers = {
  "0": ["A", "B", "C", "D"],
  "1": "A",
  "2": "A",
  "3": "A",
  "4": "C",
  "5": ["C", "D"],
  "6": ["A", "B", "C", "D"],
  "7": "D",
  "8": "A",
  "9": ["A", "C", "D"],
  "10": ["A", "B", "D"],
  "11": "A",
  "12": "A",
  "13": "C",
  "14": ["A", "B", "C"],
  "15": "B",
  "16": "C",
  "17": "B",
  "18": ["A", "B", "C", "D"],
  "19": "A",
  "20": "A",
  "21": "A",
  "22": ["B", "C", "D"],
  "23": "C",
  "24": ["A", "B", "C", "E"],
  "25": ["A", "B"],
  "26": ["A", "B", "C", "E"],
  "27": ["A", "C", "D"],
  "28": ["A", "B"],
  "29": ["B", "C", "D"],
  "30": ["B", "C", "D"],
  "31": ["B", "C"]
};

const quiz12Problem = {
  id: "last_term_quiz_12",
  category: "Last-term Quiz",
  subcategory: "Quiz 12",
  title: "Quiz 12: Final Quiz",
  description: "Bài kiểm tra trắc nghiệm tổng hợp <b>Quiz 12: Final Quiz</b> (32 câu hỏi) bao quát toàn bộ nội dung học phần Python, Cấu trúc dữ liệu, Pandas/EDA, Trực quan hoá dữ liệu, và các mô hình Học máy.",
  type: "multiple_choice",
  initialCode: "{}",
  questions: quiz12Questions,
  correctAnswers: quiz12Answers
};

const generatedQuizzes = [quiz8Problem, quiz11Problem, quiz12Problem];

fs.writeFileSync('scratch/generated_quizzes.json', JSON.stringify(generatedQuizzes, null, 2), 'utf8');
console.log('Successfully generated quizzes into scratch/generated_quizzes.json!');
console.log('Quiz 8 questions:', quiz8Questions.length);
console.log('Quiz 11 questions:', quiz11Questions.length);
console.log('Quiz 12 questions:', quiz12Questions.length);
