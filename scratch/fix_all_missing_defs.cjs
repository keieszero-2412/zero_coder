const fs = require('fs');
const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));

let modifiedCount = 0;

for (const p of problems) {
  // 1. Summer Course Test (IDs: 1, 2, 3, 4)
  if (p.id == 1 && p.category === 'Last-term Summer Course Test') {
    p.initialCode = "def max_profit(prices_list, fee):\n    # Write your code here\n    pass\n";
    p.testCases = [
      { "id": 1, "code": "print(max_profit([[1, 3, 2, 8, 4, 9], [5, 4, 3]], 2))", "expected": "8" },
      { "id": 2, "code": "print(max_profit([[], [1, 2, 3], [10, 5, 20]], 100))", "expected": "0" },
      { "id": 3, "code": "print(max_profit([[1, 2, 1, 5]], 0))", "expected": "5" }
    ];
    modifiedCount++;
  } else if (p.id == 2 && p.category === 'Last-term Summer Course Test') {
    p.initialCode = "def kelly_fractions(assets):\n    # Write your code here\n    pass\n";
    p.testCases = [
      { "id": 1, "code": "print(kelly_fractions([[0.6, 0.2, 0.25], [0.65, 0.2, 0.4]]))", "expected": "[0.4, 0.0]" },
      { "id": 2, "code": "print(kelly_fractions([[1.0, 0.5, 0.1], [0.0, 0.5, 0.1]]))", "expected": "[1.0, 0.0]" },
      { "id": 3, "code": "print(kelly_fractions([[0.9, 0.8, 0.1]]))", "expected": "[1.0]" }
    ];
    modifiedCount++;
  } else if (p.id == 3 && p.category === 'Last-term Summer Course Test') {
    p.initialCode = "def sharpe_ratio(weights, returns, rf):\n    # Write your code here\n    pass\n";
    p.testCases = [
      { "id": 1, "code": "print(sharpe_ratio([0.5, 0.5], [[0.02, 0.01], [0.03, -0.01], [-0.01, 0.02], [0.04, 0.0]], 0.005))", "expected": "1.3416" }
    ];
    modifiedCount++;
  } else if (p.id == 4 && p.category === 'Last-term Summer Course Test') {
    p.initialCode = "def optimal_weights(exp_returns, cov, rf):\n    # Write your code here\n    pass\n";
    p.testCases = [
      { "id": 1, "code": "print(optimal_weights([0.10, 0.05], [[0.04, 0.01], [0.01, 0.02]], 0.02))", "expected": "([0.7647, 0.2353], 0.4071)" }
    ];
    modifiedCount++;
  }

  // 2. tin314_p1_q5
  if (p.id === 'tin314_p1_q5') {
    p.initialCode = "def identify_type(x):\n    # Write your code here\n    pass\n\ndef identify_types(*args):\n    # Write your code here\n    pass\n\ndef process_list(lst):\n    # Write your code here\n    pass\n";
    modifiedCount++;
  }

  // 3. tin314_p1_q10
  if (p.id === 'tin314_p1_q10') {
    p.initialCode = "def encode_a1z26(text):\n    # Write your code here\n    pass\n\ndef decode_a1z26(code):\n    # Write your code here\n    pass\n";
    modifiedCount++;
  }

  // 4. tin314_p2_q1
  if (p.id === 'tin314_p2_q1') {
    p.initialCode = "def is_prime(n):\n    # Write your code here\n    pass\n\ndef get_nearest_prime(n):\n    # Write your code here\n    pass\n\ndef unlock_door(input_list):\n    # Write your code here\n    pass\n";
    modifiedCount++;
  }

  // 5. tin314_p2_q3
  if (p.id === 'tin314_p2_q3') {
    p.initialCode = "import math\n\ndef calculate_distance(p1, p2):\n    # Write your code here\n    pass\n\ndef tent_area(p1, p2, p3):\n    # Write your code here\n    pass\n";
    p.testCases = [
      { "id": 1, "code": "import math\nprint(tent_area((0,0), (3,0), (0,4)))", "expected": "6.0" },
      { "id": 2, "code": "import math\nprint(tent_area((1,1), (1,4), (5,1)))", "expected": "6.0" },
      { "id": 3, "code": "import math\nprint(tent_area((0,0), (1,0), (0.5, math.sqrt(0.75))))", "expected": "0.4330127018922193" },
      { "id": 4, "code": "import math\nprint(tent_area((0,0), (1,0), (2,0)))", "expected": "0.0" }
    ];
    modifiedCount++;
  }

  // 6. tin314_p2_q7
  if (p.id === 'tin314_p2_q7') {
    p.testCases = [
      { "id": 1, "code": "print(echo_repetition([1, 2, 2, 3, 3, 3, 4]))", "expected": "([1, 2, 3, 4], {1: 1, 2: 2, 3: 3, 4: 1}, 3)" },
      { "id": 2, "code": "print(echo_repetition(['a', 'b', 'a', 'c', 'b', 'a']))", "expected": "(['a', 'b', 'c'], {'a': 3, 'b': 2, 'c': 1}, 'a')" },
      { "id": 3, "code": "print(echo_repetition([]))", "expected": "( [], {}, null)" },
      { "id": 4, "code": "print(echo_repetition([1, 1, 1, 1]))", "expected": "([1], {1: 4}, 1)" }
    ];
    modifiedCount++;
  }

  // 7. tin314_p2_q10
  if (p.id === 'tin314_p2_q10') {
    p.initialCode = "def digit_sum(n):\n    # Write your code here\n    pass\n\ndef is_perfect(n):\n    # Write your code here\n    pass\n\ndef analyze_perfect(lst):\n    # Write your code here\n    pass\n";
    modifiedCount++;
  }

  // 8. tin314_p2_q11
  if (p.id === 'tin314_p2_q11') {
    p.testCases = [
      { "id": 1, "code": "print(count_segments(12, 8))", "expected": "5" },
      { "id": 2, "code": "print(count_segments(7, 5))", "expected": "12" },
      { "id": 3, "code": "print(count_segments(10, 10))", "expected": "2" },
      { "id": 4, "code": "print(count_segments(1, 100))", "expected": "101" }
    ];
    modifiedCount++;
  }

  // 9. tin314_p3_q12
  if (p.id === 'tin314_p3_q12') {
    p.testCases = [
      { "id": 1, "code": "from datetime import date\nprint(count_working_days(2, 3, date(2024, 1, 10)))", "expected": "5" }
    ];
    modifiedCount++;
  }
}

console.log('Modified problems count:', modifiedCount);
fs.writeFileSync('public/problems.json', JSON.stringify(problems, null, 2), 'utf8');
console.log('Saved public/problems.json successfully.');
