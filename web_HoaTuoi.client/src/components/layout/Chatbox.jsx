import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Send, X, ChevronDown, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import apiClient from "../../api/client";
import { resolveImage } from "../../utils/imageResolver";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [greeting, setGreeting] = useState("Xin chào! Lyp AI có thể giúp gì cho bạn hôm nay?");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const user = useAuthStore(state => state.user);

  const [sessionId, setSessionId] = useState(() => {
    return sessionStorage.getItem("lyp_chat_session_id") || "";
  });

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // 1. Tải cấu hình Chatbot khi mount
  useEffect(() => {
    apiClient.get("/chat/config")
      .then((res) => {
        setEnabled(res.data.enabled !== false);
        if (res.data.greeting) {
          setGreeting(res.data.greeting);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải cấu hình Lyp AI:", err);
      });
  }, []);

  // 2. Tải lịch sử chat khi sessionId thay đổi hoặc khi Chatbox được mở
  useEffect(() => {
    if (isOpen && sessionId) {
      apiClient.get(`/chat/sessions/${sessionId}/messages`)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setMessages(res.data.map(m => ({
              sender: m.sender,
              content: m.content,
              createdAt: m.createdAt,
              recommendedProducts: m.recommendedProducts || []
            })));
          } else {
            // Nếu không có tin nhắn nào trên server, tạo lại tin nhắn chào
            setMessages([
              { sender: "AI", content: greeting, createdAt: new Date() }
            ]);
          }
        })
        .catch((err) => {
          console.error("Lỗi khi tải lịch sử chat:", err);
          // Fallback tin nhắn chào
          setMessages([
            { sender: "AI", content: greeting, createdAt: new Date() }
          ]);
        });
    } else if (isOpen && !sessionId) {
      // Nếu chưa có sessionId, hiển thị tin nhắn chào
      setMessages([
        { sender: "AI", content: greeting, createdAt: new Date() }
      ]);
    }
  }, [isOpen, sessionId, greeting]);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Tự động xóa phiên chat cũ khi người dùng đăng nhập hoặc đăng xuất tài khoản khác
  const prevUserIdRef = useRef(user?.userId);
  useEffect(() => {
    if (prevUserIdRef.current !== user?.userId) {
      sessionStorage.removeItem("lyp_chat_session_id");
      setSessionId("");
      setMessages([
        { sender: "AI", content: greeting, createdAt: new Date() }
      ]);
      prevUserIdRef.current = user?.userId;
    }
  }, [user?.userId, greeting]);

  if (!enabled) return null; // Chatbot bị vô hiệu hóa

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput("");

    // Thêm tin nhắn của User vào danh sách hiển thị tạm thời
    const newMessages = [...messages, { sender: "User", content: userMessageText, createdAt: new Date() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await apiClient.post("/chat/send", {
        sessionId: sessionId || null,
        message: userMessageText
      });

      const data = res.data;
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem("lyp_chat_session_id", data.sessionId);
      }

      setMessages(prev => [
        ...prev,
        {
          sender: "AI",
          content: data.responseText,
          createdAt: new Date(),
          recommendedProducts: data.recommendedProducts || []
        }
      ]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      toast.error("Không thể kết nối đến Lyp AI. Vui lòng thử lại.");
      setMessages(prev => [
        ...prev,
        {
          sender: "AI",
          content: "Lyp Flower xin lỗi bạn, đường truyền kết nối đến trợ lý ảo Lyp AI hiện tại gặp sự cố. Bạn vui lòng thử lại sau ít phút.",
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có muốn xóa toàn bộ lịch sử trò chuyện và bắt đầu phiên mới?")) {
      sessionStorage.removeItem("lyp_chat_session_id");
      setSessionId("");
      setMessages([
        { sender: "AI", content: greeting, createdAt: new Date() }
      ]);
    }
  };

  return (
    <>
      {/* 1. NÚT BONG BÓNG FLOATING */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center border-4 border-white animate-pulse"
          title="Trò chuyện với Lyp AI"
        >
          <div className="relative">
            <MessageSquare size={26} />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-100 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-300"></span>
            </span>
          </div>
        </button>
      )}

      {/* 2. HỘP CHATBOX */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-pink-100 flex flex-col z-50 overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg border border-white/20 shadow-inner">
                🌸
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  Lyp AI Assistant <Sparkles size={14} className="text-yellow-200 fill-yellow-200 animate-spin" style={{ animationDuration: '3s' }} />
                </h3>
                <span className="text-[10px] text-pink-100 font-medium">Trực tuyến • Tư vấn 24/7</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
                  title="Làm mới hội thoại"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
                title="Thu nhỏ"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto bg-pink-50/20 space-y-4">
            {messages.map((msg, idx) => {
              const isAi = msg.sender === "AI";
              return (
                <div
                  key={idx}
                  className={`flex ${isAi ? "justify-start gap-2.5" : "justify-end"} items-start`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm border border-pink-200 shrink-0 shadow-xs">
                      🌸
                    </div>
                  )}
                  <div className={`flex flex-col gap-2 max-w-[80%]`}>
                    <div
                      className={`text-sm px-4 py-2.5 rounded-2xl leading-relaxed shadow-xs ${
                        isAi
                          ? "bg-white text-slate-700 rounded-tl-none border border-pink-50"
                          : "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-tr-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Danh sách hoa được AI đề xuất (trượt ngang) */}
                    {isAi && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="flex gap-2.5 overflow-x-auto py-1 px-0.5 max-w-full scrollbar-none">
                        {msg.recommendedProducts.map((prod) => {
                          const displayPrice = prod.salePrice > 0 ? prod.salePrice : prod.price;
                          const hasSale = prod.salePrice > 0 && prod.salePrice < prod.price;
                          return (
                            <div
                              key={prod.id}
                              className="flex-shrink-0 w-32 bg-white rounded-xl border border-pink-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                            >
                              <img
                                src={resolveImage(prod.mainImageUrl)}
                                alt={prod.name}
                                className="h-20 w-full object-cover bg-gray-50"
                              />
                              <div className="p-2 text-center">
                                <h4 className="font-bold text-[10px] text-slate-800 line-clamp-1 mb-1">
                                  {prod.name}
                                </h4>
                                <p className="text-pink-600 font-bold text-[11px] mb-1">
                                  {Number(displayPrice).toLocaleString("vi-VN")} đ
                                </p>
                                <button
                                  onClick={() => {
                                    setIsOpen(false); // Đóng chatbox khi chuyển hướng
                                    navigate(`/hoa/${prod.slug}`);
                                  }}
                                  className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold py-1 rounded-lg text-[9px] cursor-pointer transition-colors border border-pink-100"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trạng thái AI đang suy nghĩ */}
            {loading && (
              <div className="flex justify-start gap-2.5 items-start">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm border border-pink-200 shrink-0">
                  🌸
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-pink-50 shadow-xs flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium mr-1">Lyp AI đang trả lời</span>
                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-pink-50 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi Lyp AI: hoa cưới, hoa sinh nhật..."
              className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer ${
                (!input.trim() || loading) ? "opacity-50 cursor-not-allowed" : "hover:shadow"
              }`}
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
