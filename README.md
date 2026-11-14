# ThePathOfChampionGuideV2

Dự án Full-stack kết hợp giữa **Frontend (Vite + React JS)** và **Backend (Express RESTful API)**.

---

## 📁 Cấu Trúc Dự Án (Architecture)

```text
ThePathOfChampionGuideV2/
├── FRONTEND_GUIDELINES.md      # Quy chuẩn thiết kế Reusable Component & Tailwind CSS
├── client/                     # Frontend (Vite + React JS + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/         # Hệ thống Reusable Components
│   │   │   ├── BackgroundHero.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── TagList.jsx
│   │   │   ├── SearchDropdown.jsx
│   │   │   ├── ChampionCard.jsx
│   │   │   └── ChampionModal.jsx
│   │   ├── App.jsx             # Trang chủ ghép nối các component
│   │   ├── index.css           # Cấu hình Tailwind CSS v4 & Font Be Vietnam Pro
│   │   └── main.jsx
│   ├── vite.config.js          # Cấu hình plugin @tailwindcss/vite & proxy
│   └── package.json
│
├── server/                     # Backend (Express RESTful API)
│   ├── src/
│   │   ├── config/             # Cấu hình môi trường (env.js)
│   │   ├── controllers/        # Điều hướng request/response RESTful
│   │   ├── middlewares/        # Xử lý lỗi tập trung & 404 handler
│   │   ├── routes/             # Định tuyến API (tách theo resource)
│   │   ├── services/           # Nghiệp vụ xử lý dữ liệu (Business logic)
│   │   ├── app.js              # Cấu hình middleware Express & gom routes
│   │   └── server.js           # Khởi động server
│   ├── .env                    # Biến môi trường (PORT=5001, CLIENT_URL)
│   └── package.json
│
└── package.json                # Root scripts hỗ trợ chạy nhanh
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Khởi Động Backend (Express API)
```bash
# Cách 1: Chạy từ thư mục gốc
npm run server

# Cách 2: Vào thư mục server
cd server
npm run dev
```
> Server sẽ chạy tại: `http://localhost:5000`  
> Base API: `http://localhost:5000/api/v1`

### 2. Khởi Động Frontend (Vite React)
Mở một terminal khác và chạy:
```bash
# Cách 1: Chạy từ thư mục gốc
npm run client

# Cách 2: Vào thư mục client
cd client
npm run dev
```
> Frontend sẽ chạy tại: `http://localhost:5173`

---

## 📡 Danh Sách Endpoint RESTful Chuẩn (Demo Resource: `/api/v1/champions`)

| Phương Thức (Method) | Endpoint | Mô Tả | Status Code Thành Công |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Kiểm tra trạng thái server | `200 OK` |
| **GET** | `/api/v1/champions` | Lấy danh sách champion | `200 OK` |
| **GET** | `/api/v1/champions/:id` | Lấy chi tiết champion theo ID | `200 OK` / `404 Not Found` |
| **POST** | `/api/v1/champions` | Tạo mới champion | `201 Created` / `400 Bad Request` |
| **PUT** | `/api/v1/champions/:id` | Cập nhật thông tin champion | `200 OK` / `404 Not Found` |
| **DELETE** | `/api/v1/champions/:id` | Xóa champion | `204 No Content` / `404 Not Found` |
