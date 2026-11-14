# TIÊU CHUẨN THIẾT KẾ & PHÁT TRIỂN GIAO DIỆN (FRONTEND GUIDELINES)

Tài liệu này quy định các nguyên tắc thiết kế giao diện (UI/UX), kiến trúc component và chuẩn hóa đa ngôn ngữ bắt buộc tuân thủ trong toàn bộ dự án **The Path of Champions Guide (LoR PoC)**.

---

## 1. NGUYÊN TẮC CỐT LÕI: THIẾT KẾ THEO COMPONENT TÁI SỬ DỤNG (REUSABLE COMPONENTS)

> **QUY TẮC BẮT BUỘC:** Tuyệt đối không viết mã giao diện dồn hết vào một file lớn (monolithic component / spaghetti JSX). Mọi phần tử giao diện từ nhỏ đến lớn đều phải được phân rã thành các **Component độc lập, có khả năng tái sử dụng cao (Reusable Components)**.

### 1.1. Tiêu chí của một Reusable Component
1. **Đơn Trách Nhiệm (Single Responsibility Principle):** Mỗi component chỉ phụ trách đúng 1 vai trò (Ví dụ: `SearchBar` chỉ xử lý input & phím tắt; `ChampionCard` chỉ hiển thị thẻ tướng; `BackgroundHero` chỉ phụ trách lớp nền & gradient).
2. **Thiết Kế Dựa Trên Props (Props-driven):** Nhận dữ liệu và callback thông qua `props` rõ ràng, có giá trị mặc định.
3. **Không Ràng Buộc Trực Tiếp Vào Dữ Liệu Cứng (Loose Coupling):** Không gọi fetch cứng hay gán ID cụ thể bên trong UI component cơ bản; logic lấy dữ liệu do Container / Page cha truyền xuống.
4. **Hỗ Trợ Forward Ref & Tùy Biến Lớp:** Các component input, dropdown hoặc container cần hỗ trợ `forwardRef` và nhận prop `className` để linh hoạt căn chỉnh khi tái sử dụng ở các ngữ cảnh khác nhau.

---

## 2. QUY CHUẨN THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVBAR SPECIFICATION)

1. **Vị trí & Bố cục:**
   * Cố định ở trên cùng (`relative z-20 w-full`), nền kính mờ `backdrop-blur-md bg-[#07090e]/40` với viền mỏng tinh tế `border-b border-white/[0.04]`.
2. **4 Mục điều hướng bắt buộc:**
   * **`Champions`** (Tiếng Việt: *Tướng*)
   * **`Relics`** (Tiếng Việt: *Cổ Vật*)
   * **`Tierlist`** (Tiếng Việt: *Bảng Xếp Hạng*)
   * **`Maps`** (Tiếng Việt: *Bản Đồ*)
3. **Khu vực điều khiển bên phải:**
   * Luôn tích hợp nút chuyển đổi ngôn ngữ nhanh (`VI | EN`).
   * Hỗ trợ responsive chuyển sang drawer menu trên thiết bị di động.

---

## 3. QUY TẮC HỆ THỐNG ĐA NGÔN NGỮ (INTERNATIONALIZATION - i18n RULES)

> **QUY TẮC BẮT BUỘC:** Web phải hỗ trợ đầy đủ 2 ngôn ngữ: **Tiếng Anh (en)** và **Tiếng Việt (vi)**.

### 3.1. Thuật toán tự động nhận diện ngôn ngữ (Auto-detection Priority)
Khi người dùng truy cập trang, hệ thống tuân thủ nghiêm ngặt thứ tự ưu tiên sau:
1. **Ưu tiên 1 (Lựa chọn đã lưu):** Đọc khóa `poc_lang` từ `localStorage`. Nếu giá trị là `'vi'` hoặc `'en'`, áp dụng ngay.
2. **Ưu tiên 2 (Ngôn ngữ trình duyệt):** Nếu chưa có thiết lập trong `localStorage`, đọc ngôn ngữ trình duyệt qua `navigator.language` hoặc `navigator.languages[0]`:
   * Nếu ngôn ngữ trình duyệt bắt đầu bằng `vi` (ví dụ: `vi`, `vi-VN`) ➔ **Mặc định là Tiếng Việt (`vi`)**.
   * Với tất cả các trường hợp còn lại ➔ **Mặc định là Tiếng Anh (`en`)**.

### 3.2. Cơ chế lưu trữ & chuyển đổi
* Nút đổi ngôn ngữ (`VI | EN`) trên Navbar cho phép chuyển đổi tức thì không cần reload trang.
* Khi đổi ngôn ngữ, giá trị mới bắt buộc phải được lưu vào `localStorage.setItem('poc_lang', lang)`.

