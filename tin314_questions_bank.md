# Đề cương cuối kỳ TIN314 - Coding Questions

## PHẦN 1: PACKING THE BACKPACK (EASY)

### 1. The Scroll (String)
- Gán chuỗi "abracadabra" cho biến spell.
- Trả về độ dài chuỗi.
- Đếm số lần xuất hiện của chữ "a".
- Thay thế "a" bằng "c".
- Đảo ngược chuỗi kết quả.

<details>
<summary>Hint (Code)</summary>

```python
def process_scroll(spell):
    length = len(spell)
    count_a = spell.count("a")
    replaced = spell.replace("a", "c")
    reversed_str = replaced[::-1]
    return length, count_a, replaced, reversed_str
```
</details>

### 2. The Inventory (List)
- Cho list backpack. Đếm số phần tử.
- Đếm số phần tử là list con.
- Thay thế phần tử list con bằng chuỗi "0".
- Nhân đôi giá trị các phần tử (string nhân đôi, int nhân 2) và đảo ngược list.

<details>
<summary>Hint (Code)</summary>

```python
def process_backpack(backpack):
    count_items = len(backpack)
    count_lists = sum(1 for item in backpack if isinstance(item, list))
    step3_list = ["0" if isinstance(item, list) else item for item in backpack]
    final_list = [item * 2 for item in step3_list]
    final_list.reverse()
    return count_items, count_lists, step3_list, final_list
```
</details>

### 3. The Identification (Dict)
- Cho dict shield. Trả về list keys và list values.
- Tìm key có value là string và đổi value thành 0.
- Tìm key có value không phải nguyên tử (list, dict...).

<details>
<summary>Hint (Code)</summary>

```python
def process_shield(shield):
    keys_list = list(shield.keys())
    values_list = list(shield.values())
    modified_shield = shield.copy()
    for k, v in modified_shield.items():
        if isinstance(v, str):
            modified_shield[k] = 0
    non_atomic_key = None
    for k, v in shield.items():
        if isinstance(v, (list, dict, set)):
            non_atomic_key = k
            break
    return keys_list, values_list, modified_shield, non_atomic_key
```
</details>

### 4. The Map Grid (Numpy)
- Tạo mảng 5x5 ngẫu nhiên.
- In kích thước (shape).
- Tìm Min thay bằng 0, Max thay bằng 1. Tính trung bình.
- Cắt mảng con 2x2 góc trái trên.

<details>
<summary>Hint (Code)</summary>

```python
import numpy as np
def process_map_grid():
    grid = np.random.randint(1, 101, size=(5, 5))
    shape = grid.shape
    min_val = np.min(grid)
    max_val = np.max(grid)
    mean_val = np.mean(grid)
    modified_grid = grid.copy()
    modified_grid[grid == min_val] = 0
    modified_grid[grid == max_val] = 1
    top_left_slice = grid[:2, :2]
    return shape, modified_grid, mean_val, top_left_slice
```
</details>

### 5. The Gatekeeper (Function)
- Viết hàm identify_type(x).
- Viết hàm identify_types(*args) trả về list các type.
- Viết hàm process_list(lst): String -> 0, Number giữ nguyên.

<details>
<summary>Hint (Code)</summary>

```python
def identify_type(x):
    return type(x)

def identify_types(*args):
    return [type(x) for x in args]

def process_list(lst):
    result = []
    for x in lst:
        if isinstance(x, str):
            result.append(0)
        elif isinstance(x, (int, float)):
            result.append(x)
    return result
```
</details>

### 6. The Whispering Mirror (Conditionals)
- Viết hàm mirror_message(x).
- Nếu là String: Đảo ngược.
- Nếu là Int/Float: Trả về số âm.
- Khác: Trả về "Unsupported".

<details>
<summary>Hint (Code)</summary>

```python
def mirror_message(x):
    if isinstance(x, str):
        return x[::-1]
    elif isinstance(x, (int, float)):
        return -x
    else:
        return "Unsupported"
```
</details>

### 7. The Selective Gate (Conditions)
- Tìm số chia hết cho 2 nhưng KHÔNG chia hết cho 3 trong list.
- Trả về số lượng và tổng của chúng.

<details>
<summary>Hint (Code)</summary>

```python
def filter_numbers(lst):
    filtered = [x for x in lst if x % 2 == 0 and x % 3 != 0]
    return len(filtered), sum(filtered)
```
</details>

### 8. The Enchanted Filter (List Processing)
- Lọc lấy các số lẻ trong list.
- Trả về list bình phương của các số đó.

<details>
<summary>Hint (Code)</summary>

```python
def process_list_odd_squared(lst):
    return [x**2 for x in lst if x % 2 != 0]
```
</details>

### 9. The Silent Scribe (String Analysis)
- Tách từ trong câu (split).
- Trả về tổng số từ.
- Đếm số từ bắt đầu bằng nguyên âm (u, e, o, a, i).

<details>
<summary>Hint (Code)</summary>

```python
def analyze_sentence(text):
    words = text.split()
    vowels = set("aeiouAEIOU")
    starts_with_vowel = sum(1 for w in words if w[0] in vowels)
    return len(words), starts_with_vowel
```
</details>

### 10. The Cipher of the Ancients
- Encode: A=1, B=2... Z=26. Giữ nguyên khoảng trắng/ký tự đặc biệt.
- Decode: Dịch ngược từ số về chữ cái.

<details>
<summary>Hint (Code)</summary>

```python
def encode_a1z26(text):
    result = []
    for char in text:
        if char.isupper():
            result.append(str(ord(char) - 64))
        else:
            result.append(char)
    return "-".join(result).replace("- -", " ")

def decode_a1z26(code):
    final_str = ""
    i = 0
    while i < len(code):
        if code[i].isdigit():
            num_str = ""
            while i < len(code) and code[i].isdigit():
                num_str += code[i]
                i += 1
            final_str += chr(int(num_str) + 64)
        else:
            if code[i] != '-':
                final_str += code[i]
            i += 1
    return final_str
```
</details>

