const fs = require('fs');

const mockQ2 = {
  type: 'ordering',
  text: '**Câu 2:** Đâu là quy trình hợp lý để một doanh nghiệp F&B áp dụng học máy và khoa học dữ liệu nhằm phân tích xu hướng tiêu thụ đồ ăn trong những năm gần đây? Hãy sắp xếp các bước sau theo đúng quy trình từ bước đầu tiên đến bước cuối cùng:',
  items: [
    'Thu thập dữ liệu từ các nguồn liên quan',
    'Sử dụng các mô hình thống kê và các thuật toán học máy để phân tích dữ liệu',
    'Xác định vấn đề và loại dữ liệu cần thu thập',
    'Làm sạch và tiền xử lý dữ liệu'
  ],
  correctOrder: [
    'Xác định vấn đề và loại dữ liệu cần thu thập',
    'Thu thập dữ liệu từ các nguồn liên quan',
    'Làm sạch và tiền xử lý dữ liệu',
    'Sử dụng các mô hình thống kê và các thuật toán học máy để phân tích dữ liệu'
  ],
  options: [
    'Thu thập dữ liệu từ các nguồn liên quan',
    'Sử dụng các mô hình thống kê và các thuật toán học máy để phân tích dữ liệu',
    'Xác định vấn đề và loại dữ liệu cần thu thập',
    'Làm sạch và tiền xử lý dữ liệu'
  ]
};

const quiz12Q9 = {
  type: 'ordering',
  text: '**Câu 9:** Đâu là quy trình hợp lý để một doanh nghiệp F&B áp dụng học máy và khoa học dữ liệu nhằm phân tích xu hướng tiêu thụ đồ ăn trong những năm gần đây?\n\n*What is a logical process for an F&B business to apply machine learning and data science to analyze food consumption trends in recent years?*\n\nHãy sắp xếp các bước sau theo đúng quy trình từ bước đầu tiên đến bước cuối cùng:',
  items: [
    'Thu thập dữ liệu từ các nguồn liên quan *(Collect data from relevant sources)*',
    'Sử dụng các mô hình thống kê và thuật toán học máy để phân tích dữ liệu *(Apply statistical models and machine learning algorithms to analyze the data)*',
    'Xác định vấn đề và loại dữ liệu cần thu thập *(Define the problem and determine data)*',
    'Làm sạch và tiền xử lý dữ liệu *(Clean and preprocess the data)*'
  ],
  correctOrder: [
    'Xác định vấn đề và loại dữ liệu cần thu thập *(Define the problem and determine data)*',
    'Thu thập dữ liệu từ các nguồn liên quan *(Collect data from relevant sources)*',
    'Làm sạch và tiền xử lý dữ liệu *(Clean and preprocess the data)*',
    'Sử dụng các mô hình thống kê và thuật toán học máy để phân tích dữ liệu *(Apply statistical models and machine learning algorithms to analyze the data)*'
  ],
  options: [
    'Thu thập dữ liệu từ các nguồn liên quan *(Collect data from relevant sources)*',
    'Sử dụng các mô hình thống kê và thuật toán học máy để phân tích dữ liệu *(Apply statistical models and machine learning algorithms to analyze the data)*',
    'Xác định vấn đề và loại dữ liệu cần thu thập *(Define the problem and determine data)*',
    'Làm sạch và tiền xử lý dữ liệu *(Clean and preprocess the data)*'
  ]
};

function updateProblemsArray(problems) {
  const mock = problems.find(p => p.id === 'last_term_mock_mcq');
  if (mock) {
    mock.questions[1] = mockQ2;
    mock.correctAnswers['1'] = mockQ2.correctOrder;
  }

  const q12 = problems.find(p => p.id === 'last_term_quiz_12');
  if (q12) {
    q12.questions[8] = quiz12Q9;
    q12.correctAnswers['8'] = quiz12Q9.correctOrder;
  }
}

// 1. Update public/problems.json
const pubPath = 'public/problems.json';
if (fs.existsSync(pubPath)) {
  const problems = JSON.parse(fs.readFileSync(pubPath, 'utf8'));
  updateProblemsArray(problems);
  fs.writeFileSync(pubPath, JSON.stringify(problems, null, 2), 'utf8');
  console.log('Updated public/problems.json successfully');
}

// 2. Update admin_backups/problems.json
const backupPath = 'admin_backups/problems.json';
if (fs.existsSync(backupPath)) {
  const problems = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  updateProblemsArray(problems);
  fs.writeFileSync(backupPath, JSON.stringify(problems, null, 2), 'utf8');
  console.log('Updated admin_backups/problems.json successfully');
}

// 3. Update scratch/generated_quizzes.json
const genPath = 'scratch/generated_quizzes.json';
if (fs.existsSync(genPath)) {
  const quizzes = JSON.parse(fs.readFileSync(genPath, 'utf8'));
  const q12 = quizzes.find(p => p.id === 'last_term_quiz_12');
  if (q12) {
    q12.questions[8] = quiz12Q9;
    q12.correctAnswers['8'] = quiz12Q9.correctOrder;
    fs.writeFileSync(genPath, JSON.stringify(quizzes, null, 2), 'utf8');
    console.log('Updated scratch/generated_quizzes.json successfully');
  }
}
