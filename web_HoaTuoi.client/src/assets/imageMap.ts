type ImageMap = Record<string, string>

const allImages = import.meta.glob("./*/*.{png,jpg,jpeg,webp}", {
    eager: true,
    import: "default"
}) as Record<string, string>;

function loadImages(targetFolder: string): ImageMap {
    const map: ImageMap = {}
    // targetFolder looks like "./hoahong"
    const prefix = targetFolder + "/";
    Object.entries(allImages).forEach(([filePath, img]) => {
        if (filePath.startsWith(prefix)) {
            const fileName = filePath.split("/").pop()
            if (fileName) {
                map[fileName] = img
            }
        }
    });
    return map
}

export const hoaHongImages = loadImages("./hoahong")
export const tulipImages = loadImages("./hoatulip")
export const huongDuongImages = loadImages("./hoahuongduong")
export const camTuCauImages = loadImages("./hoacamtucau")
export const hoaCuoiImages = loadImages("./hoacuoi")
export const gioHoaImages = loadImages("./giohoa")
export const lanImages = loadImages("./lan")
export const valiHoaImages = loadImages("./valihoa")

const imageMap: ImageMap = {
    ...hoaHongImages,
    ...tulipImages,
    ...huongDuongImages,
    ...camTuCauImages,
    ...hoaCuoiImages,
    ...gioHoaImages,
    ...lanImages,
    ...valiHoaImages
}

export default imageMap