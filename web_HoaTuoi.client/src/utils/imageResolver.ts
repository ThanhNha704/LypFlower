/**
 * imageResolver.ts
 * Convert đường dẫn ảnh từ DB -> ảnh trong assets
 */

import imageMap from "../assets/imageMap"

/**
 * Resolve ảnh sản phẩm
 */

export function resolveImage(
    dbPath?: string | null,
    fallback?: string
): string {

    if (!dbPath)
        return fallback ?? "https://placehold.co/600x600?text=Flower"

    // Nếu là URL ngoài hoặc Base64 data URL
    if (dbPath.startsWith("http") || dbPath.startsWith("data:"))
        return dbPath

    // Lấy tên file
    const fileName = dbPath.split("/").pop()

    if (!fileName)
        return fallback ?? dbPath

    // Map sang assets
    return imageMap[fileName] ?? fallback ?? dbPath
}


/**
 * Resolve ảnh category theo sortOrder
 */

export function resolveCatImageBySortOrder(sortOrder: number): string {

    const catImages: Record<number, string> = {

        1: imageMap["gh1.jpg"],     // giỏ hoa
        2: imageMap["ctc1.jpg"],    // cẩm tú cầu
        3: imageMap["hc1.jpg"],     // hoa cưới
        4: imageMap["hh1.jpg"],     // hoa hồng
        5: imageMap["hhd1.jpg"],    // hướng dương
        6: imageMap["tl1.jpg"],     // tulip
        7: imageMap["l2.jpg"],      // lan
        8: imageMap["vh1.jpg"]      // vali hoa

    }

    return catImages[sortOrder] ??
        "https://placehold.co/400x300?text=Flower"
}