---

## PHẦN 2: THE TRIALS (MEDIUM)

### 1. The Code Lock (Primes)
- Viết hàm is_prime(n).
- Viết hàm get_nearest_prime(n): Nếu n là prime trả về n, không thì tìm prime lớn hơn gần nhất.
- Áp dụng hàm cho list input.

<details>
<summary>Hint (Code)</summary>

```python
import math
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0: return False
    return True

def get_nearest_prime(n):
    if is_prime(n): return n
    curr = n + 1
    while not is_prime(curr):
        curr += 1
    return curr

def unlock_door(input_list):
    return [get_nearest_prime(x) for x in input_list]
```
</details>

### 2. The Merchant's Ledger
- Tính tổng giá trị của tất cả vật phẩm.
- Tìm tên vật phẩm đắt nhất.
- Lọc ra list các vật phẩm có giá > 50.

<details>
<summary>Hint (Code)</summary>

```python
def process_ledger(items):
    total_price = sum(i['price'] for i in items)
    most_expensive = max(items, key=lambda x: x['price'])['item']
    filtered = [i for i in items if i['price'] > 50]
    return total_price, most_expensive, filtered
```
</details>

### 3. The Tent (Heron's Formula)
- Tính khoảng cách giữa 3 điểm (độ dài các cạnh).
- Tính diện tích tam giác bằng công thức Heron.

<details>
<summary>Hint (Code)</summary>

```python
def calculate_distance(p1, p2):
    return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

def tent_area(p1, p2, p3):
    a = calculate_distance(p1, p2)
    b = calculate_distance(p2, p3)
    c = calculate_distance(p3, p1)
    s = (a + b + c) / 2
    return math.sqrt(s * (s - a) * (s - b) * (s - c))
```
</details>

### 4. The Moat (Circumference)
- Tính chu vi hình tròn (2 * pi * r).
- Nếu bán kính r âm, trả về "Invalid".

<details>
<summary>Hint (Code)</summary>

```python
def calc_circle(radius):
    if radius < 0:
        return "Invalid"
    return round(2 * math.pi * radius, 2)
```
</details>

### 5. The Fireball (Quadratic Equation)
- Giải phương trình bậc 2: ax^2 + bx + c = 0.
- Tính Delta và trả về các nghiệm tương ứng.

<details>
<summary>Hint (Code)</summary>

```python
def solve_quad(a, b, c):
    delta = b**2 - 4*a*c
    if delta < 0:
        return "No Solution"
    elif delta == 0:
        return -b / (2*a)
    else:
        x1 = (-b + math.sqrt(delta)) / (2*a)
        x2 = (-b - math.sqrt(delta)) / (2*a)
        return (x1, x2)
```
</details>

### 6. The Archive of Words
- Làm sạch văn bản (lowercase, bỏ ký tự đặc biệt).
- Đếm tần suất các từ.
- Trả về top 3 từ phổ biến nhất và từ dài nhất.

<details>
<summary>Hint (Code)</summary>

```python
from collections import Counter
def analyze_archive(text):
    clean_text = "".join([c.lower() if c.isalnum() or c.isspace() else "" for c in text])
    words = clean_text.split()
    freq_dict = dict(Counter(words))
    sorted_words = sorted(freq_dict.items(), key=lambda item: item[1], reverse=True)
    top_3 = [item[0] for item in sorted_words[:3]]
    longest_word = max(words, key=len) if words else ""
    return freq_dict, top_3, longest_word
```
</details>

### 7. The Echo of Repetition
- Trả về list các phần tử duy nhất.
- Trả về dict tần suất xuất hiện.
- Tìm phần tử xuất hiện nhiều nhất.

<details>
<summary>Hint (Code)</summary>

```python
def echo_repetition(lst):
    unique_elements = list(set(lst))
    frequency = dict(Counter(lst))
    most_frequent = max(frequency, key=frequency.get)
    return unique_elements, frequency, most_frequent
```
</details>

### 8. The Prime Oracle
- Lọc ra các số nguyên tố trong list input.
- Đếm số lượng số nguyên tố.
- Tìm số nguyên tố lớn nhất và số nguyên tố liền kề lớn hơn nó.

<details>
<summary>Hint (Code)</summary>

```python
def prime_oracle(lst):
    primes = [x for x in lst if is_prime(x)]
    count = len(primes)
    if count == 0:
        return [], 0, None, None
    largest_prime = max(primes)
    closest_bigger = largest_prime + 1
    while not is_prime(closest_bigger):
        closest_bigger += 1
    return primes, count, largest_prime, closest_bigger
```
</details>

### 9. The Ancient Archive (Artifacts)
- Cho list các artifacts. Tìm artifact có giá trị cao nhất.
- Tìm 5 artifacts khác gần vị trí artifact đó nhất (Euclidean distance).

<details>
<summary>Hint (Code)</summary>

```python
def analyze_artifacts(artifacts):
    count = len(artifacts)
    most_valuable = max(artifacts, key=lambda x: x['Value'])
    mv_loc = most_valuable['Location']
    
    def dist_to_mv(artifact):
        loc = artifact['Location']
        return math.sqrt((loc[0]-mv_loc[0])**2 + (loc[1]-mv_loc[1])**2)
        
    others = [a for a in artifacts if a['ID'] != most_valuable['ID']]
    others.sort(key=dist_to_mv)
    five_closest = others[:5]
    result_closest = [(a['Name'], a['Value'], a['Location']) for a in five_closest]
    return count, most_valuable, result_closest
```
</details>

