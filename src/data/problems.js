export const problems = [
  {
    id: "ftds_1",
    category: "FTDS coding practice",
    title: "1. Tính chu vi hình chữ nhật",
    description: "<p>Viết hàm <code>cal_perimeter(a, b)</code> thực hiện tính chu vi hình chữ nhật, với chiều dài và chiều rộng lần lượt là <code>a</code> và <code>b</code> (số thực).</p><p>Hàm trả về kết quả chu vi hình chữ nhật đó.</p>",
    hint: "Chu vi hình chữ nhật bằng (chiều dài + chiều rộng) * 2. Nhớ dùng lệnh return để trả về kết quả thay vì dùng lệnh print nhé.",
    initialCode: "def cal_perimeter(a, b):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(cal_perimeter(2, 3))",
        expected: "10"
      },
      {
        id: 2,
        code: "print(cal_perimeter(5.5, 4.5))",
        expected: "20.0"
      },
    ]
  },
  {
    id: "ftds_2",
    category: "FTDS coding practice",
    title: "2. Lọc danh sách",
    description: "<p>Viết hàm <code>filter_list(lst)</code> nhận vào một danh sách các số nguyên, và đếm xem trong danh sách ban đầu có bao nhiêu số thoả mãn <strong>chia hết cho 2 nhưng không chia hết cho 3</strong>.</p><p>Hàm trả về số lượng các số thỏa mãn điều kiện. Nếu như không có số nào thoả mãn, hãy trả về số <code>0</code>.</p>",
    hint: "Sử dụng vòng lặp duyệt qua list. Dùng toán tử chia lấy dư (%) để kiểm tra: x % 2 == 0 và x % 3 != 0. Tạo một biến đếm và cộng thêm 1 nếu phần tử thỏa mãn điều kiện.",
    initialCode: "def filter_list(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(filter_list([2, 3, 4, 6]))",
        expected: "2"
      },
      {
        id: 2,
        code: "print(filter_list([3, 6, 9]))",
        expected: "0"
      },
      {
        id: 3,
        code: "print(filter_list([8, 10, 14]))",
        expected: "3"
      },
    ]
  },
  {
    id: "ftds_3",
    category: "FTDS coding practice",
    title: "3. Đảo ngược chuỗi",
    description: "<p>Viết hàm <code>reverse_string(a)</code> trong đó <code>a</code> là chuỗi ký tự (tiếng Việt hoặc tiếng Anh).</p><p>Yêu cầu: Đảo thứ tự các từ, <strong>không</strong> đảo ký tự trong từ. Các từ cách nhau bởi khoảng trắng.</p>",
    hint: "Bạn có thể dùng a.split() để tách chuỗi thành danh sách các từ. Sau đó đảo ngược danh sách này (dùng [::-1] hoặc .reverse()) và nối lại thành chuỗi bằng \" \".join(danh_sach).",
    initialCode: "def reverse_string(a):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(reverse_string(\"Tôi đang học TIN314\"))",
        expected: "TIN314 học đang Tôi"
      },
      {
        id: 2,
        code: "print(reverse_string(\"Hello World\"))",
        expected: "World Hello"
      },
      {
        id: 3,
        code: "print(reverse_string(\"Một hai ba bốn\"))",
        expected: "bốn ba hai Một"
      },
    ]
  },
  {
    id: "ftds_4",
    category: "FTDS coding practice",
    title: "4. Đếm số cặp bằng nhau",
    description: "<p>Cho một danh sách <code>a</code> gồm N số nguyên dương, các phần tử được đánh chỉ số từ 0 đến N-1.</p><p>Hãy viết hàm <code>count_similar(a)</code> để đếm số lượng bộ chỉ số (i, j) thỏa mãn <code>0 <= i < j < N</code> và <code>a[i] == a[j]</code>.</p>",
    hint: "Sử dụng 2 vòng lặp lồng nhau. Vòng lặp ngoài duyệt i từ 0 đến len(a)-1, vòng lặp trong duyệt j từ i+1 đến len(a)-1. Nếu a[i] == a[j] thì tăng biến đếm.",
    initialCode: "def count_similar(a):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_similar([1, 1, 1]))",
        expected: "3"
      },
      {
        id: 2,
        code: "print(count_similar([1, 2, 3]))",
        expected: "0"
      },
      {
        id: 3,
        code: "print(count_similar([1, 2, 1, 2, 1]))",
        expected: "4"
      },
    ]
  },
  {
    id: "exam2_1",
    category: "Mid-term practice",
    title: "Question 1",
    description: "<p>Trong bài toán này, bạn cần kiểm tra số nghiệm của phương trình:</p><p>a x^2 + b x + c = 0</p><p>với a, b, c là các số thực.</p><p>Yêu cầu<br/>Hãy viết hàm check_quadratic_equation(a, b, c) để xác định phương trình trên có nghiệm hay không, và có bao nhiêu nghiệm.</p><p>Hàm cần xét đầy đủ mọi trường hợp có thể xảy ra, bao gồm cả trường hợp phương trình không còn là phương trình bậc hai.</p><p>Kết quả cần trả về<br/>Trả về \"No solution\" nếu phương trình không có nghiệm</p><p>Trả về \"Infinitely many solution\" nếu phương trình có vô số nghiệm</p><p>Nếu phương trình có số nghiệm hữu hạn, trả về một số nguyên dương biểu thị số nghiệm của phương trình</p><p>Ví dụ<br/>Input: a = 1, b = -2, c = 1<br/>Output: 1</p><p>Input: a = 1, b = 1, c = 1<br/>Output: No solution</p><p>Input: a = 0, b = 0, c = 0<br/>Output: Infinitely many solution</p>",
    initialCode: "def check_quadratic_equation(a, b, c):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(check_quadratic_equation(1, -3, 2))",
        expected: "2"
      },
      {
        id: 2,
        code: "print(check_quadratic_equation(1, 2, 1))",
        expected: "1"
      },
      {
        id: 3,
        code: "print(check_quadratic_equation(1, 1, 1))",
        expected: "No solution"
      },
      {
        id: 4,
        code: "print(check_quadratic_equation(0, 5, -10))",
        expected: "1"
      },
      {
        id: 5,
        code: "print(check_quadratic_equation(0, 0, 7))",
        expected: "No solution"
      },
      {
        id: 6,
        code: "print(check_quadratic_equation(0, 0, 0))",
        expected: "Infinitely many solution"
      },
      {
        id: 7,
        code: "print(check_quadratic_equation(-1, 2, -1))",
        expected: "1"
      },
      {
        id: 8,
        code: "print(check_quadratic_equation(4, -20, 25))",
        expected: "1"
      },
      {
        id: 9,
        code: "print(check_quadratic_equation(-2, -4, -6))",
        expected: "No solution"
      },
    ]
  },
  {
    id: "exam2_2",
    category: "Mid-term practice",
    title: "Question 2",
    description: "<p>Bạn được cung cấp một danh sách gồm các số nguyên dương đôi một phân biệt (không có hai số nào giống nhau).</p><p>Một số nguyên dương được gọi là nguyên tố nếu nó lớn hơn 1 và chỉ chia hết cho đúng hai số nguyên dương là 1 và chính nó.</p><p>Viết hàm largest_prime(nums) với:</p><p>nums là danh sách các số nguyên dương đôi một phân biệt.</p><p>Hàm phải tìm số nguyên tố lớn nhất trong danh sách.</p><p>Nếu không tồn tại số nguyên tố, hàm trả về -1.</p>",
    initialCode: "def largest_prime(nums):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(largest_prime([4, 6, 8, 10]))",
        expected: "-1"
      },
      {
        id: 2,
        code: "print(largest_prime([2, 3, 5, 7, 11]))",
        expected: "11"
      },
      {
        id: 3,
        code: "print(largest_prime([15, 21, 29, 14, 22]))",
        expected: "29"
      },
      {
        id: 4,
        code: "print(largest_prime([97, 89, 83, 79]))",
        expected: "97"
      },
      {
        id: 5,
        code: "print(largest_prime([1, 2]))",
        expected: "2"
      },
      {
        id: 6,
        code: "print(largest_prime([12, 15, 17, 19, 23, 24, 29, 31, 37, 41, 43]))",
        expected: "43"
      },
      {
        id: 7,
        code: "print(largest_prime([100, 200, 300, 400, 500, 997, 991, 983, 977]))",
        expected: "997"
      },
      {
        id: 8,
        code: "print(largest_prime([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]))",
        expected: "2"
      },
      {
        id: 9,
        code: "print(largest_prime([1, 22, 33, 44, 55, 66, 77, 88, 99]))",
        expected: "-1"
      },
      {
        id: 10,
        code: "print(largest_prime([742, 83, 915, 112, 367, 529, 991, 456, 178, 643, 219, 587, 331, 917, 431, 802, 233, 761, 59, 277, 841, 953, 749, 691, 23, 389, 967, 128, 701, 929, 349, 604, 157, 317, 887, 271, 19, 839, 613, 509, 223, 457, 821, 643, 97, 106, 863, 487, 43, 379, 607, 293, 101, 569, 829, 683, 151, 461, 241, 773, 887, 991, 563, 31, 157, 211, 79, 917, 433, 601, 223, 71, 373, 907, 761, 137, 193, 359, 727, 97, 271, 491, 643, 571, 41, 673, 463, 227, 523, 229, 787, 919, 607, 199, 347, 941, 787, 613, 967, 983, 997, 191, 619, 499, 19, 281, 877, 419, 877, 991, 653, 523, 337, 463, 757, 953, 823, 743, 313, 661, 503, 673, 283, 709, 839, 233, 617, 563, 331, 911, 577, 947, 419, 383, 281, 491, 487, 641, 463, 823, 953, 547, 857, 631, 991, 983, 673, 223, 213, 433, 881, 907, 743, 863, 673, 503, 859, 991, 917, 19, 641, 431, 419, 683, 661, 829, 769, 421, 613, 587, 773, 859, 941, 773, 602, 641, 431, 673, 223, 919, 881, 991, 383, 827, 839, 877, 983, 991, 947, 811, 773, 641, 547, 673, 823, 919, 947, 991, 983, 839, 887, 911, 967, 983, 991, 997, 881, 859]))",
        expected: "997"
      },
    ]
  },
  {
    id: "exam2_3",
    category: "Mid-term practice",
    title: "Question 3",
    description: "<p>Viết hàm compare_lists(list1, list2) nhận vào hai danh sách các số nguyên và trả về True nếu hai danh sách “giống nhau”, và False nếu không giống nhau. Hai danh sách được coi là giống nhau nếu chúng chứa các phần tử giống hệt nhau và số lần xuất hiện của mỗi phần tử trong hai danh sách là như nhau, không phụ thuộc vào thứ tự các phần tử.</p><p>Ví dụ:</p><p>list1 = [1, 2, 2, 3], list2 = [3, 2, 1, 2] → True</p><p>list1 = [1, 2, 3], list2 = [1, 2, 2, 3] → False</p><p>list1 = [4, 5, 6], list2 = [6, 5, 4] → True</p>",
    initialCode: "def compare_lists(list1, list2):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(compare_lists([1, 2, 2, 3], [3, 2, 1, 2]))",
        expected: "True"
      },
      {
        id: 2,
        code: "print(compare_lists([1, 2, 3], [1, 2, 2, 3]))",
        expected: "False"
      },
      {
        id: 3,
        code: "print(compare_lists([4, 5, 6], [6, 5, 4]))",
        expected: "True"
      },
      {
        id: 4,
        code: "print(compare_lists([], []))",
        expected: "True"
      },
      {
        id: 5,
        code: "print(compare_lists([1], [1, 1]))",
        expected: "False"
      },
      {
        id: 6,
        code: "print(compare_lists([1,2,3,4,5,5,6,7,8,9,10,10,9,8,7,6,5,4,3,2], [10,9,8,7,6,5,4,3,2,1,2,3,4,5,6,7,8,9,10,5]))",
        expected: "True"
      },
      {
        id: 7,
        code: "print(compare_lists([-1,-1,-2,-3,-3,-3,-4,-5,-5,-6], [-6,-5,-5,-4,-3,-3,-3,-2,-1,-1]))",
        expected: "True"
      },
      {
        id: 8,
        code: "print(compare_lists([10,10,20,20,20,30,30,40,50,60], [10,10,20,20,30,30,40,50,60,60]))",
        expected: "False"
      },
      {
        id: 9,
        code: "print(compare_lists([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10], [10,9,8,7,6,5,4,3,2,1,10,9,8,7,6,5,4,3,2,1,10,9,8,7,6,5,4,3,2,1]))",
        expected: "True"
      },
    ]
  },
  {
    id: "exam2_5",
    category: "Mid-term practice",
    title: "Question 5",
    description: "<p>Viết một hàm có tên process_list(lst) nhận vào một danh sách gồm các số nguyên.</p><p>Yêu cầu của hàm:</p><p>Lọc và giữ lại các số lẻ trong danh sách đầu vào.</p><p>Tạo một danh sách mới, trong đó mỗi phần tử là bình phương của các số lẻ vừa chọn.</p><p>Trả về danh sách mới đó, nếu như trong danh sách đầu vào không có số nào thoả mãn thì hãy trả lại danh sách rỗng</p><p>For example:</p><p>Test\tResult<br/>print(process_list([1, 2, 3, 4, 5]))<br/>[1, 9, 25]</p>",
    initialCode: "def process_list(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(process_list([1, 2, 3, 4, 5]))",
        expected: "[1, 9, 25]"
      },
      {
        id: 2,
        code: "print(process_list([10, 11, 12, 13, 14, 15]))",
        expected: "[121, 169, 225]"
      },
      {
        id: 3,
        code: "print(process_list([-5, -4, -3, -2, -1, 0, 1]))",
        expected: "[25, 9, 1, 1]"
      },
      {
        id: 4,
        code: "print(process_list([]))",
        expected: "[]"
      },
      {
        id: 5,
        code: "print(process_list([2, 4, 6, 8]))",
        expected: "[]"
      },
      {
        id: 6,
        code: "print(process_list([1, 3, 5, 7, 9]))",
        expected: "[1, 9, 25, 49, 81]"
      },
      {
        id: 7,
        code: "print(process_list([100, 99, 77, 55, 22, 33]))",
        expected: "[9801, 5929, 3025, 1089]"
      },
      {
        id: 8,
        code: "print(process_list([0, 1, 2, 3, 4, 5, 6, 7]))",
        expected: "[1, 9, 25, 49]"
      },
      {
        id: 9,
        code: "print(process_list([i for i in range(-15, 16)]))",
        expected: "[225, 169, 121, 81, 49, 25, 9, 1, 1, 9, 25, 49, 81, 121, 169, 225]"
      },
      {
        id: 10,
        code: "print(process_list([-11, -10, -9, -8, -7, -6]))",
        expected: "[121, 81, 49]"
      },
    ]
  },
  {
    id: "exam2_6",
    category: "Mid-term practice",
    title: "Question 6",
    description: "<p>Bạn Trường có hai đoạn dây, đoạn thứ nhất dài N mét và đoạn thứ hai dài M mét (N và M là các số nguyên dương).</p><p>Trường muốn cắt hai đoạn dây này thành các đoạn dây nhỏ sao cho:</p><p>Tất cả các đoạn dây nhỏ đều có cùng một độ dài.</p><p>Không có phần dây thừa.</p><p>Độ dài mỗi đoạn dây nhỏ là lớn nhất có thể.</p><p>Khi đó, hỏi Trường có thể cắt được tổng cộng bao nhiêu đoạn dây nhỏ từ hai đoạn dây ban đầu.</p><p>Viết hàm count_segments(N, M) nhận vào hai số nguyên dương N và M, và trả về một số nguyên là tổng số đoạn dây nhỏ có thể cắt được theo quy tắc trên.</p>",
    initialCode: "def count_segments(N, M):\n    # Write your code here\n    pass\n",
    testCases: [
    ]
  },
  {
    id: "exam2_7",
    category: "Mid-term practice",
    title: "Question 7",
    description: "<p>Cho một dãy các số nguyên. Người ta được phép đặt dấu + hoặc dấu - trước mỗi số trong dãy.</p><p>Lưu ý: nếu đặt dấu - trước một số âm thì ví dụ -(-3) sẽ trở thành +3.</p><p>Viết hàm: def max_signed_sum(arr):</p><p>Trong đó:</p><p>arr là một danh sách (list) các số nguyên.</p><p>Hàm trả về giá trị tổng lớn nhất có thể đạt được bằng cách đặt dấu + hoặc - trước mỗi phần tử.</p><p>Ví dụ:<br/>Nếu arr = [1, -2, 3] thì kết quả lớn nhất là 1 + 2 + 3 = 6.</p>",
    initialCode: "def max_signed_sum(arr):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(max_signed_sum([1, -2, 3]))",
        expected: "6"
      },
      {
        id: 2,
        code: "print(max_signed_sum([-5, -10, 7]))",
        expected: "22"
      },
      {
        id: 3,
        code: "print(max_signed_sum([0, -1, 2, -3, 4]))",
        expected: "10"
      },
      {
        id: 4,
        code: "print(max_signed_sum([-1, -1, -1, -1]))",
        expected: "4"
      },
      {
        id: 5,
        code: "print(max_signed_sum([10, -20, 30, -40, 50]))",
        expected: "150"
      },
      {
        id: 6,
        code: "print(max_signed_sum([-8, 5, -3, 2, -9, 4]))",
        expected: "31"
      },
      {
        id: 7,
        code: "print(max_signed_sum([1, -1, 1, -1, 1, -1]))",
        expected: "6"
      },
      {
        id: 8,
        code: "print(max_signed_sum([1, -2, 3, -4, 5, -6, 7, -8, 9, -10, 11, -12, 13, -14, 15]))",
        expected: "120"
      },
      {
        id: 9,
        code: "print(max_signed_sum([-5, -15, 25, -35, 45, -55, 65, -75, 85, -95, 105]))",
        expected: "605"
      },
      {
        id: 10,
        code: "print(max_signed_sum([10, -20, 30, -40, 50, -60, 70, -80, 90, -100]))",
        expected: "550"
      },
    ]
  },
  {
    id: "exam2_8",
    category: "Mid-term practice",
    title: "Question 8",
    description: "<p>Bạn Việt được cho một tấm bìa hình chữ nhật kích thước N x M, trong đó N và M là hai số nguyên dương, biểu diễn chiều dài và chiều rộng của tấm bìa (theo cùng một đơn vị đo).</p><p>Bạn Việt muốn cắt tấm bìa này thành các hình vuông giống hệt nhau, sao cho:</p><p>Mỗi hình vuông đều có cạnh là số nguyên dương.</p><p>Không có phần bìa nào bị bỏ đi (tức là tấm bìa được chia hết hoàn toàn bởi các hình vuông đó).</p><p>Diện tích của mỗi hình vuông là lớn nhất có thể.</p><p>Viết hàm max_square_area(N, M) với:</p><p>N, M là hai số nguyên dương (kích thước tấm bìa).</p><p>Hàm trả về diện tích của hình vuông lớn nhất (tính theo đơn vị diện tích) mà bạn có thể dùng để cắt tấm bìa N x M thành các hình vuông giống hệt nhau, không thừa.</p>",
    initialCode: "def max_square_area(N, M):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(max_square_area(12, 18))",
        expected: "36"
      },
      {
        id: 2,
        code: "print(max_square_area(5, 3))",
        expected: "1"
      },
      {
        id: 3,
        code: "print(max_square_area(7, 13))",
        expected: "1"
      },
      {
        id: 4,
        code: "print(max_square_area(100, 80))",
        expected: "400"
      },
      {
        id: 5,
        code: "print(max_square_area(6, 9))",
        expected: "9"
      },
      {
        id: 6,
        code: "print(max_square_area(999983, 46339))",
        expected: "1"
      },
      {
        id: 7,
        code: "print(max_square_area(123456, 789012))",
        expected: "144"
      },
      {
        id: 8,
        code: "print(max_square_area(2000000000, 1999999999))",
        expected: "1"
      },
      {
        id: 9,
        code: "print(max_square_area(1234567890,9876543210))",
        expected: "8100"
      },
      {
        id: 10,
        code: "print(max_square_area(1987654320, 1246913580))",
        expected: "3600"
      },
    ]
  },
  {
    id: "exam2_9",
    category: "Mid-term practice",
    title: "Question 9",
    description: "<p>Viết một hàm count(lst) nhận vào một danh sách lst chỉ chứa các số nguyên.<br/>Hàm trả về phần tử xuất hiện nhiều nhất trong danh sách.</p><p>Nếu có nhiều phần tử có cùng số lần xuất hiện cao nhất, trả về phần tử có giá trị nhỏ nhất trong số đó.</p>",
    initialCode: "def count(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count([1, 2, 2, 3, 4, 4, 4, 5]))",
        expected: "4"
      },
      {
        id: 2,
        code: "print(count([10, 10, 20, 20, 30, 30]))",
        expected: "10"
      },
      {
        id: 3,
        code: "print(count([5]))",
        expected: "5"
      },
      {
        id: 4,
        code: "print(count([-1, -1, -2, -2, -2, -3]))",
        expected: "-2"
      },
      {
        id: 5,
        code: "print(count([1]*30 + [2]*50 + [3]*20))",
        expected: "2"
      },
      {
        id: 6,
        code: "print(count([5]*40 + [10]*40 + [3]*10))",
        expected: "5"
      },
      {
        id: 7,
        code: "print(count([i for i in range(-50, 50)] + [-5, -5, -3, -3]))",
        expected: "-5"
      },
      {
        id: 8,
        code: "print(count([i % 25 for i in range(200)]))",
        expected: "0"
      },
      {
        id: 9,
        code: "print(count([i for i in range(120)] + [42, 42, 42]))",
        expected: "42"
      },
      {
        id: 10,
        code: "print(count([i for i in range(100)] + [10, 10, 20, 20, 30, 30]))",
        expected: "10"
      },
    ]
  },
  {
    id: "exam2_10",
    category: "Mid-term practice",
    title: "Question 10",
    description: "<p>Bạn được cung cấp một danh sách prices, trong đó prices[i] là giá của một loại đá quý vào ngày thứ i.</p><p>Bạn chỉ được phép thực hiện đúng một lần giao dịch, bao gồm:</p><p>Mua vào một ngày bất kỳ</p><p>Bán vào một ngày phía sau ngày mua (không được bán trước khi mua)</p><p>Mục tiêu của bạn là tính lợi nhuận tối đa có thể đạt được.</p><p>Lợi nhuận được tính bằng  giá bán - giá mua</p><p>Nếu không thể thu được lợi nhuận (giá luôn giảm), trả về 0. Viết hàm  max_profit(prices). Hàm nhận vào một list prices và trả về một số nguyên là lợi nhuận lớn nhất có thể đạt được.</p>",
    initialCode: "def max_profit(prices):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(max_profit([7, 1, 5, 3, 6, 4]))",
        expected: "5"
      },
      {
        id: 2,
        code: "print(max_profit([1, 2, 3, 4, 5]))",
        expected: "4"
      },
      {
        id: 3,
        code: "print(max_profit([7, 6, 4, 3, 1]))",
        expected: "0"
      },
      {
        id: 4,
        code: "print(max_profit([3, 3, 3, 3, 3]))",
        expected: "0"
      },
      {
        id: 5,
        code: "print(max_profit([2, 4, 1]))",
        expected: "2"
      },
      {
        id: 6,
        code: "print(max_profit([i for i in range(1, 100001)]))",
        expected: "99999"
      },
      {
        id: 7,
        code: "print(max_profit([i for i in range(100000, 0, -1)]))",
        expected: "0"
      },
      {
        id: 8,
        code: "print(max_profit([(37 * i) % 100000 for i in range(1, 100001)]))",
        expected: "99996"
      },
      {
        id: 9,
        code: "print(max_profit([100000 - i if i % 2 == 0 else i for i in range(1, 100001)]))",
        expected: "99998"
      },
    ]
  },
  {
    id: "exam2_11",
    category: "Mid-term practice",
    title: "Question 11",
    description: "<p>Viết hàm mirror_message(x) với yêu cầu như sau:</p><p>Nếu x là chuỗi (string), hàm trả về chuỗi đảo ngược của x.<br/>(Ví dụ: hello → olleh)</p><p>Nếu x là số nguyên (int) hoặc số thực (float), hàm trả về số đối của x.<br/>(Ví dụ: 5 → -5, -3.2 → 3.2)</p><p>Nếu x thuộc kiểu dữ liệu khác, hàm trả về chuỗi Unsupported.</p>",
    initialCode: "def mirror_message(x):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(mirror_message(\"hello\"))",
        expected: "olleh"
      },
      {
        id: 2,
        code: "print(mirror_message(\"madam\"))",
        expected: "madam"
      },
      {
        id: 3,
        code: "print(mirror_message(25))",
        expected: "-25"
      },
      {
        id: 4,
        code: "print(mirror_message(-100))",
        expected: "100"
      },
      {
        id: 5,
        code: "print(mirror_message(12.75))",
        expected: "-12.75"
      },
      {
        id: 6,
        code: "print(mirror_message(True))",
        expected: "Unsupported"
      },
      {
        id: 7,
        code: "print(mirror_message([1, 2, 3]))",
        expected: "Unsupported"
      },
      {
        id: 8,
        code: "print(mirror_message((1, 2)))",
        expected: "Unsupported"
      },
    ]
  },
  {
    id: "exam2_12",
    category: "Mid-term practice",
    title: "Question 12",
    description: "<p>Cho một số nguyên dương N.</p><p>Hãy viết hàm nearest_prime(N) để tìm số nguyên tố nhỏ nhất p thoả mãn p ≥ N.</p><p>Ví dụ<br/>nearest_prime(10)<br/>→ trả về: 11</p><p>nearest_prime(17)<br/>→ trả về: 17</p><p>nearest_prime(1)<br/>→ trả về: 2</p>",
    initialCode: "def nearest_prime(N):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(nearest_prime(10))",
        expected: "11"
      },
      {
        id: 2,
        code: "print(nearest_prime(17))",
        expected: "17"
      },
      {
        id: 3,
        code: "print(nearest_prime(1))",
        expected: "2"
      },
      {
        id: 4,
        code: "print(nearest_prime(14))",
        expected: "17"
      },
      {
        id: 5,
        code: "print(nearest_prime(100))",
        expected: "101"
      },
      {
        id: 6,
        code: "print(nearest_prime(25))",
        expected: "29"
      },
      {
        id: 7,
        code: "print(nearest_prime(48))",
        expected: "53"
      },
      {
        id: 8,
        code: "print(nearest_prime(1000))",
        expected: "1009"
      },
      {
        id: 9,
        code: "print(nearest_prime(1000000))",
        expected: "1000003"
      },
      {
        id: 10,
        code: "print(nearest_prime(10000))",
        expected: "10007"
      },
    ]
  },
  {
    id: "exam2_13",
    category: "Mid-term practice",
    title: "Question 13",
    description: "<p>Bạn Nam có một danh sách list gồm các số nguyên. Nam chơi một trò như sau:</p><p>Ở mỗi bước, Nam chọn ngẫu nhiên hai số a và b trong list, xóa chúng khỏi list, sau đó thêm vào cuối list một số mới có giá trị bằng a + b + 1.</p><p>Nam lặp lại quá trình này cho đến khi list chỉ còn lại đúng một số duy nhất.</p><p>Hỏi: Số cuối cùng còn lại trong list là bao nhiêu?</p><p>Viết hàm: final_number(lst)</p><p>Hàm nhận vào một list các số nguyên và trả về số cuối cùng còn lại trong list sau khi thực hiện trò chơi nêu trên.</p>",
    initialCode: "def final_number(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(final_number([5]))",
        expected: "5"
      },
      {
        id: 2,
        code: "print(final_number([1, 2]))",
        expected: "4"
      },
      {
        id: 3,
        code: "print(final_number([1, 2, 3]))",
        expected: "8"
      },
      {
        id: 4,
        code: "print(final_number([1, 3, 5, 7]))",
        expected: "19"
      },
      {
        id: 5,
        code: "print(final_number(list(range(1, 101))))",
        expected: "5149"
      },
      {
        id: 6,
        code: "print(final_number(list(range(1, 10001))))",
        expected: "50014999"
      },
      {
        id: 7,
        code: "print(final_number(\n[92, 14, 37, 70, 64, 51, 30, 48, 3, 39, 63, 18, 58, 12, 72, 44, 6, 55, 19, 33, 27, 97, 90, 81, 13, 8, 75, 42, 20, 95, 56, 5, 40, 84, 46, 26, 78, 9, 66, 28, 7, 52, 22, 31, 10, 25, 79, 53, 34, 17, 60, 21, 45, 83, 62, 87, 98, 2, 69, 11, 24, 41, 54, 57, 76, 50, 32, 29, 61, 15, 43, 73, 96, 23, 35, 49, 68, 16, 4, 38, 71, 47, 1, 59, 65, 88, 85, 89, 82, 77, 94, 93, 91, 67, 80, 86, 36, 74, 100, 14] * 10\n))",
        expected: "50649"
      },
      {
        id: 8,
        code: "print(final_number(\n[7, 14, 28, 35, 42, 56, 63, 70, 77, 84] * 100\n))",
        expected: "48599"
      },
      {
        id: 9,
        code: "print(final_number([10] * 1000))",
        expected: "10999"
      },
      {
        id: 10,
        code: "print(final_number(list(range(1, 1001))))",
        expected: "501499"
      },
    ]
  },
  {
    id: "exam2_15",
    category: "Mid-term practice",
    title: "Question 15",
    description: "<p>Một số nguyên được gọi là số hoàn hảo nếu nó chia hết cho tổng các chữ số của chính nó. Số 0 không được coi là số hoàn hảo.</p><p>Ví dụ:</p><p>18 có tổng các chữ số là 1 + 8 = 9, và 18 % 9 == 0 → là số hoàn hảo</p><p>23 có tổng chữ số là 2 + 3 = 5, nhưng 23 % 5 != 0 → không phải số hoàn hảo</p><p>-12 có tổng chữ số là 1 + 2 = 3, và -12 % 3 == 0 → là số hoàn hảo<br/>Viết hàm find_perfect_numbers(lst) nhận vào một danh sách các số nguyên.</p><p>Hàm trả về một danh sách mới gồm các phần tử trong danh sách ban đầu là số hoàn hảo (dựa theo định nghĩa trên).</p>",
    initialCode: "def find_perfect_numbers(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(find_perfect_numbers([12, 15, 18, 20]))",
        expected: "[12, 18, 20]"
      },
      {
        id: 2,
        code: "print(find_perfect_numbers([-12, -18, 0, 21, 30]))",
        expected: "[-12, -18, 21, 30]"
      },
      {
        id: 3,
        code: "print(find_perfect_numbers([11, 13, 17, 19]))",
        expected: "[]"
      },
      {
        id: 4,
        code: "print(find_perfect_numbers([10, 20, 30, 40]))",
        expected: "[10, 20, 30, 40]"
      },
      {
        id: 5,
        code: "print(find_perfect_numbers([i for i in range(1, 101)]))",
        expected: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 20, 21, 24, 27, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 70, 72, 80, 81, 84, 90, 100]"
      },
      {
        id: 6,
        code: "print(find_perfect_numbers([i for i in range(-50, 101)]))",
        expected: "[-50, -48, -45, -42, -40, -36, -30, -27, -24, -21, -20, -18, -12, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 20, 21, 24, 27, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 70, 72, 80, 81, 84, 90, 100]"
      },
      {
        id: 7,
        code: "print(find_perfect_numbers([i * 9 for i in range(1, 101)]))",
        expected: "[9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 108, 117, 126, 135, 144, 153, 162, 171, 180, 198, 207, 216, 225, 234, 243, 252, 261, 270, 288, 306, 315, 324, 333, 342, 351, 360, 378, 396, 405, 414, 423, 432, 441, 450, 468, 486, 504, 513, 522, 531, 540, 558, 576, 594, 603, 612, 621, 630, 648, 666, 684, 702, 711, 720, 738, 756, 774, 792, 801, 810, 828, 846, 864, 882, 900]"
      },
      {
        id: 8,
        code: "print(find_perfect_numbers([i for i in range(1000)]))",
        expected: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 20, 21, 24, 27, 30, 36, 40, 42, 45, 48, 50, 54, 60, 63, 70, 72, 80, 81, 84, 90, 100, 102, 108, 110, 111, 112, 114, 117, 120, 126, 132, 133, 135, 140, 144, 150, 152, 153, 156, 162, 171, 180, 190, 192, 195, 198, 200, 201, 204, 207, 209, 210, 216, 220, 222, 224, 225, 228, 230, 234, 240, 243, 247, 252, 261, 264, 266, 270, 280, 285, 288, 300, 306, 308, 312, 315, 320, 322, 324, 330, 333, 336, 342, 351, 360, 364, 370, 372, 375, 378, 392, 396, 399, 400, 402, 405, 407, 408, 410, 414, 420, 423, 432, 440, 441, 444, 448, 450, 460, 465, 468, 476, 480, 481, 486, 500, 504, 506, 510, 511, 512, 513, 516, 518, 522, 531, 540, 550, 552, 555, 558, 576, 588, 592, 594, 600, 603, 605, 612, 621, 624, 629, 630, 640, 644, 645, 648, 660, 666, 684, 690, 700, 702, 704, 711, 715, 720, 730, 732, 735, 736, 738, 756, 770, 774, 777, 780, 782, 792, 800, 801, 803, 804, 810, 820, 825, 828, 832, 840, 846, 864, 870, 874, 880, 882, 888, 900, 902, 910, 912, 915, 918, 935, 936, 954, 960, 966, 972, 990, 999]"
      },
      {
        id: 9,
        code: "print(find_perfect_numbers([i for i in range(-50,50)]))",
        expected: "[-50, -48, -45, -42, -40, -36, -30, -27, -24, -21, -20, -18, -12, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 20, 21, 24, 27, 30, 36, 40, 42, 45, 48]"
      },
      {
        id: 10,
        code: "print(find_perfect_numbers([18, 18, 18] * 10 + [21, 21] * 20))",
        expected: "[18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21]"
      },
    ]
  },
  {
    id: "exam2_16",
    category: "Mid-term practice",
    title: "Question 16",
    description: "<p>Viết hàm count_three_sum(lst) nhận vào một danh sách các số nguyên đôi một phân biệt và trả về số lượng cách có thể chọn ra 3 phần tử trong danh sách sao cho tổng của chúng bằng 0.</p>",
    initialCode: "def count_three_sum(lst):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_three_sum([-10, -5, -2, 0, 1, 3, 5, 7, 10]))",
        expected: "4"
      },
      {
        id: 2,
        code: "print(count_three_sum([-2, 0, 1, 1, 2]))",
        expected: "2"
      },
      {
        id: 3,
        code: "print(count_three_sum([5, 7, 11, 13, 17, 19]))",
        expected: "0"
      },
      {
        id: 4,
        code: "print(count_three_sum([-8, -3, -2, -1, 0, 1, 2, 3, 4, 5, -5, 6, -6, 7, -7]))",
        expected: "23"
      },
      {
        id: 5,
        code: "print(count_three_sum([-5, -1, 0, 1, 2, 4, 5, -4, 3, -2]))",
        expected: "9"
      },
      {
        id: 6,
        code: "print(count_three_sum(list(range(-50, 50))))",
        expected: "1225"
      },
      {
        id: 7,
        code: "print(count_three_sum(list(range(-75, 75))))",
        expected: "2775"
      },
      {
        id: 8,
        code: "print(count_three_sum(list(range(-500, 500))))",
        expected: "124750"
      },
      {
        id: 9,
        code: "print(count_three_sum(list(range(-1000, 1000))))",
        expected: "499500"
      },
      {
        id: 10,
        code: "print(count_three_sum([\n-6571, 5196, 2463, -8567, -8122, -4910, 4574, -7359, 5460, -1735,\n5688, 3152, 995, -5891, -5751, 4264, 6929, -708, 9507, -6087,\n-2218, 9369, -728, 1100, -9971, 6408, 9526, -8154, 7415, 3557,\n-3150, -1493, -7330, 3066, 6987, -4286, 8548, -2920, -9817, -8623,\n-2314, -3644, 4374, -9530, -2668, -5909, 3867, -7516, 8387, 9920,\n-5403, -8870, 5896, 2197, -378, 7945, 1874, -4887, 4555, 7054,\n-2563, 12, 9417, -6897, 9222, 8475, -1936, -4527, -3526, -8201,\n2704, 2219, 8812, -1031, 3372, -9941, -7440, 3457, -352, -6009,\n9662, -8955, 6158, -1467, -7667, 4182, 7633, -5681, -3348, 5920,\n9011, 7058, 4768, -6495, 2845, -4226, -5808, -5760, 9049, -7537,\n3849, 8496, 162, -7083, 8452, -8515, -5104, -7103, 7520, 5512,\n-6662, -9495, 7491, -8102, 7093, 5339, 2448, -7680, 8695, -9917,\n466, -4873, -8411, 9650, 3816, 9017, 6665, -2907, 3882, -6309,\n7421, -5694, -3642, -9417, 5875, -7744, 3898, -5127, -5735, 7284,\n8510, -5982, 5635, -3743, -7389, 418, -9518, -8351, 9600, 187,\n-8865, -7286, 2955, -718, -5533, 2518, -7023, -438, 3654, -9411,\n7999, 5824, -3005, 8714, -3428, -3361, 8745, -6297, -8277, -7610,\n-8639, -6988, -9110, 8237, 5604, -2681, -9334, 3566, -5743, -6632,\n-8327, 5385, -8660, 8516, 8323, 6028, -7659, 5471, -1051, -2554,\n-9805, 1277, 3149, 8800, -1894, 6952, -5055, -4376, -7740, -3758,\n-7612, -9475, 4368, 1158, 7646, -4669, -5161, -6499, -2029, -9412,\n-6674, -5332 ]))",
        expected: "53"
      },
    ]
  },
  {
    id: "exam2_17",
    category: "Mid-term practice",
    title: "Question 17",
    description: "<p>Viết hàm binomial_coefficient(n, k) nhận vào hai số nguyên không âm n và k (với 0 ≤ k ≤ n) và trả về giá trị của số tổ hợp chập k của tập n phần tử: nCk.</p><p>TnCk được định nghĩa là số cách chọn k phần tử từ n phần tử khác nhau mà không quan tâm đến thứ tự. Giá trị này có thể được tính bằng công thức:</p><p>nCk = n! / (k! * (n - k)!)</p><p>Ví dụ:</p><p>binomial_coefficient(5, 2) → 10</p><p>binomial_coefficient(6, 0) → 1</p><p>binomial_coefficient(6, 6) → 1</p><p>binomial_coefficient(10, 3) → 120</p>",
    initialCode: "def binomial_coefficient(n, k):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(binomial_coefficient(5, 2))",
        expected: "10"
      },
      {
        id: 2,
        code: "print(binomial_coefficient(6, 0))",
        expected: "1"
      },
      {
        id: 3,
        code: "print(binomial_coefficient(6, 6))",
        expected: "1"
      },
      {
        id: 4,
        code: "print(binomial_coefficient(7, 1))",
        expected: "7"
      },
      {
        id: 5,
        code: "print(binomial_coefficient(8, 2))",
        expected: "28"
      },
      {
        id: 6,
        code: "print(binomial_coefficient(9, 3))",
        expected: "84"
      },
      {
        id: 7,
        code: "print(binomial_coefficient(10, 4))",
        expected: "210"
      },
      {
        id: 8,
        code: "print(binomial_coefficient(12, 2))",
        expected: "66"
      },
      {
        id: 9,
        code: "print(binomial_coefficient(12, 6))",
        expected: "924"
      },
      {
        id: 10,
        code: "print(binomial_coefficient(15, 4))",
        expected: "1365"
      },
      {
        id: 11,
        code: "print(binomial_coefficient(18, 5))",
        expected: "8568"
      },
      {
        id: 12,
        code: "print(binomial_coefficient(17, 8))",
        expected: "24310"
      },
      {
        id: 13,
        code: "print(binomial_coefficient(20, 15))",
        expected: "15504"
      },
      {
        id: 14,
        code: "print(binomial_coefficient(30, 10))",
        expected: "30045015"
      },
      {
        id: 15,
        code: "print(binomial_coefficient(28, 14))",
        expected: "40116600"
      },
    ]
  },
  {
    id: "exam2_18",
    category: "Mid-term practice",
    title: "Question 18",
    description: "<p>Cho một danh sách a gồm N số nguyên dương đôi một phân biệt, và một số nguyên dương x.</p><p>Hãy viết hàm count_sum(a, x) để tìm xem có bao nhiêu bộ chỉ số (i, j, k) thỏa mãn:</p><p>1 <= i < j < k <= N</p><p>a[i] + a[j] + a[k] = x</p><p>Hàm count_sum(a, x) nhận vào danh sách a (các số nguyên dương phân biệt) và số nguyên dương x, trả về một số nguyên là số bộ ba phần tử có tổng bằng x.</p>",
    initialCode: "def count_sum(a, x):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_sum([1, 2, 3, 4, 5], 6))",
        expected: "1"
      },
      {
        id: 2,
        code: "print(count_sum([1, 2, 3, 4, 5], 10))",
        expected: "2"
      },
      {
        id: 3,
        code: "print(count_sum([2, 4, 6, 8, 10], 18))",
        expected: "2"
      },
      {
        id: 4,
        code: "print(count_sum([1, 4, 7, 10, 13, 16], 21))",
        expected: "3"
      },
      {
        id: 5,
        code: "print(count_sum(list(range(1, 51)), 50))",
        expected: "184"
      },
      {
        id: 6,
        code: "print(count_sum(list(range(1, 31)), 20))",
        expected: "24"
      },
      {
        id: 7,
        code: "print(count_sum(list(range(1, 2001, 2)), 301))",
        expected: "1850"
      },
      {
        id: 8,
        code: "print(count_sum(list(range(1, 5001)), 6000))",
        expected: "2748000"
      },
      {
        id: 9,
        code: "print(count_sum(list(range(1, 1001)), 1500))",
        expected: "124750"
      },
      {
        id: 10,
        code: "print(count_sum(list(range(1, 3001)), 4000))",
        expected: "1082333"
      },
    ]
  },
  {
    id: "exam2_19",
    category: "Mid-term practice",
    title: "Question 19",
    description: "<p>Danh sách các công việc được biểu diễn dưới dạng một list các dictionary, mỗi phần tử có cấu trúc:</p><p>{'name': 'Gia sư', 'hours': 10, 'pay': 150}</p><p>Trong đó:</p><p>name: tên công việc (string)</p><p>hours: số giờ cần để hoàn thành công việc (số nguyên dương)</p><p>pay: tổng tiền nhận được khi hoàn thành công việc (số thực hoặc số nguyên)</p><p>Giả sử rằng mỗi công việc phải được làm trọn gói, không được chia nhỏ số giờ.</p><p>Yêu cầu<br/>Sinh viên có tối đa 40 giờ làm việc mỗi tuần.</p><p>Hãy viết hàm max_income(jobs) để lựa chọn một tập con các công việc sao cho:</p><p>Tổng số giờ làm không vượt quá 40</p><p>Tổng thu nhập nhận được là lớn nhất có thể</p><p>Giá trị trả về<br/>Hàm chỉ trả về một giá trị duy nhất</p><p>Giá trị đó là tổng thu nhập lớn nhất mà sinh viên có thể kiếm được</p><p>Kết quả là một số thực hoặc số nguyên, tùy dữ liệu đầu vào</p><p>Ví dụ<br/>Input:<br/>jobs = [{'name': 'Gia sư', 'hours': 10, 'pay': 150}, {'name': 'Bán hàng', 'hours': 15, 'pay': 180}, {'name': 'Giao hàng', 'hours': 8, 'pay': 120}, {'name': 'Phục vụ', 'hours': 20, 'pay': 200}]</p><p>Output:<br/>450</p>",
    initialCode: "def max_income(jobs):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(max_income([\n {'name':'Gia sư','hours':10,'pay':150},\n {'name':'Bán hàng','hours':15,'pay':180},\n {'name':'Giao hàng','hours':8,'pay':120},\n {'name':'Phục vụ','hours':20,'pay':200}\n]))",
        expected: "470"
      },
      {
        id: 2,
        code: "print(max_income([\n {'name':'A','hours':10,'pay':100},\n {'name':'B','hours':40,'pay':380}\n]))",
        expected: "380"
      },
      {
        id: 3,
        code: "print(max_income([\n {'name':'A','hours':5,'pay':60},\n {'name':'B','hours':5,'pay':70},\n {'name':'C','hours':5,'pay':80},\n {'name':'D','hours':5,'pay':90},\n {'name':'E','hours':5,'pay':100}\n]))",
        expected: "400"
      },
      {
        id: 4,
        code: "print(max_income([\n {'name':'A','hours':35,'pay':400},\n {'name':'B','hours':10,'pay':150},\n {'name':'C','hours':5,'pay':80}\n]))",
        expected: "480"
      },
      {
        id: 5,
        code: "print(max_income([\n {'name':'A','hours':25,'pay':200},\n {'name':'B','hours':20,'pay':190},\n {'name':'C','hours':15,'pay':160}\n]))",
        expected: "360"
      },
      {
        id: 6,
        code: "print(max_income([\n {'name':'Gia sư Toán','hours':12,'pay':240},\n {'name':'Gia sư Anh','hours':10,'pay':300},\n {'name':'Phục vụ','hours':18,'pay':270},\n {'name':'Giao hàng','hours':9,'pay':162},\n {'name':'Thiết kế','hours':6,'pay':180},\n {'name':'Nhập liệu','hours':20,'pay':260},\n {'name':'SEO','hours':15,'pay':375},\n {'name':'Video','hours':12,'pay':360}\n]))",
        expected: "1080"
      },
      {
        id: 7,
        code: "print(max_income([\n {'name':'A','hours':7,'pay':140},\n {'name':'B','hours':14,'pay':280},\n {'name':'C','hours':21,'pay':400},\n {'name':'D','hours':10,'pay':190},\n {'name':'E','hours':9,'pay':170},\n {'name':'F','hours':20,'pay':360},\n {'name':'G','hours':8,'pay':150},\n {'name':'H','hours':6,'pay':120},\n {'name':'I','hours':5,'pay':100}\n]))",
        expected: "790"
      },
      {
        id: 8,
        code: "print(max_income([\n {'name':'Job1','hours':5,'pay':90},\n {'name':'Job2','hours':10,'pay':140},\n {'name':'Job3','hours':8,'pay':120},\n {'name':'Job4','hours':20,'pay':300},\n {'name':'Job5','hours':15,'pay':210},\n {'name':'Job6','hours':6,'pay':84},\n {'name':'Job7','hours':12,'pay':180},\n {'name':'Job8','hours':9,'pay':135},\n {'name':'Job9','hours':25,'pay':350},\n {'name':'Job10','hours':7,'pay':98}\n]))",
        expected: "609"
      },
      {
        id: 9,
        code: "jobs = [\n {'name':'Gia sư Toán','hours':10,'pay':250},\n {'name':'Gia sư Anh văn','hours':8,'pay':240},\n {'name':'Gia sư IELTS','hours':6,'pay':300},\n {'name':'Phục vụ quán cà phê','hours':18,'pay':270},\n {'name':'Pha chế','hours':14,'pay':252},\n {'name':'Thu ngân','hours':16,'pay':240},\n {'name':'Bán hàng siêu thị','hours':20,'pay':300},\n {'name':'Giao đồ ăn','hours':9,'pay':162},\n {'name':'Giao hàng nhanh','hours':11,'pay':187},\n {'name':'Nhập liệu','hours':25,'pay':300},\n {'name':'Viết content','hours':10,'pay':250},\n {'name':'Quản lý fanpage','hours':15,'pay':330},\n {'name':'Chăm sóc khách hàng','hours':18,'pay':342},\n {'name':'Thiết kế banner','hours':7,'pay':189},\n {'name':'Thiết kế logo','hours':8,'pay':320},\n {'name':'Chỉnh sửa video','hours':12,'pay':360},\n {'name':'SEO website','hours':20,'pay':500},\n {'name':'Lập trình web','hours':24,'pay':960},\n {'name':'Test phần mềm','hours':16,'pay':400},\n {'name':'Phân tích dữ liệu','hours':10,'pay':500}\n]\nprint(max_income(jobs))",
        expected: "1760"
      },
      {
        id: 10,
        code: "jobs = [\n {'name':'Gia sư Toán cấp 2','hours':8,'pay':240},\n {'name':'Gia sư Anh văn','hours':10,'pay':300},\n {'name':'Gia sư IELTS','hours':6,'pay':360},\n {'name':'Phục vụ quán cà phê','hours':18,'pay':270},\n {'name':'Pha chế','hours':14,'pay':280},\n {'name':'Thu ngân cửa hàng','hours':16,'pay':256},\n {'name':'Bán hàng siêu thị','hours':20,'pay':320},\n {'name':'Giao đồ ăn','hours':9,'pay':162},\n {'name':'Giao hàng nhanh','hours':11,'pay':187},\n {'name':'Nhập liệu văn phòng','hours':25,'pay':325},\n {'name':'Viết content fanpage','hours':10,'pay':250},\n {'name':'Quản lý fanpage','hours':15,'pay':330},\n {'name':'Chăm sóc khách hàng','hours':18,'pay':342},\n {'name':'Thiết kế banner','hours':7,'pay':210},\n {'name':'Thiết kế logo','hours':8,'pay':360},\n {'name':'Chỉnh sửa video','hours':12,'pay':420},\n {'name':'Quay video TikTok','hours':9,'pay':225},\n {'name':'SEO website','hours':20,'pay':500},\n {'name':'Lập trình website','hours':24,'pay':960},\n {'name':'Test phần mềm','hours':16,'pay':400},\n {'name':'Phân tích dữ liệu','hours':10,'pay':500},\n {'name':'Trực tổng đài','hours':18,'pay':306},\n {'name':'Bảo vệ ca đêm','hours':24,'pay':360},\n {'name':'Giữ xe','hours':20,'pay':260},\n {'name':'Rửa xe','hours':8,'pay':136},\n {'name':'Phát tờ rơi','hours':6,'pay':90},\n {'name':'Trông trẻ','hours':10,'pay':220},\n {'name':'Kho vận','hours':22,'pay':330},\n {'name':'Livestream bán hàng','hours':16,'pay':480},\n {'name':'Chạy quảng cáo Facebook','hours':12,'pay':480}\n]\nprint(max_income(jobs))",
        expected: "1820"
      },
    ]
  },
  {
    id: "exam2_22",
    category: "Mid-term practice",
    title: "Question 22",
    description: "<p>Bạn Nam có một danh sách các đồ vật, mỗi đồ vật có một giá trị (value) tương ứng.<br/>Danh sách này được lưu dưới dạng dictionary, với key là tên đồ vật (string), và value là giá trị (số nguyên). Các value là đôi một phân biệt.</p><p>Nam muốn mang theo chính xác 3 đồ vật sao cho tổng giá trị của 3 đồ vật này là lớn nhất. Viết hàm select_items(items) nhận vào một dictionary items và trả về một danh sách gồm đúng 3 tên đồ vật (key) có giá trị cao nhất, sắp xếp theo thứ tự giảm dần của value.</p>",
    initialCode: "def select_items(items):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(select_items({\"A\": 10, \"B\": 20, \"C\": 5, \"D\": 15}))",
        expected: "['B', 'D', 'A']"
      },
      {
        id: 2,
        code: "print(select_items({\"Pen\": 11, \"Book\": 25, \"Bag\": 40, \"Watch\": 30}))",
        expected: "['Bag', 'Watch', 'Book']"
      },
      {
        id: 3,
        code: "print(select_items({\"A\": 1, \"B\": 99, \"C\": 50, \"D\": 25, \"E\": 75}))",
        expected: "['B', 'E', 'C']"
      },
      {
        id: 4,
        code: "print(select_items({\"Laptop\": 500, \"Phone\": 320, \"Watch\": 150, \"Camera\": 420, \"Headphone\": 200, \"Tablet\": 350}))",
        expected: "['Laptop', 'Camera', 'Tablet']"
      },
      {
        id: 5,
        code: "print(select_items({\"A\": 3, \"B\": 8, \"C\": 1, \"D\": 6}))",
        expected: "['B', 'D', 'A']"
      },
      {
        id: 6,
        code: "print(select_items({\"Item1\": 55, \"Item2\": 10, \"Item3\": 75, \"Item4\": 60, \"Item5\": 30}))",
        expected: "['Item3', 'Item4', 'Item1']"
      },
      {
        id: 7,
        code: "print(select_items({\"X\": 100, \"Y\": 90, \"Z\": 80, \"T\": 70}))",
        expected: "['X', 'Y', 'Z']"
      },
      {
        id: 8,
        code: "print(select_items({\"Gold\": 1000, \"Silver\": 450, \"Bronze\": 300, \"Iron\": 700, \"Copper\": 650}))",
        expected: "['Gold', 'Iron', 'Copper']"
      },
    ]
  },
  {
    id: "exam2_23",
    category: "Mid-term practice",
    title: "Question 23",
    description: "<p>Hãy viết hàm count_distinct(a)</p><p>trong đó:</p><p>a là một danh sách (list) các số nguyên dương: a = [a₁, a₂, …, a_N].</p><p>để đếm số các giá trị đôi một phân biệt trong danh sách a.</p><p>Ví dụ:</p><p>count_distinct([1, 2, 2, 3, 1]) → 3</p><p>count_distinct([5, 5, 5]) → 1</p><p>count_distinct([1, 2, 3, 4]) → 4</p>",
    initialCode: "def count_distinct(a):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_distinct([1,2,2,3,1]))",
        expected: "3"
      },
      {
        id: 2,
        code: "print(count_distinct([5,5,5,5,5]))",
        expected: "1"
      },
      {
        id: 3,
        code: "print(count_distinct([1,2,3,4,5]))",
        expected: "5"
      },
      {
        id: 4,
        code: "print(count_distinct([100,1,100,2,100,3,100,4,100,5]))",
        expected: "6"
      },
      {
        id: 5,
        code: "print(count_distinct([1,1,2,3,3,4,4,4,5,6,6,7]))",
        expected: "7"
      },
      {
        id: 6,
        code: "print(count_distinct([1,2,3,4,5,6,7,8,9,10,\n                      1,2,3,4,5,6,7,8,9,10,\n                      11,12,13,14,15,16,17,18,19,20]))",
        expected: "20"
      },
      {
        id: 7,
        code: "print(count_distinct([42]))",
        expected: "1"
      },
      {
        id: 8,
        code: "print(count_distinct([3,3,3,2,2,1,1,4,4,5,5,6,6,6]))",
        expected: "6"
      },
      {
        id: 9,
        code: "print(count_distinct([5,7,5,7,5,7,5,7,5,7,\n                      1,2,3,4,5,6,7,8,9,10,\n                      10,9,8,7,6,5,4,3,2,1]))",
        expected: "10"
      },
      {
        id: 10,
        code: "print(count_distinct([1,1,1,2,2,3,4,4,4,4,5]))",
        expected: "5"
      },
      {
        id: 11,
        code: "print(count_distinct([7,7,7,7,7,7,7,7,7,7,\n                      8,8,8,8,8,8,8,8,8,8,\n                      9,9,9,9,9,9,9,9,9,9]))",
        expected: "3"
      },
      {
        id: 12,
        code: "print(count_distinct([4,1,3,4,2,1,6,9,9,8,7,2,4]))",
        expected: "8"
      },
      {
        id: 13,
        code: "print(count_distinct([5,12,7,12,3,5,9,9,8,2,\n                      11,13,14,15,16,17,18,19,20,21,\n                      22,23,24,25,26,27,28,29,30,31]))",
        expected: "27"
      },
      {
        id: 14,
        code: "print(count_distinct([1000,2000,3000,1000,5000,6000,7000,3000]))",
        expected: "6"
      },
    ]
  },
  {
    id: "exam2_24",
    category: "Mid-term practice",
    title: "Question 24",
    description: "<p>Hãy viết hàm list_distinct(a)</p><p>trong đó:</p><p>a là một danh sách (list) các số nguyên dương: a = [a₁, a₂, …, a_N].</p><p>để trả lại danh sách các giá trị đôi một phân biệt trong danh sách a theo thứ tự tăng dần.</p><p>Ví dụ:</p><p>list_distinct([1, 2, 2, 3, 1]) → [1, 2, 3]</p><p>list_distinct([5, 5, 5]) → [5]</p><p>list_distinct([1, 2, 3, 4]) → [1, 2, 3, 4]</p>",
    initialCode: "def list_distinct(a):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(list_distinct([1, 1, 1, 1]))",
        expected: "[1]"
      },
      {
        id: 2,
        code: "print(list_distinct([2, 1, 2, 1]))",
        expected: "[1, 2]"
      },
      {
        id: 3,
        code: "print(list_distinct([3, 2, 1]))",
        expected: "[1, 2, 3]"
      },
      {
        id: 4,
        code: "print(list_distinct([10, 9, 8, 9, 10]))",
        expected: "[8, 9, 10]"
      },
      {
        id: 5,
        code: "print(list_distinct([7, 3, 7, 3, 7, 3]))",
        expected: "[3, 7]"
      },
      {
        id: 6,
        code: "print(list_distinct([5] * 120))",
        expected: "[5]"
      },
      {
        id: 7,
        code: "print(list_distinct([100, 50, 100, 75]))",
        expected: "[50, 75, 100]"
      },
      {
        id: 8,
        code: "print(list_distinct([15, 14, 13, 14, 12]))",
        expected: "[12, 13, 14, 15]"
      },
      {
        id: 9,
        code: "print(list_distinct([5, 3, 8, 3, 5, 9]))",
        expected: "[3, 5, 8, 9]"
      },
    ]
  },
  {
    id: "exam2_25",
    category: "Mid-term practice",
    title: "Question 25",
    description: "<p>Trong hệ mã Vigenère, việc mã hóa sử dụng từ khóa key để dịch chuyển từng chữ cái trong bản rõ plaintext. Nếu key ngắn hơn plaintext, thì phải lặp lại tuần hoàn để đủ độ dài. Ví dụ: plaintext = HELLOWORLD, key = KEY → lặp thành KEYKEYKEYK.</p><p>Cách mã hóa từng chữ cái:</p><p>Chuyển mỗi chữ cái sang vị trí số trong bảng chữ cái: A = 0, B = 1, ..., Z = 25</p><p>Dùng công thức: Ci = (Pi + Ki) % 26</p><p>Pi: vị trí chữ cái của plaintext</p><p>Ki: vị trí chữ cái của key (đã lặp lại)</p><p>Ci: vị trí chữ cái kết quả (ciphertext)</p><p>Cuối cùng chuyển Ci thành chữ cái IN HOA</p><p>% là phép chia lấy dư, ví dụ: 7 % 3 = 1</p><p>Viết hàm: def vigenere_encrypt(plaintext, key):</p><p>Trong đó:</p><p>plaintext là chuỗi chữ cái, không chứa khoảng trắng, không phân biệt chữ hoa/thường</p><p>key là chuỗi chữ cái, không chứa khoảng trắng, không phân biệt chữ hoa/thường</p><p>Hàm trả về chuỗi ciphertext viết IN HOA</p><p>Ví dụ mã hóa cụ thể với plaintext = HELLO và key = KEY:</p><p>Lặp key: KEYKE</p><p>Đổi sang số:<br/>H = 7, E = 4, L = 11, L = 11, O = 14<br/>K = 10, E = 4, Y = 24, K = 10, E = 4</p><p>Áp dụng công thức Ci = (Pi + Ki) % 26:<br/>(7 + 10) % 26 = 17 → R<br/>(4 + 4) % 26 = 8 → I<br/>(11 + 24) % 26 = 9 → J<br/>(11 + 10) % 26 = 21 → V<br/>(14 + 4) % 26 = 18 → S</p><p>Kết quả cuối cùng: RIJVS.</p>",
    initialCode: "def vigenere_encrypt(plaintext, key):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(vigenere_encrypt(\"HELLO\", \"KEY\"))",
        expected: "RIJVS"
      },
      {
        id: 2,
        code: "print(vigenere_encrypt(\"ATTACKATDAWN\", \"LEMON\"))",
        expected: "LXFOPVEFRNHR"
      },
      {
        id: 3,
        code: "print(vigenere_encrypt(\"PROGRAMMING\", \"CODE\"))",
        expected: "RFRKTOPQKBJ"
      },
      {
        id: 4,
        code: "print(vigenere_encrypt(\"INFORMATION\", \"DATA\"))",
        expected: "LNYOUMTTLOG"
      },
      {
        id: 5,
        code: "print(vigenere_encrypt(\"COMPUTERSCIENCE\", \"PYTHON\"))",
        expected: "RMFWIGTPLJWRCAX"
      },
      {
        id: 6,
        code: "print(vigenere_encrypt(\"CRYPTOGRAPHY\", \"SECRET\"))",
        expected: "UVAGXHYVCGLR"
      },
      {
        id: 7,
        code: "print(vigenere_encrypt(\"KNOWLEDGE\", \"LEARN\"))",
        expected: "VRONYPHGV"
      },
      {
        id: 8,
        code: "print(vigenere_encrypt(\"STANISNOTWHATHESEEMS\", \"MYSTERY\"))",
        expected: "ERSGMJLAROAEKFQQWXQJ"
      },
      {
        id: 9,
        code: "print(vigenere_encrypt(\"TRUSTNOONE\", \"CIPHER\"))",
        expected: "VZJZXEQWCL"
      },
      {
        id: 10,
        code: "print(vigenere_encrypt(\"FIDDLEFORDHADITRIGHTALLALONG\", \"BILL\"))",
        expected: "GQOOMMQZSLSLEQECJOSEBTWLMWYR"
      },
    ]
  },
  {
    id: "exam2_26",
    category: "Mid-term practice",
    title: "Question 26",
    description: "<p>Ông An đi làm N ngày liên tiếp rồi nghỉ 1 ngày, sau đó lặp lại chu kỳ đó đều đặn.</p><p>Ông Bình đi làm M ngày liên tiếp rồi nghỉ 1 ngày, sau đó cũng lặp lại đều đặn.</p><p>Biết rằng cả hai đều bắt đầu đi làm từ ngày 01/01/2024, và lịch làm việc lặp lại đúng theo chu kỳ của mỗi người.</p><p>Hỏi: Trong khoảng từ ngày 01/01/2024 đến ngày A (tính cả ngày A), có bao nhiêu ngày mà cả ông An và ông Bình cùng đi làm?</p><p>Viết hàm:</p><p>def count_working_days(N, M, A):</p><p>Hàm trả về một số nguyên là số ngày cả hai người cùng đi làm trong khoảng từ ngày 01/01/2024 cho đến ngày A. Bạn được cung cấp mốc thời gian A dưới dạng đối tượng datetime.date của Python.</p>",
    initialCode: "def count_working_days(N, M, A):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_working_days(1, 1, date(2024, 1, 10)))",
        expected: "5"
      },
      {
        id: 2,
        code: "print(count_working_days(2, 2, date(2024, 1, 10)))",
        expected: "7"
      },
      {
        id: 3,
        code: "print(count_working_days(2, 3, date(2024, 1, 15)))",
        expected: "8"
      },
      {
        id: 4,
        code: "print(count_working_days(2, 3, date(2024, 1, 31)))",
        expected: "16"
      },
      {
        id: 5,
        code: "print(count_working_days(3, 5, date(2024, 2, 29)))",
        expected: "40"
      },
      {
        id: 6,
        code: "print(count_working_days(5, 5, date(2024, 12, 31)))",
        expected: "305"
      },
      {
        id: 7,
        code: "print(count_working_days(3, 4, date(3000, 1, 1)))",
        expected: "213887"
      },
      {
        id: 8,
        code: "print(count_working_days(48, 60, date(5000, 1, 1)))",
        expected: "1047325"
      },
      {
        id: 9,
        code: "print(count_working_days(10, 15, date(8000, 12, 31)))",
        expected: "1860559"
      },
      {
        id: 10,
        code: "print(count_working_days(17, 23, date(9999, 12, 31)))",
        expected: "2670409"
      },
    ]
  },
  {
    id: "exam2_27",
    category: "Mid-term practice",
    title: "Question 27",
    description: "<p>Trong hệ mã A1Z26, mỗi chữ cái tương ứng với một số: A = 1, B = 2, C = 3, ..., Z = 26. Việc mã hoá được thực hiện theo từng chữ cái của một từ, và các số được nối với nhau bằng dấu gạch ngang -.</p><p>Viết hàm: def encode_a1z26(word):</p><p>Trong đó:</p><p>word là một chuỗi ký tự (string), chỉ gồm 1 từ, không chứa khoảng trắng và không phân biệt chữ hoa hay chữ thường.</p><p>Hàm trả về một chuỗi là kết quả mã hoá từ word theo hệ A1Z26, với các số tương ứng của từng chữ cái được nối với nhau bằng dấu -.</p><p>Ví dụ: nếu word = \"HAPPY\" thì hàm phải trả về: 8-1-16-16-25.</p>",
    initialCode: "def encode_a1z26(word):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(encode_a1z26(\"HAPPY\"))",
        expected: "8-1-16-16-25"
      },
      {
        id: 2,
        code: "print(encode_a1z26(\"A\"))",
        expected: "1"
      },
      {
        id: 3,
        code: "print(encode_a1z26(\"Z\"))",
        expected: "26"
      },
      {
        id: 4,
        code: "print(encode_a1z26(\"HELLO\"))",
        expected: "8-5-12-12-15"
      },
      {
        id: 5,
        code: "print(encode_a1z26(\"ENCYCLOPEDIA\"))",
        expected: "5-14-3-25-3-12-15-16-5-4-9-1"
      },
      {
        id: 6,
        code: "print(encode_a1z26(\"MATHEMATICS\"))",
        expected: "13-1-20-8-5-13-1-20-9-3-19"
      },
      {
        id: 7,
        code: "print(encode_a1z26(\"INFORMATION\"))",
        expected: "9-14-6-15-18-13-1-20-9-15-14"
      },
      {
        id: 8,
        code: "print(encode_a1z26(\"PROGRAMMING\"))",
        expected: "16-18-15-7-18-1-13-13-9-14-7"
      },
      {
        id: 9,
        code: "print(encode_a1z26(\"TECHNOLOGICAL\"))",
        expected: "20-5-3-8-14-15-12-15-7-9-3-1-12"
      },
      {
        id: 10,
        code: "print(encode_a1z26(\"TECHNOLOGICAL\"))",
        expected: "20-5-3-8-14-15-12-15-7-9-3-1-12"
      },
    ]
  },
  {
    id: "exam2_28",
    category: "Mid-term practice",
    title: "Question 28",
    description: "<p>Xét các đồ thị có hướng được biểu diễn bằng một dictionary Python, trong đó:</p><p>Mỗi key là một đỉnh (vertex).</p><p>Giá trị tương ứng là một dictionary chứa các đỉnh kề và trọng số của cạnh nối đến những đỉnh đó</p><p>Hãy viết hàm find_adjacency_list(graph).</p><p>Trong đó:</p><p>graph là một dictionary mô tả đồ thị như ở trên.</p><p>Hàm phải trả về adjacency list, tức là một dictionary mới ánh xạ mỗi đỉnh sang danh sách các đỉnh kề với nó (không xét trọng số).</p><p>Ví dụ, xét đồ thị được biểu diễn bằng dictionary graph = {'A': {'B': 5, 'C': 10}, 'B': {'C': 3, 'D': 8}, 'C': {'D': 2}, 'D': {}}</p><p>thì hàm phải trả về:</p><p>{'A': ['B', 'C'], 'B': ['C', 'D'], 'C': ['D'], 'D': []}</p>",
    initialCode: "def find_adjacency_list(graph):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(find_adjacency_list({'A': {'B': 5, 'C': 10}, 'B': {'C': 3}, 'C': {}}))",
        expected: "{'A': ['B', 'C'], 'B': ['C'], 'C': []}"
      },
      {
        id: 2,
        code: "print(find_adjacency_list({'A': {}}))",
        expected: "{'A': []}"
      },
      {
        id: 3,
        code: "print(find_adjacency_list({'A': {'B': 1}, 'B': {}}))",
        expected: "{'A': ['B'], 'B': []}"
      },
      {
        id: 4,
        code: "print(find_adjacency_list({'A': {'B': 2}, 'B': {'A': 4}}))",
        expected: "{'A': ['B'], 'B': ['A']}"
      },
      {
        id: 5,
        code: "print(find_adjacency_list({'A': {'B': 1}, 'B': {'C': 1}, 'C': {}}))",
        expected: "{'A': ['B'], 'B': ['C'], 'C': []}"
      },
      {
        id: 6,
        code: "print(find_adjacency_list({'A': {'C': 1}, 'B': {'C': 2}, 'C': {}}))",
        expected: "{'A': ['C'], 'B': ['C'], 'C': []}"
      },
      {
        id: 7,
        code: "print(find_adjacency_list({'A': {'B': 1, 'C': 1}, 'B': {}, 'C': {}}))",
        expected: "{'A': ['B', 'C'], 'B': [], 'C': []}"
      },
      {
        id: 8,
        code: "print(find_adjacency_list({'A': {'B': 1, 'D': 5}, 'B': {'C': 2}, 'C': {'D': 3}, 'D': {'E': 1}, 'E': {}}))",
        expected: "{'A': ['B', 'D'], 'B': ['C'], 'C': ['D'], 'D': ['E'], 'E': []}"
      },
      {
        id: 9,
        code: "print(find_adjacency_list({}))",
        expected: "{}"
      },
    ]
  },
  {
    id: "exam2_29",
    category: "Mid-term practice",
    title: "Question 29",
    description: "<p>Trong hệ mã Atbash, mỗi chữ cái được mã hóa bằng cách ánh xạ với chữ cái đối xứng trong bảng chữ cái tiếng Anh:</p><p>A ↔ Z, B ↔ Y, C ↔ X, ..., M ↔ N</p><p>Do đó, mã Atbash là loại mã đối xứng, nghĩa là quá trình mã hóa và giải mã đều dùng chung một quy tắc chuyển đổi.</p><p>Viết hàm: def atbash_decode(code):</p><p>Trong đó:</p><p>code là một chuỗi ký tự (string), chỉ gồm các chữ cái A–Z hoặc a–z, không có khoảng trắng hay ký tự đặc biệt.</p><p>Không phân biệt chữ hoa hay chữ thường.</p><p>Kết quả trả về là chuỗi chữ cái in hoa, là bản giải mã (decode) Atbash của chuỗi code.</p><p>Ví dụ: nếu code = \"SVOOL\" thì hàm phải trả về: HELLO.</p>",
    initialCode: "def atbash_decode(code):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(atbash_decode(\"SVOOL\"))",
        expected: "HELLO"
      },
      {
        id: 2,
        code: "print(atbash_decode(\"VMXBXOLKVWRZ\"))",
        expected: "ENCYCLOPEDIA"
      },
      {
        id: 3,
        code: "print(atbash_decode(\"NZGSVNZGRXH\"))",
        expected: "MATHEMATICS"
      },
      {
        id: 4,
        code: "print(atbash_decode(\"RMULINZGRLM\"))",
        expected: "INFORMATION"
      },
      {
        id: 5,
        code: "print(atbash_decode(\"RMEVIHV\"))",
        expected: "INVERSE"
      },
      {
        id: 6,
        code: "print(atbash_decode(\"XLNNFMRXZGRLM\"))",
        expected: "COMMUNICATION"
      },
      {
        id: 7,
        code: "print(atbash_decode(\"KILTIZNNRMT\"))",
        expected: "PROGRAMMING"
      },
      {
        id: 8,
        code: "print(atbash_decode(\"VKOFIRYFHGIVNYOVB\"))",
        expected: "EPLURIBUSTREMBLEY"
      },
      {
        id: 9,
        code: "print(atbash_decode(\"HLIIBWRKKVIYFGBLFIDVMWBRHRMZMLGSVIXZHGOV\"))",
        expected: "SORRYDIPPERBUTYOURWENDYISINANOTHERCASTLE"
      },
      {
        id: 10,
        code: "print(atbash_decode(\"GSVRMERHRYOVDRAZIWRHDZGXSRMT\"))",
        expected: "THEINVISIBLEWIZARDISWATCHING"
      },
    ]
  },
  {
    id: "exam2_30",
    category: "Mid-term practice",
    title: "Question 30",
    description: "<p>Trong hệ mã Atbash, mỗi chữ cái trong bảng chữ cái tiếng Anh được mã hóa bằng cách ánh xạ với chữ cái đối xứng trong bảng chữ cái. Quy tắc như sau:</p><p>A ↔ Z, B ↔ Y, C ↔ X, ..., M ↔ N</p><p>Nói cách khác, chữ cái thứ 1 đổi thành chữ thứ 26, chữ thứ 2 đổi thành chữ thứ 25, ..., chữ thứ 26 đổi thành chữ thứ 1.</p><p>Viết hàm: def atbash_cipher(word):</p><p>Trong đó:</p><p>word là một chuỗi ký tự (string), chỉ gồm các chữ cái tiếng Anh (A–Z hoặc a–z), không chứa khoảng trắng hoặc ký tự đặc biệt.</p><p>Không phân biệt chữ hoa hay chữ thường, và kết quả trả về là chữ in hoa.</p><p>Hàm trả về một chuỗi là kết quả mã hóa Atbash của từ word.</p><p>Ví dụ: nếu word = \"HELLO\" thì hàm phải trả về: SVOOL.</p>",
    initialCode: "def atbash_cipher(word):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(atbash_cipher(\"ENCYCLOPEDIA\"))",
        expected: "VMXBXOLKVWRZ"
      },
      {
        id: 2,
        code: "print(atbash_cipher(\"MATHEMATICS\"))",
        expected: "NZGSVNZGRXH"
      },
      {
        id: 3,
        code: "print(atbash_cipher(\"INFORMATION\"))",
        expected: "RMULINZGRLM"
      },
      {
        id: 4,
        code: "print(atbash_cipher(\"COMMUNICATION\"))",
        expected: "XLNNFMRXZGRLM"
      },
      {
        id: 5,
        code: "print(atbash_cipher(\"PROGRAMMING\"))",
        expected: "KILTIZNNRMT"
      },
      {
        id: 6,
        code: "print(atbash_cipher(\"TECHNOLOGICAL\"))",
        expected: "GVXSMLOLTRXZO"
      },
      {
        id: 7,
        code: "print(atbash_cipher(\"DEMONSTRATION\"))",
        expected: "WVNLMHGIZGRLM"
      },
      {
        id: 8,
        code: "print(atbash_cipher(\"BROUGHTTOYOUBYHOMEWORKTHECANDY\"))",
        expected: "YILFTSGGLBLFYBSLNVDLIPGSVXZMWB"
      },
      {
        id: 9,
        code: "print(atbash_cipher(\"TRUSTNOONE\"))",
        expected: "GIFHGMLLMV"
      },
      {
        id: 10,
        code: "print(atbash_cipher(\"BILLCIPHER\"))",
        expected: "YROOXRKSVI"
      },
    ]
  },
  {
    id: "exam2_31",
    category: "Mid-term practice",
    title: "Question 31",
    description: "<p>Hãy viết hàm compute_area(s, x).</p><p>Trong đó:</p><p>s là một ký tự (string), dùng để xác định loại phép tính:</p><p>Nếu s = 'p' → tính chu vi hình tròn</p><p>Nếu s = 'a' → tính diện tích hình tròn</p><p>Nếu s có giá trị khác → in ra \"Invalid\"</p><p>x là bán kính của hình tròn (số thực hoặc số nguyên dương).</p><p>Trong bài này, ta lấy π = 3.14.</p><p>Yêu cầu<br/>Nếu s = 'p' hoặc s = 'a':</p><p>Hàm trả về giá trị chu vi hoặc diện tích tương ứng</p><p>Giá trị trả về là số thực, đã được làm tròn đến 2 chữ số thập phân</p><p>Nếu s không hợp lệ:</p><p>Hàm trả về chuỗi \"Invalid\"</p>",
    initialCode: "def compute_area(s, x):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(compute_area('p', 2))",
        expected: "12.56"
      },
      {
        id: 2,
        code: "print(compute_area('p', 3))",
        expected: "18.84"
      },
      {
        id: 3,
        code: "print(compute_area('p', 1.55))",
        expected: "9.73"
      },
      {
        id: 4,
        code: "print(compute_area('p', 1.3333))",
        expected: "8.37"
      },
      {
        id: 5,
        code: "print(compute_area('a', 1.5678))",
        expected: "7.72"
      },
      {
        id: 6,
        code: "print(compute_area('a', 10.75))",
        expected: "362.87"
      },
      {
        id: 7,
        code: "print(compute_area('p', 2.5555))",
        expected: "16.05"
      },
      {
        id: 8,
        code: "print(compute_area('x', 4.1234))",
        expected: "Invalid"
      },
      {
        id: 9,
        code: "print(compute_area('a', 1.414213))",
        expected: "6.28"
      },
      {
        id: 10,
        code: "print(compute_area('p', 0.795))",
        expected: "4.99"
      },
    ]
  },
  {
    id: "exam2_32",
    category: "Mid-term practice",
    title: "Question 32",
    description: "<p>Danh sách nhà trọ được biểu diễn dưới dạng một list các dictionary, mỗi phần tử có cấu trúc:</p><p>{'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.5}</p><p>Trong đó:</p><p>name: tên nhà trọ (string)</p><p>price: giá thuê (số thực, đơn vị triệu/tháng)</p><p>distance: khoảng cách đến trường (km)</p><p>rating: điểm đánh giá (từ 0 đến 5)</p><p>Để đánh giá tổng thể mức độ “đáng ở” của mỗi nhà trọ, ta định nghĩa value score theo công thức:</p><p>score = rating / price − distance * 0.1</p><p>Hãy viết hàm top_value_hostels(hostels).</p><p>Trong đó:</p><p>hostels là danh sách các nhà trọ như mô tả ở trên.</p><p>Hàm cần thực hiện:</p><p>Tính value score cho từng nhà trọ theo công thức đã cho</p><p>Sắp xếp các nhà trọ theo score giảm dần</p><p>Trả về 03 nhà trọ có score cao nhất</p><p>Giá trị trả về <br/>Hàm trả về một list gồm đúng 03 phần tử</p><p>Mỗi phần tử là một dictionary đại diện cho nhà trọ, có cấu trúc giống hệt các phần tử trong danh sách ban đầu</p><p>Giả sử danh sách đầu vào luôn có ít nhất 03 nhà trọ.</p><p>For example:</p><p>Test\tResult<br/>print(top_value_hostels([<br/> {'name':'A','price':1.5,'distance':2.0,'rating':4.5},<br/> {'name':'B','price':1.8,'distance':1.5,'rating':4.2},<br/> {'name':'C','price':1.2,'distance':2.5,'rating':4.0},<br/> {'name':'D','price':2.0,'distance':1.0,'rating':4.8},<br/> {'name':'E','price':1.6,'distance':2.2,'rating':4.1},<br/> {'name':'F','price':2.2,'distance':0.8,'rating':4.6},<br/> {'name':'G','price':1.9,'distance':1.9,'rating':4.3},<br/> {'name':'H','price':1.4,'distance':2.8,'rating':3.9},<br/> {'name':'I','price':2.5,'distance':0.5,'rating':4.7},<br/> {'name':'J','price':1.7,'distance':1.7,'rating':4.0}<br/>]))<br/>[{'name': 'C', 'price': 1.2, 'distance': 2.5, 'rating': 4.0}, {'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.5}, {'name': 'H', 'price': 1.4, 'distance': 2.8, 'rating': 3.9}]</p>",
    initialCode: "def top_value_hostels(hostels):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(top_value_hostels([\n {'name':'A','price':1.5,'distance':2.0,'rating':4.5},\n {'name':'B','price':1.8,'distance':1.5,'rating':4.2},\n {'name':'C','price':1.2,'distance':2.5,'rating':4.0},\n {'name':'D','price':2.0,'distance':1.0,'rating':4.8},\n {'name':'E','price':1.6,'distance':2.2,'rating':4.1},\n {'name':'F','price':2.2,'distance':0.8,'rating':4.6},\n {'name':'G','price':1.9,'distance':1.9,'rating':4.3},\n {'name':'H','price':1.4,'distance':2.8,'rating':3.9},\n {'name':'I','price':2.5,'distance':0.5,'rating':4.7},\n {'name':'J','price':1.7,'distance':1.7,'rating':4.0}\n]))",
        expected: "[{'name': 'C', 'price': 1.2, 'distance': 2.5, 'rating': 4.0}, {'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.5}, {'name': 'H', 'price': 1.4, 'distance': 2.8, 'rating': 3.9}]"
      },
      {
        id: 2,
        code: "print(top_value_hostels([\n {'name':'A','price':1.0,'distance':3.0,'rating':3.8},\n {'name':'B','price':1.1,'distance':2.5,'rating':4.0},\n {'name':'C','price':1.2,'distance':2.0,'rating':4.2},\n {'name':'D','price':1.3,'distance':1.8,'rating':4.1},\n {'name':'E','price':1.4,'distance':1.5,'rating':4.3},\n {'name':'F','price':1.5,'distance':1.2,'rating':4.5},\n {'name':'G','price':1.6,'distance':1.0,'rating':4.4},\n {'name':'H','price':1.7,'distance':0.8,'rating':4.6},\n {'name':'I','price':1.8,'distance':0.6,'rating':4.7},\n {'name':'J','price':1.9,'distance':0.5,'rating':4.8}\n]))",
        expected: "[{'name': 'A', 'price': 1.0, 'distance': 3.0, 'rating': 3.8}, {'name': 'B', 'price': 1.1, 'distance': 2.5, 'rating': 4.0}, {'name': 'C', 'price': 1.2, 'distance': 2.0, 'rating': 4.2}]"
      },
      {
        id: 3,
        code: "print(top_value_hostels([\n {'name':'A','price':1.5,'distance':4.0,'rating':4.8},\n {'name':'B','price':1.6,'distance':3.5,'rating':4.7},\n {'name':'C','price':1.7,'distance':3.0,'rating':4.6},\n {'name':'D','price':1.8,'distance':2.5,'rating':4.5},\n {'name':'E','price':1.9,'distance':2.0,'rating':4.4},\n {'name':'F','price':2.0,'distance':1.5,'rating':4.3},\n {'name':'G','price':2.1,'distance':1.0,'rating':4.2},\n {'name':'H','price':2.2,'distance':0.8,'rating':4.1},\n {'name':'I','price':2.3,'distance':0.6,'rating':4.0},\n {'name':'J','price':2.4,'distance':0.5,'rating':3.9}\n]))",
        expected: "[{'name': 'A', 'price': 1.5, 'distance': 4.0, 'rating': 4.8}, {'name': 'B', 'price': 1.6, 'distance': 3.5, 'rating': 4.7}, {'name': 'C', 'price': 1.7, 'distance': 3.0, 'rating': 4.6}]"
      },
      {
        id: 4,
        code: "print(top_value_hostels([\n {'name':'A','price':1.5,'distance':2.0,'rating':4.0},\n {'name':'B','price':1.6,'distance':1.9,'rating':4.1},\n {'name':'C','price':1.7,'distance':1.8,'rating':4.2},\n {'name':'D','price':1.8,'distance':1.7,'rating':4.3},\n {'name':'E','price':1.9,'distance':1.6,'rating':4.4},\n {'name':'F','price':2.0,'distance':1.5,'rating':4.5},\n {'name':'G','price':2.1,'distance':1.4,'rating':4.6},\n {'name':'H','price':2.2,'distance':1.3,'rating':4.7},\n {'name':'I','price':2.3,'distance':1.2,'rating':4.8},\n {'name':'J','price':2.4,'distance':1.1,'rating':4.9}\n]))",
        expected: "[{'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.0}, {'name': 'B', 'price': 1.6, 'distance': 1.9, 'rating': 4.1}, {'name': 'C', 'price': 1.7, 'distance': 1.8, 'rating': 4.2}]"
      },
      {
        id: 5,
        code: "print(top_value_hostels([\n {'name':'H1','price':1.2,'distance':2.5,'rating':4.0},\n {'name':'H2','price':1.3,'distance':2.4,'rating':4.1},\n {'name':'H3','price':1.4,'distance':2.3,'rating':4.2},\n {'name':'H4','price':1.5,'distance':2.2,'rating':4.3},\n {'name':'H5','price':1.6,'distance':2.1,'rating':4.4},\n {'name':'H6','price':1.7,'distance':2.0,'rating':4.5},\n {'name':'H7','price':1.8,'distance':1.9,'rating':4.6},\n {'name':'H8','price':1.9,'distance':1.8,'rating':4.7},\n {'name':'H9','price':2.0,'distance':1.7,'rating':4.8},\n {'name':'H10','price':2.1,'distance':1.6,'rating':4.9},\n {'name':'H11','price':2.2,'distance':1.5,'rating':4.8},\n {'name':'H12','price':2.3,'distance':1.4,'rating':4.7},\n {'name':'H13','price':2.4,'distance':1.3,'rating':4.6},\n {'name':'H14','price':2.5,'distance':1.2,'rating':4.5},\n {'name':'H15','price':2.6,'distance':1.1,'rating':4.4},\n {'name':'H16','price':2.7,'distance':1.0,'rating':4.3},\n {'name':'H17','price':2.8,'distance':0.9,'rating':4.2},\n {'name':'H18','price':2.9,'distance':0.8,'rating':4.1},\n {'name':'H19','price':3.0,'distance':0.7,'rating':4.0},\n {'name':'H20','price':3.1,'distance':0.6,'rating':3.9}\n]))",
        expected: "[{'name': 'H1', 'price': 1.2, 'distance': 2.5, 'rating': 4.0}, {'name': 'H2', 'price': 1.3, 'distance': 2.4, 'rating': 4.1}, {'name': 'H3', 'price': 1.4, 'distance': 2.3, 'rating': 4.2}]"
      },
      {
        id: 6,
        code: "print(top_value_hostels([\n {'name':f'R{i}','price':1.0+0.1*i,'distance':3.0-0.05*i,'rating':4.0+0.02*i}\n for i in range(1,26)\n]))",
        expected: "[{'name': 'R1', 'price': 1.1, 'distance': 2.95, 'rating': 4.02}, {'name': 'R2', 'price': 1.2, 'distance': 2.9, 'rating': 4.04}, {'name': 'R3', 'price': 1.3, 'distance': 2.85, 'rating': 4.06}]"
      },
      {
        id: 7,
        code: "print(top_value_hostels([\n {'name':'H1','price':1.7,'distance':2.3,'rating':4.1},\n {'name':'H2','price':2.4,'distance':0.9,'rating':4.7},\n {'name':'H3','price':1.1,'distance':3.2,'rating':3.8},\n {'name':'H4','price':1.9,'distance':1.4,'rating':4.5},\n {'name':'H5','price':2.8,'distance':0.6,'rating':4.9},\n {'name':'H6','price':1.3,'distance':2.9,'rating':4.0},\n {'name':'H7','price':2.1,'distance':1.8,'rating':4.3},\n {'name':'H8','price':1.6,'distance':2.1,'rating':4.2},\n {'name':'H9','price':2.6,'distance':0.8,'rating':4.6},\n {'name':'H10','price':1.4,'distance':2.6,'rating':4.1},\n {'name':'H11','price':2.0,'distance':1.1,'rating':4.4},\n {'name':'H12','price':1.8,'distance':1.9,'rating':4.3},\n {'name':'H13','price':2.3,'distance':0.7,'rating':4.8},\n {'name':'H14','price':1.5,'distance':2.4,'rating':4.0},\n {'name':'H15','price':2.7,'distance':0.5,'rating':4.9},\n {'name':'H16','price':1.2,'distance':3.0,'rating':3.9},\n {'name':'H17','price':2.2,'distance':1.3,'rating':4.5},\n {'name':'H18','price':1.9,'distance':1.6,'rating':4.2},\n {'name':'H19','price':2.5,'distance':0.9,'rating':4.6},\n {'name':'H20','price':1.4,'distance':2.8,'rating':4.0}\n]))",
        expected: "[{'name': 'H3', 'price': 1.1, 'distance': 3.2, 'rating': 3.8}, {'name': 'H16', 'price': 1.2, 'distance': 3.0, 'rating': 3.9}, {'name': 'H6', 'price': 1.3, 'distance': 2.9, 'rating': 4.0}]"
      },
      {
        id: 8,
        code: "print(top_value_hostels([\n {'name':'A1','price':0.9,'distance':4.5,'rating':4.8},\n {'name':'A2','price':3.0,'distance':0.4,'rating':5.0},\n {'name':'A3','price':1.8,'distance':2.2,'rating':4.3},\n {'name':'A4','price':2.6,'distance':0.6,'rating':4.7},\n {'name':'A5','price':1.2,'distance':3.1,'rating':3.9},\n {'name':'A6','price':2.1,'distance':1.5,'rating':4.4},\n {'name':'A7','price':1.7,'distance':2.7,'rating':4.0},\n {'name':'A8','price':2.9,'distance':0.5,'rating':4.8},\n {'name':'A9','price':1.4,'distance':2.9,'rating':4.1},\n {'name':'A10','price':2.4,'distance':1.1,'rating':4.6},\n {'name':'A11','price':1.6,'distance':2.0,'rating':4.2},\n {'name':'A12','price':2.2,'distance':1.8,'rating':4.3},\n {'name':'A13','price':1.3,'distance':3.3,'rating':3.8},\n {'name':'A14','price':2.7,'distance':0.7,'rating':4.9},\n {'name':'A15','price':1.9,'distance':1.6,'rating':4.2},\n {'name':'A16','price':2.5,'distance':0.9,'rating':4.7},\n {'name':'A17','price':1.1,'distance':3.5,'rating':3.7},\n {'name':'A18','price':2.0,'distance':1.4,'rating':4.4},\n {'name':'A19','price':1.5,'distance':2.4,'rating':4.1},\n {'name':'A20','price':2.8,'distance':0.6,'rating':4.8},\n {'name':'A21','price':1.8,'distance':2.1,'rating':4.3},\n {'name':'A22','price':2.3,'distance':1.2,'rating':4.5}\n]))",
        expected: "[{'name': 'A1', 'price': 0.9, 'distance': 4.5, 'rating': 4.8}, {'name': 'A17', 'price': 1.1, 'distance': 3.5, 'rating': 3.7}, {'name': 'A5', 'price': 1.2, 'distance': 3.1, 'rating': 3.9}]"
      },
      {
        id: 9,
        code: "print(top_value_hostels([\n {'name':'R1','price':2.1,'distance':1.9,'rating':4.3},\n {'name':'R2','price':1.3,'distance':3.2,'rating':3.9},\n {'name':'R3','price':2.7,'distance':0.7,'rating':4.8},\n {'name':'R4','price':1.8,'distance':2.4,'rating':4.1},\n {'name':'R5','price':2.4,'distance':1.2,'rating':4.6},\n {'name':'R6','price':1.1,'distance':3.4,'rating':3.8},\n {'name':'R7','price':2.9,'distance':0.5,'rating':4.9},\n {'name':'R8','price':1.5,'distance':2.7,'rating':4.0},\n {'name':'R9','price':2.0,'distance':1.6,'rating':4.4},\n {'name':'R10','price':1.7,'distance':2.2,'rating':4.2},\n {'name':'R11','price':2.6,'distance':0.8,'rating':4.7},\n {'name':'R12','price':1.4,'distance':2.9,'rating':4.0},\n {'name':'R13','price':2.3,'distance':1.1,'rating':4.5},\n {'name':'R14','price':1.9,'distance':1.8,'rating':4.3},\n {'name':'R15','price':2.8,'distance':0.6,'rating':4.9},\n {'name':'R16','price':1.2,'distance':3.0,'rating':3.9},\n {'name':'R17','price':2.5,'distance':0.9,'rating':4.6},\n {'name':'R18','price':1.6,'distance':2.5,'rating':4.1},\n {'name':'R19','price':2.2,'distance':1.3,'rating':4.4},\n {'name':'R20','price':1.8,'distance':2.0,'rating':4.2}\n]))",
        expected: "[{'name': 'R6', 'price': 1.1, 'distance': 3.4, 'rating': 3.8}, {'name': 'R16', 'price': 1.2, 'distance': 3.0, 'rating': 3.9}, {'name': 'R2', 'price': 1.3, 'distance': 3.2, 'rating': 3.9}]"
      },
      {
        id: 10,
        code: "print(top_value_hostels([\n {'name':f'X{i}','price':round(0.9+0.17*(i%7),2),'distance':round(0.5+0.23*(i%9),2),'rating':round(3.8+0.19*(i%6),2)}\n for i in range(1,31)\n]))",
        expected: "[{'name': 'X28', 'price': 0.9, 'distance': 0.73, 'rating': 4.56}, {'name': 'X21', 'price': 0.9, 'distance': 1.19, 'rating': 4.37}, {'name': 'X14', 'price': 0.9, 'distance': 1.65, 'rating': 4.18}]"
      },
    ]
  },
  {
    id: "exam2_33",
    category: "Mid-term practice",
    title: "Question 33",
    description: "<p>Danh sách sinh viên được biểu diễn dưới dạng một list các dictionary, mỗi phần tử có cấu trúc:</p><p>{'name': 'Minh', 'height': 168}</p><p>Trong đó:</p><p>name: tên sinh viên (string)</p><p>height: chiều cao của sinh viên (số nguyên, đơn vị cm)</p><p>Yêu cầu<br/>Hãy viết hàm sort_students_by_height(students) để:</p><p>Sắp xếp danh sách sinh viên theo height tăng dần</p><p>Giá trị trả về<br/>Hàm trả về danh sách sinh viên đã được sắp xếp</p><p>Mỗi phần tử trong danh sách kết quả là một dictionary có cấu trúc giống hệt phần tử ban đầu</p><p>Ví dụ<br/>Input:<br/>students = [{'name': 'Minh', 'height': 168}, {'name': 'Huy', 'height': 175}, {'name': 'Lan', 'height': 160}]</p><p>Output:<br/>[{'name': 'Lan', 'height': 160}, {'name': 'Minh', 'height': 168}, {'name': 'Huy', 'height': 175}]</p>",
    initialCode: "def sort_students_by_height(students):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(sort_students_by_height([\n {'name':'Minh','height':168},\n {'name':'Huy','height':175},\n {'name':'Lan','height':160}\n]))",
        expected: "[{'name': 'Lan', 'height': 160}, {'name': 'Minh', 'height': 168}, {'name': 'Huy', 'height': 175}]"
      },
      {
        id: 2,
        code: "print(sort_students_by_height([\n {'name':'An','height':155},\n {'name':'Binh','height':160},\n {'name':'Chi','height':165},\n {'name':'Dung','height':170}\n]))",
        expected: "[{'name': 'An', 'height': 155}, {'name': 'Binh', 'height': 160}, {'name': 'Chi', 'height': 165}, {'name': 'Dung', 'height': 170}]"
      },
      {
        id: 3,
        code: "print(sort_students_by_height([\n {'name':'Nam','height':170},\n {'name':'Long','height':165},\n {'name':'Tuan','height':170},\n {'name':'Phong','height':160}\n]))",
        expected: "[{'name': 'Phong', 'height': 160}, {'name': 'Long', 'height': 165}, {'name': 'Nam', 'height': 170}, {'name': 'Tuan', 'height': 170}]"
      },
      {
        id: 4,
        code: "print(sort_students_by_height([\n {'name':'Mai','height':158},\n {'name':'Hoa','height':162},\n {'name':'Nga','height':155},\n {'name':'Lien','height':160},\n {'name':'Yen','height':165},\n {'name':'Trang','height':168}\n]))",
        expected: "[{'name': 'Nga', 'height': 155}, {'name': 'Mai', 'height': 158}, {'name': 'Lien', 'height': 160}, {'name': 'Hoa', 'height': 162}, {'name': 'Yen', 'height': 165}, {'name': 'Trang', 'height': 168}]"
      },
      {
        id: 5,
        code: "print(sort_students_by_height([\n {'name':'Minh','height':168},\n {'name':'Huy','height':175},\n {'name':'Lan','height':160},\n {'name':'An','height':155},\n {'name':'Binh','height':172},\n {'name':'Chi','height':162},\n {'name':'Dung','height':170},\n {'name':'Giang','height':158},\n {'name':'Khanh','height':180},\n {'name':'Phong','height':165}\n]))",
        expected: "[{'name': 'An', 'height': 155}, {'name': 'Giang', 'height': 158}, {'name': 'Lan', 'height': 160}, {'name': 'Chi', 'height': 162}, {'name': 'Phong', 'height': 165}, {'name': 'Minh', 'height': 168}, {'name': 'Dung', 'height': 170}, {'name': 'Binh', 'height': 172}, {'name': 'Huy', 'height': 175}, {'name': 'Khanh', 'height': 180}]"
      },
      {
        id: 6,
        code: "print(sort_students_by_height([\n {'name':'Anh','height':164},\n {'name':'Bao','height':170},\n {'name':'Cuong','height':176},\n {'name':'Dao','height':158},\n {'name':'Em','height':162},\n {'name':'Phuc','height':168},\n {'name':'Giang','height':160},\n {'name':'Hien','height':155},\n {'name':'Khoa','height':180},\n {'name':'Lam','height':172},\n {'name':'Mai','height':165},\n {'name':'Nam','height':169},\n {'name':'Oanh','height':157},\n {'name':'Quang','height':174},\n {'name':'Son','height':178}\n]))",
        expected: "[{'name': 'Hien', 'height': 155}, {'name': 'Oanh', 'height': 157}, {'name': 'Dao', 'height': 158}, {'name': 'Giang', 'height': 160}, {'name': 'Em', 'height': 162}, {'name': 'Anh', 'height': 164}, {'name': 'Mai', 'height': 165}, {'name': 'Phuc', 'height': 168}, {'name': 'Nam', 'height': 169}, {'name': 'Bao', 'height': 170}, {'name': 'Lam', 'height': 172}, {'name': 'Quang', 'height': 174}, {'name': 'Cuong', 'height': 176}, {'name': 'Son', 'height': 178}, {'name': 'Khoa', 'height': 180}]"
      },
      {
        id: 7,
        code: "print(sort_students_by_height([\n {'name':'An','height':156},\n {'name':'Binh','height':170},\n {'name':'Chi','height':162},\n {'name':'Dung','height':168},\n {'name':'Em','height':160},\n {'name':'Phuong','height':175},\n {'name':'Giang','height':158},\n {'name':'Hanh','height':165},\n {'name':'Khanh','height':180},\n {'name':'Lam','height':172},\n {'name':'Mai','height':159},\n {'name':'Nam','height':167},\n {'name':'Oanh','height':155},\n {'name':'Phong','height':174},\n {'name':'Quynh','height':163},\n {'name':'Son','height':178},\n {'name':'Trang','height':161},\n {'name':'Tuan','height':169},\n {'name':'Vinh','height':176},\n {'name':'Yen','height':157}\n]))",
        expected: "[{'name': 'Oanh', 'height': 155}, {'name': 'An', 'height': 156}, {'name': 'Yen', 'height': 157}, {'name': 'Giang', 'height': 158}, {'name': 'Mai', 'height': 159}, {'name': 'Em', 'height': 160}, {'name': 'Trang', 'height': 161}, {'name': 'Chi', 'height': 162}, {'name': 'Quynh', 'height': 163}, {'name': 'Hanh', 'height': 165}, {'name': 'Nam', 'height': 167}, {'name': 'Dung', 'height': 168}, {'name': 'Tuan', 'height': 169}, {'name': 'Binh', 'height': 170}, {'name': 'Lam', 'height': 172}, {'name': 'Phong', 'height': 174}, {'name': 'Phuong', 'height': 175}, {'name': 'Vinh', 'height': 176}, {'name': 'Son', 'height': 178}, {'name': 'Khanh', 'height': 180}]"
      },
      {
        id: 8,
        code: "print(sort_students_by_height([\n {'name':'An','height':156},\n {'name':'Binh','height':170},\n {'name':'Chi','height':162},\n {'name':'Dung','height':168},\n {'name':'Em','height':160},\n {'name':'Phuc','height':175},\n {'name':'Giang','height':158},\n {'name':'Hanh','height':165},\n {'name':'Khanh','height':180},\n {'name':'Lam','height':172},\n {'name':'Mai','height':159},\n {'name':'Nam','height':167},\n {'name':'Oanh','height':155},\n {'name':'Phong','height':174},\n {'name':'Quynh','height':163},\n {'name':'Son','height':178},\n {'name':'Trang','height':161},\n {'name':'Tuan','height':169},\n {'name':'Vinh','height':176},\n {'name':'Yen','height':157},\n {'name':'Anh','height':164},\n {'name':'Bao','height':171},\n {'name':'Cuong','height':177},\n {'name':'Dao','height':158},\n {'name':'Ha','height':162},\n {'name':'Hung','height':173},\n {'name':'Khoa','height':181},\n {'name':'Linh','height':166},\n {'name':'My','height':160},\n {'name':'Ngoc','height':168},\n {'name':'Phuong','height':174},\n {'name':'Quang','height':179},\n {'name':'Thanh','height':172},\n {'name':'Thao','height':159},\n {'name':'Tien','height':167},\n {'name':'Trung','height':175},\n {'name':'Van','height':163},\n {'name':'Xuan','height':170},\n {'name':'Y','height':158},\n {'name':'Zung','height':165}\n]))",
        expected: "[{'name': 'Oanh', 'height': 155}, {'name': 'An', 'height': 156}, {'name': 'Yen', 'height': 157}, {'name': 'Giang', 'height': 158}, {'name': 'Dao', 'height': 158}, {'name': 'Y', 'height': 158}, {'name': 'Mai', 'height': 159}, {'name': 'Thao', 'height': 159}, {'name': 'Em', 'height': 160}, {'name': 'My', 'height': 160}, {'name': 'Trang', 'height': 161}, {'name': 'Chi', 'height': 162}, {'name': 'Ha', 'height': 162}, {'name': 'Quynh', 'height': 163}, {'name': 'Van', 'height': 163}, {'name': 'Anh', 'height': 164}, {'name': 'Hanh', 'height': 165}, {'name': 'Zung', 'height': 165}, {'name': 'Linh', 'height': 166}, {'name': 'Nam', 'height': 167}, {'name': 'Tien', 'height': 167}, {'name': 'Dung', 'height': 168}, {'name': 'Ngoc', 'height': 168}, {'name': 'Tuan', 'height': 169}, {'name': 'Binh', 'height': 170}, {'name': 'Xuan', 'height': 170}, {'name': 'Bao', 'height': 171}, {'name': 'Lam', 'height': 172}, {'name': 'Thanh', 'height': 172}, {'name': 'Hung', 'height': 173}, {'name': 'Phong', 'height': 174}, {'name': 'Phuong', 'height': 174}, {'name': 'Phuc', 'height': 175}, {'name': 'Trung', 'height': 175}, {'name': 'Vinh', 'height': 176}, {'name': 'Cuong', 'height': 177}, {'name': 'Son', 'height': 178}, {'name': 'Quang', 'height': 179}, {'name': 'Khanh', 'height': 180}, {'name': 'Khoa', 'height': 181}]"
      },
    ]
  },
  {
    id: "exam2_34",
    category: "Mid-term practice",
    title: "Question 34",
    description: "<p>Cho một dictionary lưu thông tin của các thành viên trong nhóm lập trình, với cấu trúc như sau:</p><p>{'Minh': {'lines': 150, 'commits': 12}, 'Huy': {'lines': 200, 'commits': 15}, ...}</p><p>Mỗi phần tử có dạng:</p><p>Tên thành viên (string)</p><p>Một dictionary gồm:</p><p>lines: số dòng code</p><p>commits: số lần commit</p><p>Hãy viết hàm count_commits(group) để tính tổng số lần commit của tất cả thành viên trong nhóm.</p><p>Kết quả trả về là một số nguyên (integer), thể hiện tổng commits của toàn bộ nhóm.</p><p>Ví dụ:<br/>Nếu group = {'Minh': {'lines':150, 'commits':12}, 'Huy': {'lines':200, 'commits':15}}<br/>thì kết quả phải là 27.</p>",
    initialCode: "def count_commits(group):\n    # Write your code here\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_commits({'Minh': {'lines': 150, 'commits': 12}, 'Huy': {'lines': 200, 'commits': 15}}))",
        expected: "27"
      },
      {
        id: 2,
        code: "print(count_commits({'Minh': {'lines': 150, 'commits': 12}, 'Huy': {'lines': 200, 'commits': 15}, 'Lan': {'lines': 180, 'commits': 9}}))",
        expected: "36"
      },
      {
        id: 3,
        code: "print(count_commits({'A': {'lines': 10, 'commits': 1}, 'B': {'lines': 20, 'commits': 2}, 'C': {'lines': 30, 'commits': 3}, 'D': {'lines': 40, 'commits': 4}, 'E': {'lines': 50, 'commits': 5}}))",
        expected: "15"
      },
      {
        id: 4,
        code: "print(count_commits({'X': {'lines': 10, 'commits': 0}, 'Y': {'lines': 0, 'commits': 0}, 'Z': {'lines': 100, 'commits': 7}}))",
        expected: "7"
      },
      {
        id: 5,
        code: "print(count_commits({'Leader': {'lines': 3000, 'commits': 100}, 'Assistant': {'lines': 2500, 'commits': 80}, 'Intern': {'lines': 500, 'commits': 12}}))",
        expected: "192"
      },
      {
        id: 6,
        code: "print(count_commits({'UserA': {'lines': 5, 'commits': 1}, 'UserB': {'lines': 6, 'commits': 3}, 'UserC': {'lines': 7, 'commits': 5}, 'UserD': {'lines': 8, 'commits': 10}, 'UserE': {'lines': 9, 'commits': 2}, 'UserF': {'lines': 1, 'commits': 3}, 'UserG': {'lines': 2, 'commits': 4}}))",
        expected: "28"
      },
      {
        id: 7,
        code: "print(count_commits({'Alpha': {'lines': 1000, 'commits': 250}, 'Beta': {'lines': 900, 'commits': 180}, 'Gamma': {'lines': 800, 'commits': 120}, 'Delta': {'lines': 750, 'commits': 90}}))",
        expected: "640"
      },
      {
        id: 8,
        code: "print(count_commits({'Team1': {'lines': 100, 'commits': 7}, 'Team2': {'lines': 150, 'commits': 9}, 'Team3': {'lines': 200, 'commits': 11}, 'Team4': {'lines': 250, 'commits': 13}, 'Team5': {'lines': 50, 'commits': 3}}))",
        expected: "43"
      },
      {
        id: 9,
        code: "print(count_commits({'P1': {'lines': 3, 'commits': 4}, 'P2': {'lines': 3, 'commits': 4}, 'P3': {'lines': 3, 'commits': 4}, 'P4': {'lines': 3, 'commits': 4}, 'P5': {'lines': 3, 'commits': 4}, 'P6': {'lines': 3, 'commits': 4}}))",
        expected: "24"
      },
      {
        id: 10,
        code: "print(count_commits({'U1': {'lines': 120, 'commits': 10}, 'U2': {'lines': 130, 'commits': 5}, 'U3': {'lines': 140, 'commits': 15}, 'U4': {'lines': 150, 'commits': 20}, 'U5': {'lines': 160, 'commits': 8}, 'U6': {'lines': 170, 'commits': 11}, 'U7': {'lines': 180, 'commits': 14}, 'U8': {'lines': 190, 'commits': 3}}))",
        expected: "86"
      },
    ]
  },
  {
    id: "cp_5",
    category: "FTDS coding practice",
    title: "5. Đếm từ hợp lệ",
    description: "<p>Viết hàm <code>count_words(sentence)</code> để đếm xem trong câu sentence có bao nhiêu từ hợp lệ. Một từ được định nghĩa là một chuỗi ký tự liên tiếp không chứa dấu cách.</p>",
    initialCode: "def count_words(sentence):\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "print(count_words(\"Hello world\"))",
        expected: "2"
      },
      {
        id: 2,
        code: "print(count_words(\"   Python   is   fun  \"))",
        expected: "3"
      },
      {
        id: 3,
        code: "print(count_words(\"OneWord\"))",
        expected: "1"
      },
    ]
  },
  {
    id: "cp_6",
    category: "FTDS coding practice",
    title: "6. Tìm nhà trọ rẻ nhất",
    description: "<p>Viết hàm <code>find_cheapest(hostels)</code>. Chỉ xét nhà trọ có distance ≤ 3. Sắp xếp các nhà trọ thỏa mãn điều kiện theo price tăng dần. Trả về 03 nhà trọ rẻ nhất trong phạm vi này (hoặc trả về mảng rỗng nếu không có).</p>",
    initialCode: "def find_cheapest(hostels):\n    pass\n",
    testCases: [
      {
        id: 1,
        code: "hostels = [{'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.5}, {'name': 'B', 'price': 1.2, 'distance': 1.8, 'rating': 4.0}, {'name': 'C', 'price': 1.8, 'distance': 2.5, 'rating': 4.2}, {'name': 'D', 'price': 2.0, 'distance': 3.2, 'rating': 4.1}]\nprint(find_cheapest(hostels))",
        expected: "[{'name': 'B', 'price': 1.2, 'distance': 1.8, 'rating': 4.0}, {'name': 'A', 'price': 1.5, 'distance': 2.0, 'rating': 4.5}, {'name': 'C', 'price': 1.8, 'distance': 2.5, 'rating': 4.2}]"
      },
    ]
  },
];
