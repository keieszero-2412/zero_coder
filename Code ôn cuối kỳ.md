# Bài tập Python - Phân tích Tài chính Định lượng

## Question 1
**Bối cảnh:** Mai là sinh viên FTU đam mê tài chính định lượng (quantitative finance). Bạn ấy tải về dữ liệu giao dịch hằng ngày của một cổ phiếu và muốn dùng Python để phân tích, xây chiến lược giao dịch và dự báo thị trường.
Mai bắt đầu bằng việc tổng hợp dữ liệu giá: số ngày giao dịch, giá đóng cửa trung bình, ngày giá cao nhất và thấp nhất, tổng khối lượng.

**Yêu cầu:** Viết hàm `price_summary(data)`. `data` là list of dicts, mỗi dict có keys `'day'`, `'open'`, `'high'`, `'low'`, `'close'`, `'volume'`:
- `days` = số ngày giao dịch
- `avg_close` = giá đóng cửa trung bình, làm tròn 2dp
- `max_close` = tuple `(day, close)` của ngày giá đóng cửa cao nhất; nếu hòa, lấy ngày sớm nhất
- `min_close` = tuple `(day, close)` của ngày giá đóng cửa thấp nhất; nếu hòa, lấy ngày sớm nhất
- `total_volume` = tổng khối lượng giao dịch

**Trả về:** `dict {'days', 'avg_close', 'max_close', 'min_close', 'total_volume'}`

**Ví dụ:**
Đầu vào:
```python
price_summary([{'day':1,'open':99.0,'high':101.0,'low':98.0,'close':100.0,'volume':5000},
               {'day':2,'open':100.0,'high':103.0,'low':99.0,'close':102.0,'volume':6000},
               {'day':3,'open':102.0,'high':102.5,'low':100.0,'close':101.0,'volume':5500}])
```
Kết quả mong đợi:
```python
{'days': 3, 'avg_close': 101.0, 'max_close': (2, 102.0), 'min_close': (1, 100.0), 'total_volume': 16500}
```

---

## Question 2
**Bối cảnh:** Mai là sinh viên FTU đam mê tài chính định lượng (quantitative finance). Bạn ấy tải về dữ liệu giao dịch hằng ngày của một cổ phiếu và muốn dùng Python để phân tích, xây chiến lược giao dịch và dự báo thị trường.
Mai muốn biết: nếu nhìn lại lịch sử, đâu là cơ hội mua-rồi-bán tốt nhất? Tức là chọn một ngày mua và một ngày bán **sau đó** sao cho lợi nhuận lớn nhất.

**Yêu cầu:** Viết hàm `best_trade(prices)`. `prices` là list of dicts có keys `'day'`, `'close'`, đã sắp theo thời gian. Tìm ngày mua `buy_day` và ngày bán `sell_day` với `buy_day` trước `sell_day` sao cho `profit = close_bán - close_mua` lớn nhất.
- Trả về tuple `(buy_day, sell_day, profit)`, `profit` làm tròn 2dp
- Nếu hòa, chọn `buy_day` sớm nhất; nếu vẫn hòa, `sell_day` sớm nhất
- Nếu không có giao dịch nào có lãi (hoặc < 2 ngày), trả về `(None, None, 0.0)`

**Ví dụ:**
Đầu vào:
```python
best_trade([{'day':1,'close':100.0},{'day':2,'close':98.0},{'day':3,'close':105.0}])
```
Kết quả mong đợi:
```python
(2, 3, 7.0)
```
Mua ngày 2 (giá 98), bán ngày 3 (giá 105), lãi 7.0.

---

## Question 3
**Bối cảnh:** Mai là sinh viên FTU đam mê tài chính định lượng (quantitative finance). Bạn ấy tải về dữ liệu giao dịch hằng ngày của một cổ phiếu và muốn dùng Python để phân tích, xây chiến lược giao dịch và dự báo thị trường.
Để xây mô hình dự báo, Mai biến dữ liệu thành ma trận đặc trưng `X` và vector mục tiêu `y`. Mỗi dòng của `X` bắt đầu bằng `1.0` (hệ số chặn / intercept).