### 10. The Digit Oracle (Perfect Digit)
- Định nghĩa số "perfect digit": chia hết cho tổng các chữ số của nó.
- Tìm tất cả các số như vậy trong list.
- Đếm số lượng và tìm số lớn nhất.

<details>
<summary>Hint (Code)</summary>

```python
def digit_sum(n):
    return sum(int(d) for d in str(n))

def is_perfect(n):
    ds = digit_sum(n)
    return ds > 0 and n % ds == 0

def analyze_perfect(lst):
    perfect_nums = [x for x in lst if is_perfect(x)]
    count = len(perfect_nums)
    largest = max(perfect_nums) if perfect_nums else None
    return perfect_nums, count, largest
```
</details>

### 11. The Rope of Equal Segments
- Cho hai dây độ dài N và M.
- Tìm độ dài đoạn cắt bằng nhau lớn nhất (GCD).
- Tính tổng số đoạn dây cắt được.

<details>
<summary>Hint (Code)</summary>

```python
def count_segments(N, M):
    common_length = math.gcd(N, M)
    return (N // common_length) + (M // common_length)
```
</details>

### 12. The Treasure Hoard
- Cho dict các món đồ và giá trị.
- Chọn đúng 3 món đồ có giá trị cao nhất.

<details>
<summary>Hint (Code)</summary>

```python
def select_items(items):
    sorted_items = sorted(items.items(), key=lambda x: x[1], reverse=True)
    top_3_names = [item[0] for item in sorted_items[:3]]
    return top_3_names
```
</details>

### 13. The Mirror Pairs
- Cho một list input.
- Đếm số cặp index (i, j) sao cho i < j và arr[i] == arr[j].

<details>
<summary>Hint (Code)</summary>

```python
def count_mirror_pairs(lst):
    count = 0
    n = len(lst)
    for i in range(n):
        for j in range(i + 1, n):
            if lst[i] == lst[j]:
                count += 1
    return count
```
</details>

---

## PHẦN 3: THE BOSS FIGHT (HARD)

### 1. The Rabbit Population (Fibonacci)
- Viết hàm tính dãy Fibonacci.
- Trả về số Fibonacci thứ n.

<details>
<summary>Hint (Code)</summary>

```python
def rabbit_population(n):
    if n <= 0: return []
    if n == 1: return [0]
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq, seq[-1]
```
</details>

### 2. The Signal (Convolution)
- Input: List signal và list kernel.
- Tính tổng tích chập (sliding window sum).

<details>
<summary>Hint (Code)</summary>

```python
def process_signal(signal, kernel):
    result = []
    k_len = len(kernel)
    s_len = len(signal)
    for i in range(s_len - k_len + 1):
        segment = signal[i : i + k_len]
        val = sum(s * k for s, k in zip(segment, kernel))
        result.append(val)
    return result
```
</details>

### 3. The Grid Path (Shortest Path)
- Cho lưới số (grid). Đi từ góc trái trên xuống phải dưới.
- Chỉ được đi sang phải (Right) hoặc xuống dưới (Down).
- Tìm đường đi có tổng chi phí nhỏ nhất (Min cost).

<details>
<summary>Hint (Code)</summary>

```python
def min_path_sum(grid):
    R = len(grid)
    C = len(grid[0])
    dp = [[0]*C for _ in range(R)]
    dp[0][0] = grid[0][0]
    for i in range(1, R):
        dp[i][0] = dp[i-1][0] + grid[i][0]
    for j in range(1, C):
        dp[0][j] = dp[0][j-1] + grid[0][j]
    for i in range(1, R):
        for j in range(1, C):
            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
    return dp[-1][-1]
```
</details>

### 4. The Maze (Validation)
- Cho bản đồ game (ma trận ký tự).
- Kiểm tra tọa độ (x, y) có nằm trong bản đồ không.
- Kiểm tra vị trí đó có phải là tường ('#') không.

<details>
<summary>Hint (Code)</summary>

```python
def is_safe(x, y, game_map):
    rows = len(game_map)
    cols = len(game_map[0])
    if not (0 <= x < rows and 0 <= y < cols):
        return False
    if game_map[x][y] == '#':
        return False
    return True
```
</details>

### 5. The Trader (Maximize Profit)
- Cho list giá cổ phiếu theo ngày.
- Chọn 1 ngày mua và 1 ngày bán (sau ngày mua).
- Tìm mức lợi nhuận tối đa có thể đạt được.

<details>
<summary>Hint (Code)</summary>

```python
def max_profit(prices):
    if not prices:
        return 0
    min_price = prices[0]
    max_profit_val = 0
    for price in prices:
        if price < min_price:
            min_price = price
        elif price - min_price > max_profit_val:
            max_profit_val = price - min_price
    return max_profit_val
```
</details>

### 6. The Clusters (kMeans Logic)
- Cho điểm A và 2 tâm cụm C1, C2.
- Tính khoảng cách từ A đến C1 và C2.
- Gán A vào cụm có khoảng cách gần hơn.

<details>
<summary>Hint (Code)</summary>

```python
import math
def assign_cluster(point_a, c1, c2):
    dist_c1 = math.sqrt((point_a[0]-c1[0])**2 + (point_a[1]-c1[1])**2)
    dist_c2 = math.sqrt((point_a[0]-c2[0])**2 + (point_a[1]-c2[1])**2)
    assigned = "C1" if dist_c1 < dist_c2 else "C2"
    return dist_c1, dist_c2, assigned
```
</details>

### 7. The Unknown Plant (kNN Logic)
- Cho dữ liệu train (X, y) và một điểm dữ liệu mới.
- Tìm điểm dữ liệu train gần nhất (Nearest Neighbor).
- Trả về nhãn (label) của điểm gần nhất đó.

<details>
<summary>Hint (Code)</summary>

