// src/components/product/ProductGallery.jsx
// Thư viện ảnh sản phẩm cho shop hoa tươi

import { useState } from "react";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";
import { resolveImage } from "../../utils/imageResolver";

const FALLBACK_IMG = "https://placehold.co/800x800/f8c8dc/333?text=Flower";

/**
 * @param {{
 *   mainImageUrl: string,
 *   subImages: {url:string,altText?:string,sortOrder?:number}[],
 *   productName: string
 * }} props
 */

export default function ProductGallery({
    mainImageUrl,
    subImages = [],
    productName
}) {

    const allImages = [
        { url: resolveImage(mainImageUrl, FALLBACK_IMG), altText: productName },
        ...subImages.map(img => ({
            ...img,
            url: resolveImage(img.url, FALLBACK_IMG)
        }))
    ];

    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const active = allImages[activeIndex];

    const prev = () =>
        setActiveIndex(i => (i - 1 + allImages.length) % allImages.length);

    const next = () =>
        setActiveIndex(i => (i + 1) % allImages.length);

    return (
        <div className="flex flex-col gap-3">

            {/* Ảnh chính */}
            <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-pink-50 cursor-zoom-in group"
                onClick={() => setLightboxOpen(true)}
            >

                <img
                    src={active.url}
                    alt={active.altText ?? productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={e => (e.currentTarget.src = FALLBACK_IMG)}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />

                {/* nút zoom */}
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn size={12} />
                    Phóng to
                </span>

                {/* dots */}
                {allImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">

                        {allImages.map((_, i) => (
                            <button
                                key={i}
                                onClick={e => {
                                    e.stopPropagation();
                                    setActiveIndex(i);
                                }}
                                className={`h-1.5 rounded-full transition-all
                ${i === activeIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`}
                            />
                        ))}

                    </div>
                )}
            </div>

            {/* thumbnails */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">

                    {allImages.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition
              ${i === activeIndex
                                    ? "border-pink-500 shadow-md"
                                    : "border-gray-200 hover:border-pink-300"
                                }`}
                        >

                            <img
                                src={img.url}
                                alt={img.altText ?? `Ảnh ${i + 1}`}
                                className="w-full h-full object-cover"
                            />

                        </button>
                    ))}

                </div>
            )}

            {/* LIGHTBOX */}
            {lightboxOpen && (

                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >

                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] px-12"
                        onClick={e => e.stopPropagation()}
                    >

                        <img
                            src={active.url}
                            alt={active.altText ?? productName}
                            className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto"
                        />

                        {/* prev */}
                        <button
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {/* next */}
                        <button
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* close */}
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow"
                        >
                            <X size={16} />
                        </button>

                        {/* dots */}
                        <div className="flex justify-center gap-1 mt-4">

                            {allImages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIndex(i)}
                                    className={`h-2 rounded-full transition
                  ${i === activeIndex ? "bg-white w-6" : "bg-white/40 w-2"}`}
                                />
                            ))}

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}