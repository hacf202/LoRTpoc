# QUY TẮC PHÁT TRIỂN DỰ ÁN (PROJECT CORE RULES)
*Legends of Runeterra: The Path of Champions Guide (LoR PoC Guide)*

Tài liệu này xác lập các **quy tắc kiến trúc và tiêu chuẩn kỹ thuật bắt buộc (Non-negotiable Rules)** áp dụng xuyên suốt toàn bộ dự án từ đây về sau.

---

## 1. TIÊU CHUẨN TÌM KIẾM, GỢI Ý & BỘ LỌC TOÀN HỆ THỐNG (SEARCH & RANKING STANDARD)

Mọi thanh tìm kiếm, input filter, dropdown tự động điền (autocomplete), bảng quản trị admin, menu kéo thả và API backend đều phải tuân thủ nghiêm ngặt 4 nguyên tắc sau:

### 1. Khử Dấu Tiếng Việt Toàn Diện (100% Accent-Insensitive)
* Bắt buộc sử dụng hàm chuẩn hóa NFD + khử riêng `đ / Đ` thành `d`:
  ```javascript
  import { removeVietnameseTones, rankSearchResults } from './utils/searchUtils.js';
  ```
* Người dùng gõ không dấu hay có dấu đều phải tìm ra kết quả chính xác (ví dụ: `guom` $\rightarrow$ `Gươm Truy Tung`, `doan` $\rightarrow$ `Đoạt Mệnh`, `sieu` $\rightarrow$ `Siêu Năng Lượng`).

### 2. Tra Cứu Song Ngữ Tiếng Anh & Tiếng Việt (Bilingual Matching)
* Đối chiếu song song cả 3 trường dữ liệu:
  - Tên tiếng Việt (`item.name` / `item.cardName`)
  - Tên tiếng Anh (`item.translations.en.name` / `item.enName`)
  - Mã định danh / Code (`championID`, `relicCode`, `powerCode`, `itemCode`, `cardCode`)
* Cho phép người dùng gõ từ khóa tiếng Anh (ví dụ: `stalker`, `archangel`, `ludens`) để tìm ngay ra trang bị tương ứng.

### 3. Thuật Toán Xếp Hạng Ưu Tiên (Relevance Scoring)
Kết quả tìm kiếm phải được chấm điểm theo độ tương thích:
- **10,000 điểm:** Khớp chính xác hoàn toàn (Exact Match).
- **6,000 điểm:** Khớp tiền tố (Prefix Match - Bắt đầu bằng từ khóa).
- **3,500 điểm:** Khớp đầu từ (Word Boundary Match - Ví dụ gõ `truy` khớp chữ `Truy` trong `Gươm Truy Tung`).
- **1,500 điểm:** Khớp chuỗi con ở bất kỳ vị trí nào (Substring Match).

### 4. QUY TẮC VÀNG: Càng Ít Chữ Càng Ngắn Lên Đầu (Length Penalty)
* Khi nhiều mục cùng khớp một từ khóa, mục có tên ngắn gọn hơn sẽ luôn được ưu tiên xếp trên cùng.
* Công thức tính điểm phạt độ dài:
  $$\text{Length Penalty} = (\text{Chiều dài chuỗi} \times 4) + (\text{Số lượng từ} \times 20)$$
* Ví dụ khi gõ `gươm`:
  - 🥇 **Gươm Truy Tung** *(ngắn gọn)* $\rightarrow$ Xếp hạng #1.
  - 🥈 **Gươm Báu Của Kẻ Đoạt Mạng Runeterra Biến Dị** *(dài)* $\rightarrow$ Xếp hạng sau.

### 5. Tiện Ích Dùng Chung (Centralized Utility)
- Frontend: [`client/src/utils/searchUtils.js`](file:///d:/ThePathOfChampionGuideV2/client/src/utils/searchUtils.js)
- Backend: [`server/src/utils/searchUtils.js`](file:///d:/ThePathOfChampionGuideV2/server/src/utils/searchUtils.js)
- Tuyệt đối không tự viết thuật toán tìm kiếm phân mảnh hoặc lặp lại ở từng component riêng lẻ.

---

## 2. QUY CHUẨN GIAO DIỆN & RESPONSIVE (3-BREAKPOINT RULE)
- **Mobile (`< 640px`):** 2 cột (`grid-cols-2`), drawer menu trượt, padding nhỏ gọn.
- **Tablet (`640px - 1279px`):** 3-4 cột (`sm:grid-cols-3` / `lg:grid-cols-4`).
- **PC Desktop (`≥ 1280px`):** 6 cột (`xl:grid-cols-6`), căn giữa container `max-w-7xl mx-auto px-8`.
- Phân trang chuẩn 24 phần tử/trang chia hết cho 2, 3, 4, 6 để không bao giờ bị khuyết thẻ bài ở hàng cuối.