```python
def knn_predict(x_train, y_labels, target_y):
    min_dist = float('inf')
    nearest_index = -1
    for i, val in enumerate(x_train):
        dist = abs(val - target_y)
        if dist < min_dist:
            min_dist = dist
            nearest_index = i
    return y_labels[nearest_index]
```
</details>

### 8. The Geomancer's Trial (Colinearity & Distance)
- Kiểm tra 3 điểm bất kỳ có thẳng hàng không.
- Kiểm tra một điểm có nằm trong tam giác tạo bởi 3 điểm còn lại không.
- Tìm cặp điểm có khoảng cách gần nhau nhất trong 4 điểm.

<details>
<summary>Hint (Code)</summary>

```python
from itertools import combinations
import math

def geomancer_trial(p1, p2, p3, p4):
    points = [p1, p2, p3, p4]
    # 1. Check Colinearity
    colinear_triplets = []
    for triplet in combinations(points, 3):
        (x1, y1), (x2, y2), (x3, y3) = triplet
        area = x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)
        if area == 0:
            colinear_triplets.append(triplet)
    has_colinear = len(colinear_triplets) > 0
    
    # 2. Point inside triangle
    def area(a, b, c):
        return 0.5 * abs(a[0]*(b[1]-c[1]) + b[0]*(c[1]-a[1]) + c[0]*(a[1]-b[1]))
        
    inside_result = None
    for i in range(4):
        p_test = points[i]
        others = points[:i] + points[i+1:]
        A_abc = area(others[0], others[1], others[2])
        A_pab = area(p_test, others[0], others[1])
        A_pbc = area(p_test, others[1], others[2])
        A_pac = area(p_test, others[0], others[2])
        if abs(A_abc - (A_pab + A_pbc + A_pac)) < 1e-9:
            inside_result = (True, p_test, others)
            break
            
    if not inside_result:
        inside_result = False
        
    # 3. Closest points
    min_dist = float('inf')
    closest_pair = None
    for i in range(4):
        for j in range(i+1, 4):
            d = math.sqrt((points[i][0]-points[j][0])**2 + (points[i][1]-points[j][1])**2)
            if d < min_dist:
                min_dist = d
                closest_pair = (points[i], points[j])
                
    return has_colinear, inside_result, closest_pair, min_dist
```
</details>

### 9. The Triad of Balance (3SUM Problem)
- Cho một list các số nguyên.
- Tìm bộ ba số (a, b, c) sao cho a + b + c = 0.
- Trả về danh sách các bộ ba (không trùng lặp).

<details>
<summary>Hint (Code)</summary>

```python
def find_triad_balance(nums):
    nums.sort()
    triplets = set()
    n = len(nums)
    for i in range(n-2):
        left = i + 1
        right = n - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                triplets.add((nums[i], nums[left], nums[right]))
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
    result_list = sorted(list(triplets))
    return result_list, len(result_list)
```
</details>

### 10. The Forbidden Passage (BFS Pathfinding)
- Tìm đường đi ngắn nhất từ (1,1) đến (8,8) trên lưới 8x8.
- Tránh các ô có quái vật.
- Đếm số lượng đường đi an toàn (DP) nếu tìm được đường.

<details>
<summary>Hint (Code)</summary>

```python
def forbidden_passage(monsters_list):
    start = (1, 1)
    end = (8, 8)
    monsters = set(monsters_list)
    queue = [[start]]
    visited = {start}
    shortest_path = None
    safe_paths_count = 0
    
    # BFS
    while queue:
        path = queue.pop(0)
        x, y = path[-1]
        if (x, y) == end:
            shortest_path = path
            break
        moves = [(x+1, y), (x, y+1)]
        for nx, ny in moves:
            if nx <= 8 and ny <= 8 and (nx, ny) not in monsters and (nx, ny) not in visited:
                visited.add((nx, ny))
                new_path = list(path)
                new_path.append((nx, ny))
                queue.append(new_path)
                
    # DP Counting
    if shortest_path:
        dp = [[0]*9 for _ in range(9)]
        if (1,1) not in monsters:
            dp[1][1] = 1
            for i in range(1, 9):
                for j in range(1, 9):
                    if (i, j) == (1, 1): continue
                    if (i, j) in monsters:
                        dp[i][j] = 0
                    else:
                        dp[i][j] = dp[i-1][j] + dp[i][j-1]
        safe_paths_count = dp[8][8]
        return True, shortest_path, safe_paths_count
    else:
        return "No safe path"
```
</details>

### 11. The Sage of Polynomials
- Input hai đa thức dưới dạng chuỗi (ví dụ "2x^2 + 3x + 1").
- Parse chuỗi thành dict hệ số.
- Thực hiện phép cộng và nhân hai đa thức, trả về kết quả dạng chuỗi.

<details>
<summary>Hint (Code)</summary>

```python
def sage_polynomials(p1_str, p2_str):
    def parse_poly(s):
        s = s.replace(" ", "").replace("-", "+-")
        terms = s.split("+")
        poly_dict = {}
        for term in terms:
            if not term: continue
            if "x^" in term:
                coef, exp = term.split("x^")
                coef = int(coef) if coef and coef != "-" else (-1 if coef == "-" else 1)
                exp = int(exp)
            elif "x" in term:
                coef = term.replace("x", "")
                coef = int(coef) if coef and coef != "-" else (-1 if coef == "-" else 1)
                exp = 1
            else:
                coef = int(term)
                exp = 0
            poly_dict[exp] = poly_dict.get(exp, 0) + coef
        return poly_dict
        
    d1 = parse_poly(p1_str)
    d2 = parse_poly(p2_str)
    
    # Addition
    add_res = d1.copy()
    for exp, coef in d2.items():
        add_res[exp] = add_res.get(exp, 0) + coef
        
    # Multiplication
    mul_res = {}
    for e1, c1 in d1.items():
        for e2, c2 in d2.items():
            new_exp = e1 + e2
            new_coef = c1 * c2
            mul_res[new_exp] = mul_res.get(new_exp, 0) + new_coef
            
    def to_string(d):
        terms = []
        for exp in sorted(d.keys(), reverse=True):
            coef = d[exp]
            if coef == 0: continue
            term_str = ""
            if exp == 0: term_str = str(coef)
            elif exp == 1: term_str = f"{coef}x" if coef != 1 else "x"
            else: term_str = f"{coef}x^{exp}" if coef != 1 else f"x^{exp}"
            terms.append(term_str)
        return "+".join(terms).replace("+-", "-")
        
    return to_string(add_res), to_string(mul_res)
```
</details>