**Yêu cầu:** Viết hàm `build_matrix(records, feature_keys, target_key)`:
- Với mỗi dòng có đủ `target_key` và tất cả khóa trong `feature_keys`: thêm `[1.0] + [float(r[k]) for k in feature_keys]` vào `X`, và `float(r[target_key])` vào `y`
- Bỏ qua dòng thiếu bất kỳ khóa nào

**Trả về:** `(X, y)`

**Ví dụ:**
Đầu vào:
```python
build_matrix([{'day':1,'close':100.0,'open':99.0},{'day':2,'close':102.0,'open':100.0},
              {'day':3,'close':101.0}], ['day','open'], 'close')
```
Kết quả mong đợi:
```python
([[1.0, 1.0, 99.0], [1.0, 2.0, 100.0]], [100.0, 102.0])
```

---

## Question 4
**Bối cảnh:** Mai là sinh viên FTU đam mê tài chính định lượng (quantitative finance). Bạn ấy tải về dữ liệu giao dịch hằng ngày của một cổ phiếu và muốn dùng Python để phân tích, xây chiến lược giao dịch và dự báo thị trường.
Mai thử một cách khác để dự báo tín hiệu tăng/giảm: **k láng giềng gần nhất (k-Nearest Neighbors)**. Dựa trên các ngày trong quá khứ (đã biết tăng=1 hay giảm=0), dự đoán cho một điểm dữ liệu mới.

**Yêu cầu:** Viết hàm `knn_signal(train_X, train_y, query, k=3)`:
- `train_X`: list các vector đặc trưng; `train_y`: list nhãn 0/1; `query`: vector cần dự đoán
- Khoảng cách Euclid: `sqrt(sum((q_i - x_i)^2))`
- Sắp xếp theo (khoảng cách tăng, chỉ số tăng), lấy k điểm gần nhất
- Bỏ phiếu đa số; nếu hòa -> dự đoán 1
- `confidence = round(số_phiếu_thắng / k, 4)`

**Trả về:** `(label, confidence)`

**Ví dụ:**
Đầu vào:
```python
knn_signal([[2.0,1.0],[8.0,9.0],[3.0,2.0],[9.0,8.0],[2.5,1.5]], [0,1,0,1,0], [2.0,2.0], 3)
```
Kết quả mong đợi:
```python
(0, 1.0)
```

---

## Question 5 (Bonus)
**Bối cảnh:** Mai là sinh viên FTU đam mê tài chính định lượng (quantitative finance). Bạn ấy tải về dữ liệu giao dịch hằng ngày của một cổ phiếu và muốn dùng Python để phân tích, xây chiến lược giao dịch và dự báo thị trường.
Mai đã có chiến lược, giờ cần biết nên đặt cược **bao nhiêu phần** vốn vào mỗi lệnh. Bạn ấy dùng **tiêu chuẩn Kelly (Kelly criterion)** để tối ưu tỷ lệ vốn.

**Yêu cầu:** Viết hàm `kelly_fraction(win_prob, payoff_ratio)`:
- `p = win_prob` (xác suất thắng), `q = 1 - p` (xác suất thua)
- `b = payoff_ratio` (tỷ lệ lời/lỗ, ví dụ b=2 nghĩa là thắng được gấp 2 lần số đặt)
- Công thức Kelly: `f* = (b*p - q) / b`
- Nếu `f*` âm (không có lợi thế) -> trả về `0.0`
- Làm tròn 4dp

**Trả về:** `float`

**Ví dụ:**
Đầu vào:
```python
kelly_fraction(0.6, 2.0)
```
Kết quả mong đợi:
```python
0.4
```
Giải thích: `f* = (2*0.6 - 0.4) / 2 = 0.8 / 2 = 0.4` -> đặt 40% vốn.
