# 🌸 Lyp Flower - Website Bán Hoa Tươi Tích Hợp AI & Data Warehouse (DWH)

Đồ án chuyên đề website bán hoa tươi Lyp Flower tích hợp trợ lý ảo tư vấn thông minh (RAG AI Chatbot) và kho dữ liệu phân tích kinh doanh (Data Warehouse - ETL).

---

## 🚀 Hướng dẫn khởi chạy & cấu hình dự án

Để thiết lập dự án trên máy tính của bạn hoặc các thành viên trong nhóm, vui lòng xem chi tiết hướng dẫn từng bước tại:
👉 **[HƯỚNG DẪN CLONE DỰ ÁN CHI TIẾT (HUONG_DAN_CLONE.md)](./HUONG_DAN_CLONE.md)**

### 💡 Lưu ý quan trọng cho các thành viên trong nhóm:
1. **Database:** CSDL giao dịch chính (`WebHoaTuoiDb`) và Kho dữ liệu (`HoaTuoi_DWH`) sẽ **tự động khởi tạo và nạp dữ liệu sạch** khi bạn khởi chạy Backend lần đầu tiên (thông qua tệp sql backup `sql_data/webhoatuoidb_data.sql`).
2. **AI Chatbot:** Do các mã khoá bảo mật nằm trong danh sách `.gitignore`, bạn cần **tạo thủ công tệp `.env.local`** đặt tại thư mục **`Web_HoaTuoi.Server/`** và điền đầy đủ các thông tin:
   * `GEMINI_API_KEY`: API Key kết nối với Google Gemini.
   * `MONGO_CONNECTION_STRING`: Đường dẫn kết nối tới MongoDB Atlas Vector Search.
   *(Có thể sao chép từ tệp mẫu `Web_HoaTuoi.Server/.env.example`)*