### 12. The Excavation Schedule
- Cho hai chu kỳ làm việc N ngày (nghỉ 1) và M ngày (nghỉ 1).
- Tính từ đầu năm 2024 đến target_date.
- Đếm số ngày cả hai cùng làm việc.

<details>
<summary>Hint (Code)</summary>

```python
from datetime import date
def count_working_days(N, M, target_date):
    start_date = date(2024, 1, 1)
    delta = target_date - start_date
    total_days = delta.days + 1
    overlap_count = 0
    for day in range(total_days):
        pos_a = day % (N + 1)
        is_working_a = pos_a < N
        pos_b = day % (M + 1)
        is_working_b = pos_b < M
        if is_working_a and is_working_b:
            overlap_count += 1
    return overlap_count
```
</details>

### Bonus: Data Normalization
- Input list điểm số thô.
- Chuẩn hóa dữ liệu về thang [0, 1] bằng phương pháp Min-Max.

<details>
<summary>Hint (Code)</summary>

```python
def normalize_data(raw_scores):
    if not raw_scores: return []
    x_min = min(raw_scores)
    x_max = max(raw_scores)
    if x_max == x_min:
        return [0.0] * len(raw_scores)
    return [(x - x_min) / (x_max - x_min) for x in raw_scores]
```
</details>

---

## PHẦN 4: 24H LÀM SINH VIÊN TRƯỜNG F

### 1. Mất vé xe tháng
- Cho list ngày mất vé. Đếm số lần, tìm ngày sớm/muộn nhất.
- Tính khoảng cách giữa các lần mất vé.
- Dự đoán 3 ngày mất vé tiếp theo (dựa trên quy luật khoảng cách).

<details>
<summary>Hint (Code)</summary>

```python
import statistics
def analyze_lost_tickets(days):
    count = len(days)
    earliest = min(days)
    latest = max(days)
    diffs = [days[i+1] - days[i] for i in range(len(days)-1)]
    step = diffs[0] if diffs else 7
    predicted_next_3 = [days[-1] + step * i for i in range(1, 4)]
    return count, earliest, latest, diffs, predicted_next_3
```
</details>

### 2. Conan nhà tập
- Cho y_true (thực tế) và y_pred (dự đoán).
- Đếm số lượng TP, TN, FP, FN.
- Tính Precision và Recall.

<details>
<summary>Hint (Code)</summary>

```python
def analyze_camera_ai(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t==1 and p==1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t==0 and p==0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t==0 and p==1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t==1 and p==0)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    return tp, tn, fp, fn, precision, recall
```
</details>

### 3. Đội bóng FTU
- Cho dict cầu thủ. Đếm số lượng mỗi vị trí.
- Tìm cầu thủ skill cao nhất mỗi vị trí.
- Chọn đội hình 11 người có skill cao nhất (Greedy skill).

<details>
<summary>Hint (Code)</summary>

```python
from collections import Counter
def analyze_football_team(players):
    # 1. Đếm số lượng vị trí
    positions = [data['pos'] for data in players.values()]
    pos_count = dict(Counter(positions))
    
    # 2. Tìm cầu thủ giỏi nhất mỗi vị trí
    best_by_pos = {}
    for name, data in players.items():
        p = data['pos']
        s = data['skill']
        if p not in best_by_pos or s > best_by_pos[p][1]:
            best_by_pos[p] = (name, s)
            
    # 3. Chọn đội hình 11 người (Greedy - Top 11 skill cao nhất)
    all_players_list = [(name, data['skill']) for name, data in players.items()]
    all_players_list.sort(key=lambda x: x[1], reverse=True)
    dream_team_11 = [p[0] for p in all_players_list[:11]]
    
    return pos_count, best_by_pos, dream_team_11
```
</details>

### 4. Thường nhật của một Wibu
- Cho dict anime.
- Tính % hoàn thành của từng anime.
- Tìm anime < 100% nhưng gần xong nhất.
- Tính số ngày cần để xem hết (tốc độ 5 tập/ngày).

<details>
<summary>Hint (Code)</summary>

```python
import math
def wibu_schedule(anime_dict):
    analysis = {}
    remaining_dict = {}
    
    for name, (watched, total) in anime_dict.items():
        rem = total - watched
        percent = (watched / total) * 100 if total > 0 else 0
        analysis[name] = f"{percent:.1f}%"
        if rem > 0:
            remaining_dict[name] = rem
            
    if not remaining_dict:
        return analysis, None, 0
        
    closest_anime = min(remaining_dict, key=remaining_dict.get)
    total_eps_needed = sum(remaining_dict.values())
    days_needed = math.ceil(total_eps_needed / 5)
    
    return analysis, closest_anime, days_needed
```
</details>

### 5. Bài tập nhóm
- Tính tổng số dòng code và số commits của cả nhóm.
- Tính phần trăm đóng góp của từng thành viên.
- Xác định "free-rider" (đóng góp <15% hoặc commits < 5).

<details>
<summary>Hint (Code)</summary>

