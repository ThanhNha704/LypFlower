# HƯỚNG DẪN CLONE DỰ ÁN VÀ KHỞI CHẠY (TỰ ĐỘNG KHÔI PHỤC DỮ LIỆU)

Dự án đã được tích hợp cơ chế **tự động phục hồi cơ sở dữ liệu (Auto-Seeding & Auto-ETL)**. Khi clone về và khởi chạy lần đầu tiên, hệ thống sẽ tự tạo CSDL giao dịch (`WebHoaTuoiDb`), tự nạp toàn bộ sản phẩm/đơn hàng gốc, tự tạo Kho dữ liệu (`HoaTuoi_DWH`) và tự chạy tiến trình phân tích ETL.

Dưới đây là các bước chi tiết để các thành viên trong nhóm thiết lập dự án:

---

## BƯỚC 1: TẢI MÃ NGUỒN (CLONE)
Mở terminal (Git Bash hoặc CMD) trên máy của bạn và chạy lệnh clone trực tiếp nhánh nâng cấp:
```bash
git clone -b upgrade-admin-dwh-ai https://github.com/Lyphan04/Cd1-web-hoa-.git
cd Cd1-web-hoa-/Web_HoaTuoi
```
*(Nếu bạn đã clone dự án từ trước, hãy chạy `git fetch origin` rồi `git checkout upgrade-admin-dwh-ai` để chuyển sang nhánh mới nhất)*.

---

## BƯỚC 2: THIẾT LẬP FILE .env.local (Bắt buộc cho Database và AI Chatbot)
Vì các khoá API bảo mật và chuỗi kết nối cục bộ của bạn (`.env.local`) nằm trong danh sách `.gitignore` để tránh rò rỉ mã nguồn lên GitHub, bạn cần thiết lập tệp này thủ công:

1. Copy tệp mẫu **`Web_HoaTuoi.Server/.env.example`** thành **`.env.local`** (hoặc tạo một file mới đặt tên là `.env.local` tại thư mục **`Web_HoaTuoi.Server/`**).
2. Mở file `.env.local` ra và điền các thông tin kết nối cục bộ của máy bạn:
```env
# 1. Đường dẫn SQL Server cục bộ trên máy bạn (Hệ thống tự động suy luận ra Database DWH từ chuỗi này)
SQL_CONNECTION_STRING="Server=YOUR_SQL_SERVER_NAME;Database=WebHoaTuoiDb;Trusted_Connection=True;TrustServerCertificate=True"

# 2. Chuỗi kết nối MongoDB Atlas phục vụ Vector Database Search
MONGO_CONNECTION_STRING="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxxx.mongodb.net/?appName=Cluster0"

# 3. Gemini API Key phục vụ Trợ lý Tư vấn AI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# 4. OpenAI API Key (Nếu có cấu hình thêm OpenAI)
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"
```
* **Lưu ý đặc biệt:** Thay `YOUR_SQL_SERVER_NAME` bằng tên instance SQL Server cục bộ của bạn (ví dụ: `localhost\SQLEXPRESS` hoặc `.` hoặc `DESKTOP-ABCXYZ`).
* **Tại sao không cần sửa `appsettings.json`?** Hệ thống đã được lập trình động. Khi bạn điền `SQL_CONNECTION_STRING` vào `.env.local`, backend sẽ tự động kết nối đến cơ sở dữ liệu chính của bạn và tự động tạo kho dữ liệu phân tích `HoaTuoi_DWH` song song mà không cần bạn phải can thiệp sửa tệp `appsettings.json` công khai.

---

## BƯỚC 3: CÀI ĐẶT THƯ VIỆN & CHẠY FRONTEND
Mở terminal trong thư mục `web_HoaTuoi.client` và chạy các lệnh sau:
```bash
cd web_HoaTuoi.client
npm install
npm run dev
```
Giao diện người dùng sẽ chạy tại địa chỉ mặc định: `http://localhost:5173`.

---

## BƯỚC 4: KHỞI CHẠY BACKEND (HỆ THỐNG TỰ ĐỘNG NẠP DỮ LIỆU)
Mở một cửa sổ terminal khác trong thư mục `Web_HoaTuoi.Server` và chạy lệnh:
```bash
cd Web_HoaTuoi.Server
dotnet run
```
Khi chạy lệnh này, Backend sẽ thực hiện tự động các quy trình sau:
1. **Dựng CSDL OLTP:** Áp dụng các file Migration để tạo cấu trúc bảng cho `WebHoaTuoiDb`.
2. **Khôi phục dữ liệu gốc:** Tự động phát hiện file sao lưu dữ liệu `sql_data/webhoatuoidb_data.sql` và nạp toàn bộ danh mục, sản phẩm, 5000 đơn hàng, reviews vào `WebHoaTuoiDb`.
3. **Dựng CSDL DWH:** Tự động tạo cơ sở dữ liệu phân tích `HoaTuoi_DWH`, tạo các bảng chiều/sự kiện (`Dim_Customer`, `Dim_Product`, `Dim_Time`, `Fact_Sales`) và cài đặt Stored Procedure `sp_ETL_Load_HoaTuoi_DWH`.
4. **Kích hoạt ETL:** Gọi thực thi ETL chuyển giao dịch sang kho dữ liệu để sẵn sàng hiển thị Dashboard báo cáo.

---

## TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM
Hệ thống sau khi nạp tự động sẽ có sẵn các tài khoản quản trị và khách hàng:
* **Tài khoản Admin (Quản trị viên):**
  * Email: `admin@hoatuoi.vn`
  * Mật khẩu: `00000000` (8 số 0)
* **Tài khoản Staff (Nhân viên giao hàng):**
  * Email: `staff@hoatuoi.vn`
  * Mật khẩu: `00000000`
* **Thông tin thanh toán VietQR ngân hàng MBBANK:**
  * Chủ tài khoản: `NGUYEN TRONG HUNG`
  * Ngân hàng: `MBBANK`
