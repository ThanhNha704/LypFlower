/**
 * format.ts
 * Các hàm định dạng dùng chung cho web bán hoa
 */


/** Định dạng tiền VNĐ: 1500000 → "1.500.000 ₫" */
export function formatVnd(amount: number | string): string {
    const value = typeof amount === "string" ? Number(amount) : amount;

    if (!value) return "0 ₫";

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(value);
}


/** Định dạng ngày: "2024-01-15" → "15/01/2024" */
export function formatDate(date: string | Date): string {

    if (!date) return "";

    const d = typeof date === "string" ? new Date(date) : date;

    return d.toLocaleDateString("vi-VN");
}


/** Định dạng ngày + giờ (dùng cho đơn hàng giao hoa) */
export function formatDateTime(date: string | Date): string {

    if (!date) return "";

    const d = typeof date === "string" ? new Date(date) : date;

    return d.toLocaleString("vi-VN");
}