```python
def analyze_group_work(group_data):
    total_lines = sum(m['lines'] for m in group_data.values())
    total_commits = sum(m['commits'] for m in group_data.values())
    results = {}
    for name, data in group_data.items():
        pct = (data['lines'] / total_lines) * 100 if total_lines > 0 else 0
        is_freerider = (pct < 15) or (data['commits'] < 5)
        results[name] = {'pct': pct, 'is_freerider': is_freerider}
    return total_lines, total_commits, results
```
</details>

### 6. WC nhà B
- Tìm các buồng vệ sinh còn trống.
- Chọn buồng trống có khoảng cách xa nhất so với các buồng đang có người (tối ưu hóa sự riêng tư).
- Cập nhật trạng thái sau khi chọn.

<details>
<summary>Hint (Code)</summary>

```python
def wc_simulation(status, num_people=5):
    current_status = status.copy()
    for _ in range(num_people):
        empty_indices = [i for i, x in enumerate(current_status) if x == 0]
        if not empty_indices: break
        best_idx = -1
        max_dist = -1
        occupied_indices = [i for i, x in enumerate(current_status) if x == 1]
        
        if not occupied_indices:
            best_idx = 0
        else:
            for i in empty_indices:
                dist = min(abs(i - occ) for occ in occupied_indices)
                if dist > max_dist:
                    max_dist = dist
                    best_idx = i
        if best_idx != -1:
            current_status[best_idx] = 1
    return current_status
```
</details>

### 7. Cục đá trường F
- Xác suất đỗ cơ bản là 0.6.
- Mỗi lần "lạy cụ" được cộng thêm 0.05.
- Tính xác suất đỗ cuối cùng (tối đa là 1.0).

<details>
<summary>Hint (Code)</summary>

```python
def calculate_pass_prob(k_bows):
    base = 0.6
    bonus = k_bows * 0.05
    return min(base + bonus, 1.0)
```
</details>

### 8. FTU Losers Club
- Tính Max, Min, đếm số lượng qua môn (>= 5).
- Tính Mean (trung bình), Median (trung vị), Mode (Yếu vị).
- Phân cụm sinh viên thành 3 nhóm (Giỏi, TB, Yếu) bằng K-Means đơn giản.

<details>
<summary>Hint (Code)</summary>

```python
import statistics
def analyze_scores(scores):
    # 1. Cơ bản
    max_s = max(scores)
    min_s = min(scores)
    passed = sum(1 for s in scores if s >= 5)
    
    # 2. Thống kê
    mean_s = statistics.mean(scores)
    median_s = statistics.median(scores)
    try:
        mode_s = statistics.mode(scores)
    except statistics.StatisticsError:
        mode_s = "No unique mode" 
        
    # 3. K-Means đơn giản (3 cụm: Giỏi(9), TB(6), Yếu(3))
    centroids = [9.0, 6.0, 3.0] 
    clusters = {0: [], 1: [], 2: []} 
    
    for s in scores:
        dists = [abs(s - c) for c in centroids]
        chosen_cluster = dists.index(min(dists))
        clusters[chosen_cluster].append(s)
        
    return (max_s, min_s, passed), (mean_s, median_s, mode_s), clusters
```
</details>

### 9. Ở trọ
- Lọc danh sách nhà trọ trong bán kính 3km. Tìm nhà rẻ nhất.
- Tính Value Score = Rating/Price - Distance * 0.1.
- Trả về top 3 nhà trọ có điểm cao nhất.

<details>
<summary>Hint (Code)</summary>

```python
def find_accommodation(houses):
    valid_houses = [h for h in houses if h['d'] <= 3.0]
    cheapest = min(valid_houses, key=lambda x: x['p']) if valid_houses else None
    ranked_houses = []
    for h in houses:
        score = (h['r'] / h['p']) - (h['d'] * 0.1)
        ranked_houses.append((h['name'], score))
    ranked_houses.sort(key=lambda x: x[1], reverse=True)
    top_3 = ranked_houses[:3]
    return cheapest, top_3
```
</details>

### 10. Làm thêm
- Tính mức lương theo giờ cho mỗi công việc.
- Sắp xếp công việc theo mức lương giảm dần.
- Chọn việc để tối đa hóa thu nhập trong 40h (cho phép làm lẻ giờ - Fractional Knapsack).

<details>
<summary>Hint (Code)</summary>

```python
def optimize_income(jobs, max_hours=40):
    job_data = []
    for j in jobs:
        rate = j['pay'] / j['h']
        job_data.append({'pay': j['pay'], 'h': j['h'], 'rate': rate})
    job_data.sort(key=lambda x: x['rate'], reverse=True)
    
    total_income = 0
    remaining_hours = max_hours
    
    for j in job_data:
        if remaining_hours <= 0: break
        if remaining_hours >= j['h']:
            total_income += j['pay']
            remaining_hours -= j['h']
        else:
            total_income += j['rate'] * remaining_hours
            remaining_hours = 0
            
    return total_income
```
</details>

### 11. Phòng quản lý đào tạo (Queue Simulation)
- Mô phỏng 1 hàng đợi đơn (FIFO): Tính thời gian chờ TB.
- Mô phỏng hàng đợi ưu tiên (Priority Queue): Sinh viên năm 4 được phục vụ trước.
- Mô phỏng 2 hàng đợi song song: Chia sinh viên vào quầy vắng hơn.

<details>
<summary>Hint (Code)</summary>