### 3.3. Quy tắc viết mã giao diện đa ngôn ngữ
* **CẤM Hardcode văn bản:** Tuyệt đối không gán cứng chuỗi text tiếng Anh hoặc tiếng Việt vào mã JSX. Mọi văn bản hiển thị phải thông qua hàm dịch `t('section.key')` từ hook `useLanguage()`.
* **Khai thác dữ liệu hai thứ tiếng:** Với dữ liệu tướng và vật phẩm có trường dịch tiếng Anh (`translations.en`), giao diện phải tự động chuyển sang đọc bản dịch tiếng Anh khi `language === 'en'`.

---

## 4. QUY CHUẨN TAILWIND CSS & THẨM MỸ (DESIGN SYSTEM)

1. **Framework:** Sử dụng **Tailwind CSS (v4)** qua plugin `@tailwindcss/vite`.
2. **Typography:** Sử dụng phông không chân **Kanit** (nhập khẩu tại `index.css`), kiểu dáng hình học góc vát hiện đại, đậm chất gaming/action, đảm bảo 100% không vỡ font hoặc lệch dấu tiếng Việt và tiếng Anh.
3. **Bảng màu chủ đạo (Color Palette):**
   * Nền tối Obsidian: `#07090e`
   * Ánh sáng Shurima Gold: `#e6b758` (chữ nhấn, viền avatar, cấp sao)
   * Hiệu ứng Arcane Cyan: `#38bdf8` (viền sáng tìm kiếm, focus, icon)
   * Nền kính mờ (Glassmorphism): `bg-[#0e121c]/65 backdrop-blur-2xl`
4. **Triết lý Tối Giản (Minimalism & Focus):** Loại bỏ toàn bộ các câu chữ quảng cáo vô nghĩa, link chết hoặc huy hiệu thừa thãi. Mọi chi tiết trên màn hình phải phục vụ mục tiêu tra cứu dữ liệu nhanh và chính xác nhất.

---

## 5. QUY CHUẨN 3 BREAKPOINTS RESPONSIVE BẮT BUỘC (MOBILE, TABLET, PC)

> **QUY TẮC BẮT BUỘC:** Toàn bộ giao diện hệ thống phải tuân thủ nghiêm ngặt **3 mốc Responsive Breakpoint cốt lõi**. Khi thiết kế component mới hoặc sửa giao diện hiện có, tuyệt đối không tạo thêm breakpoint tùy tiện gây vỡ layout.

### 5.1. Bảng Quy chuẩn 3 Mốc Breakpoint

| Thiết bị | Breakpoint Tailwind | Kích thước màn hình | Lưới thẻ bài (Grid Columns) | Quy chuẩn bố cục & Trải nghiệm |
| :--- | :--- | :--- | :--- | :--- |
| 📱 **1. Mobile** | Base (mặc định) | `< 640px` | `grid-cols-2` (2 cột) | * Giảm mốc mobile về đúng kích thước smartphone thực tế.<br>* Thẻ bài nhỏ gọn, dọc vừa tầm tay lướt.<br>* Bộ lọc trượt ngang mượt mà (`overflow-x-auto`).<br>* Navbar dạng Drawer trượt.<br>* Padding: `px-3 py-4`. |
| 📟 **2. Tablet** *(Khoảng giữa)* | `sm:` / `md:` / `lg:` | `640px` – `1279px` | `sm:grid-cols-3` / `lg:grid-cols-4` (3–4 cột) | * Vừa vặn cho iPad mini, iPad Pro, tablet ngang & laptop nhỏ.<br>* 24 thẻ chia đều thành 8 hàng (3 cột) hoặc 6 hàng (4 cột).<br>* Navbar hiển thị đầy đủ các tabs.<br>* Padding: `px-5 py-6`. |
| 💻 **3. PC / Desktop** | `xl:` | `≥ 1280px` | `xl:grid-cols-6` (6 cột) | * Tăng mốc PC lên `≥ 1280px` để đảm bảo layout 6 cột rộng rãi, không bị bóp nghẹt thẻ bài.<br>* 24 thẻ chia đều thành đúng 4 hàng hoàn hảo.<br>* Bố cục trung tâm `max-w-7xl mx-auto px-8`.<br>* Hiệu ứng hover 3D, glow viền vàng Shurima & phím tắt `Ctrl K`. |

### 5.2. Nguyên tắc đồng bộ với phân trang (24 items/page)
* Con số phân trang chuẩn **24** chia hết hoàn hảo cho:
  - `2` (Mobile `< 640px`): Đủ 12 hàng.
  - `3` (Tablet dọc `640px - 1023px`): Đủ 8 hàng.
  - `4` (Tablet ngang / Laptop `1024px - 1279px`): Đủ 6 hàng.
  - `6` (PC Desktop `≥ 1280px`): Đủ 4 hàng.
* Đảm bảo ở mọi breakpoint, hàng thẻ cuối cùng **không bao giờ bị khuyết hoặc đơn độc 1 thẻ**, tạo cảm giác chuyên nghiệp và chỉn chu tuyệt đối.

---

## 6. QUY CHUẨN TÌM KIẾM & BỘ LỌC TOÀN HỆ THỐNG (SEARCH & RANKING STANDARD)

