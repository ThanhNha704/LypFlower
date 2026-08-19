import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resolveImage } from "../utils/imageResolver";
import apiClient from "../api/client";

export default function SemanticSearch() {
  const [query, setQuery] = useState(
    () => sessionStorage.getItem("search_query") || ""
  );
  const [results, setResults] = useState(() => {
    const savedResults = sessionStorage.getItem("search_results");
    return savedResults ? JSON.parse(savedResults) : [];
  });
  const [aiResponse, setAiResponse] = useState(
    () => sessionStorage.getItem("search_ai_response") || ""
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(
    () => sessionStorage.getItem("has_searched") === "true"
  );

  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem("search_query", query);
    sessionStorage.setItem("search_results", JSON.stringify(results));
    sessionStorage.setItem("search_ai_response", aiResponse);
    sessionStorage.setItem("has_searched", hasSearched.toString());
  }, [query, results, aiResponse, hasSearched]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanedQuery = query.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    if (!cleanedQuery) return;

    setLoading(true);
    setErrorMessage("");
    setHasSearched(true);
    setAiResponse("");

    try {
      const res = await apiClient.post("/Search/semantic-search", {
        query: cleanedQuery,
      });

      const data = res.data;
      setResults(data.data || []);
      setAiResponse(data.aiResponse || "");
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      const msg = error.response?.data?.message || error.message || "Không thể kết nối đến máy chủ Backend.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 font-sans dark:text-gray-200">
      {/* Khung tìm kiếm ngữ nghĩa Lyp AI */}
      <div className="text-center mb-8 max-w-2xl mx-auto mt-4">
        <div className="w-20 h-20 bg-gradient-to-tr from-pink-300 to-pink-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-md border-4 border-white animate-bounce">
          🌸
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-gray-100 mb-2.5">
          Xin chào, tôi là Lyp AI 🌸
        </h1>
        <p className="text-pink-600 dark:text-pink-400 text-sm md:text-base mb-5 bg-pink-50 dark:bg-pink-900/30 inline-block px-5 py-2.5 rounded-full border border-pink-100 dark:border-pink-800 shadow-sm font-medium">
          Hãy cho tôi biết bạn muốn tặng hoa cho ai, tôi sẽ giúp bạn chọn bó hoa phù hợp nhất.
        </p>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row justify-center gap-2.5 max-w-2xl mx-auto w-full px-2"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ví dụ: Tôi muốn mua hoa tặng sinh nhật mẹ dưới 500k..."
              className="w-full px-6 py-4 rounded-full border-2 border-pink-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] focus:border-pink-500 focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-900/50 outline-none text-base text-gray-700 dark:text-gray-200 shadow-sm transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-full text-base cursor-pointer transition-all duration-300 w-full sm:w-auto justify-center shrink-0 shadow-md flex items-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin text-xl">🌸</span> Đang suy nghĩ...
              </>
            ) : (
              "Gửi yêu cầu ✨"
            )}
          </button>
        </form>

        {errorMessage && (
          <p className="text-red-600 mt-4 text-sm font-bold bg-red-50 py-2 px-4 rounded-xl border border-red-200 inline-block">
            ⚠️ {errorMessage}
          </p>
        )}
      </div>

      {/* Hiển thị câu trả lời và tư vấn thông minh từ AI (Gemini) */}
      {!loading && aiResponse && (
        <div className="bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-100 dark:border-pink-800/50 rounded-3xl p-5 md:p-6 mb-10 flex items-start gap-4 shadow-sm relative">
          <div className="w-12 h-12 bg-white dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-2xl shadow-sm border border-pink-100 dark:border-pink-800 shrink-0">
            🌸
          </div>
          <div>
            <div className="font-bold text-pink-600 dark:text-pink-400 text-sm tracking-wider uppercase mb-1.5 flex items-center gap-2">
              Lyp AI Trả lời ✨
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              {aiResponse}
            </div>
          </div>
        </div>
      )}

      {/* Trạng thái tải dữ liệu giả lập (Skeleton Loading) khi đang tìm kiếm */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-4 space-y-3 animate-pulse"
            >
              <div className="bg-gray-200 dark:bg-slate-800 h-60 rounded-xl w-full"></div>
              <div className="bg-gray-200 dark:bg-slate-800 h-4 rounded w-3/4 mx-auto"></div>
              <div className="bg-gray-200 dark:bg-slate-800 h-4 rounded w-1/2 mx-auto"></div>
              <div className="bg-gray-200 dark:bg-slate-800 h-10 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Hiển thị thông báo khi không tìm thấy kết quả phù hợp */}
      {!loading && hasSearched && results.length === 0 && !errorMessage && (
        <div className="text-center text-gray-500 dark:text-gray-400 my-10 py-8 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-slate-800 max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Không tìm thấy bó hoa phù hợp với mô tả của bạn.
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Hãy thử mô tả lại theo cách khác hoặc dùng các từ khóa gợi ý như{" "}
            <span className="text-pink-600 dark:text-pink-400 font-medium">
              "hoa hồng đỏ", "hoa sinh nhật"
            </span>
            ...
          </p>
        </div>
      )}

      {/* Danh sách kết quả sản phẩm hoa tươi tương đồng tìm được */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((product) => {
            const displayPrice =
              product.salePrice > 0 ? product.salePrice : product.price;
            const hasSale =
              product.salePrice > 0 && product.salePrice < product.price;
            const productDetailLink = `/hoa/${product.slug}`;
            const imageSrc = resolveImage(
              product.mainImageUrl || product.imageUrl
            );
            const matchScore = product.score
              ? (product.score * 100).toFixed(1)
              : null;

            return (
              <div
                key={product.id || product.productId}
                className="group bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-xs hover:shadow-lg border border-gray-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between pb-4"
              >
                <div>
                  {/* Khung Ảnh */}
                  <div className="relative overflow-hidden aspect-square bg-gray-50 dark:bg-slate-800">
                    <Link to={productDetailLink} className="block w-full h-full">
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Badge Giảm Giá */}
                    {hasSale && (
                      <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-xs">
                        -
                        {Math.round(
                          ((product.price - product.salePrice) /
                            product.price) *
                            100
                        )}
                        %
                      </div>
                    )}
                  </div>

                  {/* Thông Tin */}
                  <div className="pt-4 px-4 text-center">
                    <Link
                      to={productDetailLink}
                      className="block group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"
                    >
                      <h3 className="text-base font-bold text-slate-800 dark:text-gray-200 line-clamp-1 mb-2">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mb-2 flex items-center justify-center gap-2">
                      <span className="text-pink-600 font-bold text-lg">
                        {Number(displayPrice).toLocaleString("vi-VN")} đ
                      </span>
                      {hasSale && (
                        <span className="text-gray-400 line-through text-xs">
                          {Number(product.price).toLocaleString("vi-VN")} đ
                        </span>
                      )}
                    </div>

                    {matchScore && (
                      <div className="text-xs text-gray-500">
                        Độ tương đồng:{" "}
                        <span className="text-emerald-600 font-bold">
                          {matchScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nút Xem Chi Tiết */}
                <div className="px-4 mt-4">
                  <button
                    onClick={() => navigate(productDetailLink)}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors duration-200"
                  >
                    XEM CHI TIẾT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}