```python
import heapq
def pd_training_simulation(students_list):
    service_time = 10
    
    # 1. Single Queue
    wait_times_1 = []
    current_time = 0
    for _ in students_list:
        wait_times_1.append(current_time)
        current_time += service_time
    avg_wait_1 = sum(wait_times_1) / len(students_list)
    
    # 2. Priority Queue (Year 4 first)
    sorted_students = sorted(students_list, key=lambda x: x['year'], reverse=True)
    wait_times_2 = []
    current_time = 0
    for _ in sorted_students:
        wait_times_2.append(current_time)
        current_time += service_time
    avg_wait_2 = sum(wait_times_2) / len(sorted_students)
    
    # 3. Parallel Queues
    counters = [0, 0]
    completion_times = []
    for _ in students_list:
        idx = 0 if counters[0] <= counters[1] else 1
        start_time = counters[idx]
        end_time = start_time + service_time
        counters[idx] = end_time
        completion_times.append(end_time)
    total_time_parallel = max(counters)
    
    return avg_wait_1, avg_wait_2, total_time_parallel
```
</details>

### 12. Chạm mặt ex (Prob & Danger Zones)
- Tính xác suất an toàn (1 - Xác suất gặp Ex) tại mỗi địa điểm.
- So sánh lịch trình của Nam và Ex.
- Liệt kê các "Danger Zones" (trùng thời gian và địa điểm).

<details>
<summary>Hint (Code)</summary>

```python
def avoid_ex(ex_loc_probs, nam_schedule, ex_schedule):
    safe_probs = {loc: round(1 - prob, 2) for loc, prob in ex_loc_probs.items()}
    danger_zones = []
    nam_dict = {item['time']: item['location'] for item in nam_schedule}
    
    for item in ex_schedule:
        t = item['time']
        loc = item['location']
        if t in nam_dict and nam_dict[t] == loc:
            danger_zones.append((t, loc))
            
    return safe_probs, danger_zones
```
</details>

### 13. First Date (Budget & Compatibility)
- Lọc địa điểm theo ngân sách cho phép.
- Tính điểm tương hợp (Compatibility Score) dựa trên sở thích của Crush.
- Kiểm tra tính khả thi của lịch trình (tổng chi phí <= ngân sách).

<details>
<summary>Hint (Code)</summary>

```python
def plan_first_date(places, crush_prefs, budget_minh):
    affordable = [p for p in places if p['cost'] <= budget_minh]
    avg_cost = sum(p['cost'] for p in affordable) / len(affordable) if affordable else 0
    
    scored_places = []
    for p in affordable:
        score = 0
        if p['vibe'] in crush_prefs['likes']: score += 1
        if p['vibe'] in crush_prefs['dislikes']: score -= 0.5
        scored_places.append((p['name'], score))
        
    scored_places.sort(key=lambda x: x[1], reverse=True)
    top_3 = [x[0] for x in scored_places[:3]]
    
    def check_schedule(activity_list):
        total_cost = sum(act['cost'] for act in activity_list)
        return total_cost <= 800
        
    return affordable, avg_cost, top_3, check_schedule
```
</details>

### 14. Xuân Hòa (Military Training)
- Sắp xếp danh sách sinh viên theo chiều cao. Tính trung vị.
- Chia 40 sinh viên thành 4 đội theo kiểu Round-robin.
- Phân loại vai trò: Shooters (bắn súng giỏi) và Scouts (thể lực tốt).

<details>
<summary>Hint (Code)</summary>

```python
import statistics
def xuan_hoa_training(students):
    students.sort(key=lambda x: x['height'])
    heights = [s['height'] for s in students]
    med_h = statistics.median(heights)
    range_h = max(heights) - min(heights)
    
    teams = [[], [], [], []]
    for i, s in enumerate(students):
        teams[i % 4].append(s)
        
    roles = {'Shooters': [], 'Scouts': []}
    for s in students:
        if s.get('shooting', 0) > 8:
            roles['Shooters'].append(s['name'])
        if s.get('fitness', 0) > 7 and s.get('marching', 0) > 7:
            roles['Scouts'].append(s['name'])
            
    return med_h, range_h, teams, roles
```
</details>

### 15. Xuân Hòa 2 (Attendance)
- Tìm 5 sinh viên có tỷ lệ đi học thấp nhất.
- Phát hiện nguy cơ: Nếu nghỉ 2 ngày liên tiếp -> Tăng gấp đôi xác suất vắng.
- Đưa vào "Watch List" nếu xác suất vắng dự đoán > 0.3.

<details>
<summary>Hint (Code)</summary>

```python
def attendance_analytics(attendance_data):
    for sv in attendance_data:
        sv['rate'] = sum(sv['days']) / len(sv['days'])
        
    sorted_sv = sorted(attendance_data, key=lambda x: x['rate'])
    bottom_5 = [sv['name'] for sv in sorted_sv[:5]]
    watch_list = []
    
    for sv in attendance_data:
        absent_count = sv['days'].count(0)
        p_absent = absent_count / len(sv['days'])
        if len(sv['days']) >= 2 and sv['days'][-1] == 0 and sv['days'][-2] == 0:
            p_absent *= 2
        if p_absent > 0.3:
            watch_list.append(sv['name'])
            
    return bottom_5, watch_list
```
</details>

### 16. Điểm cuối kỳ
- Bối cảnh: Dự đoán điểm cuối kỳ môn TIN314 dựa trên số giờ tự học mỗi tuần.
- Dataset: `hours = [5, 10, 15, 20, 8, 12, 18, 6, 14, 16]`, `scores = [5.0, 6.0, 7.5, 8.5, 5.5, 6.5, 8.0, 5.2, 7.0, 7.8]`
- Yêu cầu:
  - Chuẩn bị dữ liệu: Reshape hours thành mảng 2D shape (10,1). Chia dữ liệu thành tập train (8 mẫu đầu) và test (2 mẫu cuối). Trả về tuple chứa kích thước các tập: `(X_train.shape, X_test.shape, y_train.shape, y_test.shape)`.
  - Huấn luyện model: Sử dụng LinearRegression từ thư viện sklearn. Fit model với dữ liệu train. Trả về tuple các tham số làm tròn 2 chữ số thập phân: `(round(coef, 2), round(intercept, 2))`.
  - Dự đoán và đánh giá: Dự đoán (predict) trên tập test. Tính MAE (Mean Absolute Error) bằng hàm của sklearn. Trả về dictionary: `{'predictions': [...], 'actual': [...], 'MAE': round(mae, 2)}`.
  - (Bonus) Manual Predict: Viết hàm manual_predict(hours, coef, intercept) tính toán thủ công theo công thức y = ax + b. Test với hours=10, so sánh kết quả với sklearn xem sai số có nhỏ hơn 0.01 không. Trả về tuple: `(manual_result, sklearn_result, is_close)`.