> **QUY TẮC BẤT BIẾN TỪ ĐÂY VỀ SAU:** Tất cả các thanh tìm kiếm (Search Bar, Search Input, Autocomplete, Dropdown, Menu Kéo Thả, Bảng Quản Trị Admin, và Backend APIs) trên toàn bộ hệ thống bắt buộc phải áp dụng chuẩn thuật toán tìm kiếm và xếp hạng đồng nhất:

### 6.1. Khử Dấu Tiếng Việt Toàn Diện (100% Accent-Insensitive)
* Bắt buộc sử dụng hàm chuẩn hóa Unicode NFD kết hợp khử riêng ký tự `đ / Đ` thành `d`:
  ```javascript
  const removeVietnameseTones = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .trim();
  };
  ```
* **Mục tiêu:** Người dùng gõ có dấu hay không dấu (ví dụ: `guom` hay `gươm`, `doan` hay `đoàn`, `sieu` hay `siêu`) đều phải tìm ra kết quả chính xác 100%.

### 6.2. Tra Cứu Song Ngữ Tiếng Anh & Tiếng Việt (Bilingual Matching)
* Mọi thực thể trong hệ thống phải được đối chiếu đồng thời trên cả 3 trường dữ liệu:
  1. Tên Tiếng Việt (`item.name` hoặc `item.cardName`)
  2. Tên Tiếng Anh (`item.translations.en.name` hoặc `item.enName`)
  3. Mã định danh / Code (`championID`, `relicCode`, `powerCode`, `itemCode`, `cardCode`)
* **Ví dụ:** Gõ `stalker` hoặc `blade` phải tìm thấy ngay **Gươm Truy Tung** *(Stalker's Blade)*; gõ `R0080` cũng tìm ra **Gươm Truy Tung**.

### 6.3. Thuật Toán Xếp Hạng Ưu Tiên (Relevance Scoring & Càng Ngắn Lên Đầu)
Kết quả tìm kiếm không được sắp xếp ngẫu nhiên hay phụ thuộc vào thứ tự file JSON thô, mà bắt buộc phải qua bộ lọc tính điểm:
1. **Khớp chính xác hoàn toàn (Exact Match):** `10,000 điểm` (Tên trùng khít từ khóa gõ).
2. **Khớp tiền tố (Prefix Match):** `6,000 điểm` (Tên bắt đầu bằng từ khóa gõ).
3. **Khớp đầu một từ (Word Boundary Match):** `3,500 điểm` (Từ khóa khớp ngay đầu bất kỳ từ nào, ví dụ: gõ `truy` khớp đầu từ `Truy` trong `Gươm Truy Tung`).
4. **Khớp chuỗi con (Substring Match):** `1,500 điểm` (Từ khóa xuất hiện ở bất kỳ vị trí nào bên trong chuỗi).
5. **QUY TẮC VÀNG: Càng ít chữ càng ngắn -> Càng được ưu tiên lên đầu:**
   * Áp dụng công thức trừ điểm phạt theo độ dài (Length Penalty):
     $$\text{Length Penalty} = (\text{Số ký tự} \times 4) + (\text{Số từ} \times 20)$$
   * **Hiệu quả thực tế:** Khi cùng khớp từ khóa `gươm`:
     - 🥇 **Gươm Truy Tung** (14 ký tự, 3 từ) $\rightarrow$ Đạt điểm cao nhất, xếp trên cùng.
     - 🥈 **Gươm Báu Của Kẻ Đoạt Mạng Runeterra** (35 ký tự, 7 từ) $\rightarrow$ Bị phạt độ dài, xếp phía sau.

### 6.4. Vị Trí Bắt Buộc Áp Dụng Toàn Bộ Dự Án
1. **Thanh Tìm Kiếm Toàn Cục (OmniSearch / Navbar / HomeView):** Gõ tìm kiếm tức thời trên trang chủ.
2. **Kho Cổ Vật, Sức Mạnh, Vật Phẩm, Thẻ Bài, Phiêu Lưu (`UniversalCatalogView.jsx`):** Tìm kiếm và lọc theo danh mục.
3. **Danh Sách Tướng (`ChampionRoster.jsx` & Backend `champion.service.js`):** Tìm kiếm tướng trên trang chính.
4. **Trang Quản Trị CMS (`AdminView.jsx`):** Tất cả các ô tìm kiếm Tướng, Cổ Vật, Sức Mạnh, v.v.
5. **Menu Kéo Thả Admin (`DropDragSidePanel.jsx`):** Tra cứu nhanh để kéo thả trang bị vào tướng.
6. **Bộ Soạn Thảo Rich Markup (`RichMarkupTextarea.jsx`):** Popup gợi ý khi gõ ký tự `@`.
7. **Toàn bộ Backend APIs (`search.service.js` & các service liên quan):** Đồng bộ 100% chuẩn tính điểm với Frontend.