<details>
<summary>Hint (Code)</summary>

```python
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

def solve_question_20():
    # Dataset
    hours = [5, 10, 15, 20, 8, 12, 18, 6, 14, 16]
    scores = [5.0, 6.0, 7.5, 8.5, 5.5, 6.5, 8.0, 5.2, 7.0, 7.8]
    
    # --- 1. Chuẩn bị dữ liệu ---
    X = np.array(hours).reshape(-1, 1)
    y = np.array(scores)
    
    # Chia train (8 mẫu) và test (2 mẫu)
    X_train, X_test = X[:8], X[8:]
    y_train, y_test = y[:8], y[8:]
    result_1 = (X_train.shape, X_test.shape, y_train.shape, y_test.shape)
    
    # --- 2. Huấn luyện model ---
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    coef = model.coef_[0]
    intercept = model.intercept_
    result_2 = (round(coef, 2), round(intercept, 2))
    
    # --- 3. Dự đoán và đánh giá ---
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    
    result_3 = {
        'predictions': list(y_pred),
        'actual': list(y_test),
        'MAE': round(mae, 2)
    }
    
    # --- 4. Bonus: Manual Predict ---
    def manual_predict(h, c, i):
        return c * h + i
        
    test_h = 10
    manual_val = manual_predict(test_h, coef, intercept)
    sklearn_val = model.predict([[test_h]])[0]
    is_close = abs(manual_val - sklearn_val) < 0.01
    
    result_4 = (manual_val, sklearn_val, is_close)
    
    # Trả về kết quả để hệ thống check
    return result_1, result_2, result_3, result_4
```
</details>

### 17. Bạn có qua môn TIN314 không?
- Bối cảnh: Dự đoán sinh viên đỗ/trượt môn học dựa trên số buổi đi học (tổng 15 buổi).
- Dataset: `attendance = [12, 8, 14, 6, 13, 7, 15, 5, 11, 9]`, `passed = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]` (1: Đỗ, 0: Trượt)
- Yêu cầu:
  - Chuẩn bị dữ liệu: Reshape attendance thành mảng 2D shape (10,1). Chia dữ liệu thành tập train (8 mẫu đầu) và test (2 mẫu cuối). Đếm số lượng sinh viên ĐỖ trong tập train. Trả về tuple: `(X_train.shape, X_test.shape, count_passed_in_train)`.
  - Huấn luyện model: Sử dụng LogisticRegression từ thư viện sklearn. Fit model với dữ liệu train. Dự đoán cho một sinh viên mới đi học 10 buổi. Trả về tuple gồm nhãn dự đoán và xác suất đỗ (làm tròn 2 chữ số): `(prediction, probability_of_passing)`.
  - Dự đoán và đánh giá: Dự đoán trên tập test. Tính độ chính xác (Accuracy). Tự tính tay Confusion Matrix (đếm số TP, TN, FP, FN). Trả về dictionary: `{'predictions': [...], 'actual': [...], 'accuracy': acc, 'confusion': {'TP': ?, 'TN': ?, 'FP': ?, 'FN': ?}}`.
  - (Bonus) Precision vs Recall: Trong bối cảnh hệ thống cần cảnh báo sớm sinh viên yếu (nguy cơ trượt), chỉ số nào quan trọng hơn? Tính giá trị Precision và Recall. Trả về dictionary: `{'precision': ?, 'recall': ?, 'which_more_important': 'precision' hoặc 'recall'}`.

<details>
<summary>Hint (Code)</summary>

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score

def solve_question_21():
    # Dataset
    attendance = [12, 8, 14, 6, 13, 7, 15, 5, 11, 9]
    passed = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    
    # --- 1. Chuẩn bị dữ liệu ---
    X = np.array(attendance).reshape(-1, 1)
    y = np.array(passed)
    
    # Chia train (8 mẫu) và test (2 mẫu)
    X_train, X_test = X[:8], X[8:]
    y_train, y_test = y[:8], y[8:]
    
    count_passed_in_train = int(np.sum(y_train == 1))
    result_1 = (X_train.shape, X_test.shape, count_passed_in_train)
    
    # --- 2. Huấn luyện model ---
    model = LogisticRegression()
    model.fit(X_train, y_train)
    
    # Predict cho attendance = 10
    sample = [[10]]
    prediction = model.predict(sample)[0]
    probability = round(model.predict_proba(sample)[0][1], 2)
    result_2 = (prediction, probability)
    
    # --- 3. Dự đoán và đánh giá ---
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    # Confusion matrix thủ công
    tp = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 1 and yp == 0)
    
    result_3 = {
        'predictions': list(y_pred),
        'actual': list(y_test),
        'accuracy': acc,
        'confusion': {'TP': tp, 'TN': tn, 'FP': fp, 'FN': fn}
    }
    
    # --- 4. Bonus: Precision vs Recall ---
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    
    result_4 = {
        'precision': float(prec),
        'recall': float(rec),
        'which_more_important': 'recall'
    }
    
    # Trả về kết quả để hệ thống check
    return result_1, result_2, result_3, result_4
```
</details>