import React, { useState, useEffect } from "react";
import { MessageSquare, Settings, RefreshCw, Database, Trash2, Calendar, ChevronRight, Eye, ShieldAlert, CheckCircle2, X } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";

export default function AdminAiChat() {
  const [activeTab, setActiveTab] = useState("history"); // "history" | "settings" | "sync"
  
  // Tab History states
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Tab Settings states
  const [settings, setSettings] = useState({ enabled: true, greeting: "", systemPrompt: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  // Tab Sync states
  const [dbStatus, setDbStatus] = useState({ sqlCount: 0, mongoCount: 0, isSynced: true, isSyncing: false });
  const [syncing, setSyncing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const PAGE_SIZE = 10;

  // 1. Tải dữ liệu tùy theo Tab hoạt động
  useEffect(() => {
    if (activeTab === "history") {
      fetchSessions();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "sync") {
      fetchDbStatus();
    }
  }, [activeTab, historyPage]);

  // 1.2 Tự động thăm dò trạng thái đồng bộ nếu máy chủ đang chạy ngầm
  useEffect(() => {
    let intervalId;
    const isCurrentlySyncing = syncing || dbStatus.isSyncing || (!dbStatus.isSynced && dbStatus.sqlCount > 0 && dbStatus.mongoCount < dbStatus.sqlCount);

    if (activeTab === "sync" && isCurrentlySyncing) {
      intervalId = setInterval(() => {
        apiClient.get("/chat/vectordb/status")
          .then(res => {
            setDbStatus(res.data);
            if (res.data.isSynced && !res.data.isSyncing) {
              setSyncing(false);
              toast.success("Đồng bộ dữ liệu sản phẩm thành công!");
            }
          })
          .catch(() => {});
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, syncing, dbStatus.isSyncing, dbStatus.isSynced, dbStatus.sqlCount, dbStatus.mongoCount]);

  // Fetch Chat Sessions
  const fetchSessions = () => {
    setLoadingSessions(true);
    apiClient.get(`/chat/sessions?page=${historyPage}&pageSize=${PAGE_SIZE}`)
      .then(res => {
        setSessions(res.data.items ?? []);
        setTotalSessions(res.data.total ?? 0);
      })
      .catch(() => toast.error("Không thể tải danh sách phiên trò chuyện"))
      .finally(() => setLoadingSessions(false));
  };

  // Fetch Chatbot Settings
  const fetchSettings = () => {
    apiClient.get("/chat/settings")
      .then(res => setSettings(res.data))
      .catch(() => toast.error("Không thể tải cài đặt chatbot"));
  };

  // Fetch Database Sync status
  const fetchDbStatus = () => {
    setLoadingStatus(true);
    apiClient.get("/chat/vectordb/status")
      .then(res => setDbStatus(res.data))
      .catch(() => toast.error("Không thể tải trạng thái VectorDB"))
      .finally(() => setLoadingStatus(false));
  };

  // View Messages in Session
  const handleViewSession = (session) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    setSessionMessages([]);
    apiClient.get(`/chat/sessions/${session.id}/messages`)
      .then(res => setSessionMessages(res.data ?? []))
      .catch(() => toast.error("Không thể tải tin nhắn của phiên này"))
      .finally(() => setLoadingMessages(false));
  };

  // Delete Session
  const handleDeleteSession = async (sessionId, name) => {
    if (!window.confirm(`Xóa lịch sử chat của "${name}"? Thao tác này không thể hoàn tác.`)) return;

    try {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
      toast.success("Đã xóa phiên trò chuyện");
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      fetchSessions();
    } catch {
      toast.error("Không thể xóa phiên trò chuyện");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiClient.put("/chat/settings", settings);
      toast.success("Đã cập nhật cài đặt chatbot");
    } catch {
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSavingSettings(false);
    }
  };

  // Run Vector Sync
  const handleRunSync = async () => {
    setSyncing(true);
    try {
      const res = await apiClient.post("/chat/vectordb/sync");
      toast.success(res.data.message || "Đã bắt đầu đồng bộ dữ liệu ngầm!");
      // Gọi cập nhật trạng thái ngay lập tức
      apiClient.get("/chat/vectordb/status").then(r => setDbStatus(r.data));
    } catch {
      toast.error("Lỗi khi khởi chạy đồng bộ VectorDB");
      setSyncing(false);
    }
  };

  const totalPages = Math.ceil(totalSessions / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Quản lý Trợ lý ảo Lyp AI</h1>
        <p className="text-sm text-gray-500 mt-1">Cấu hình hệ thống tư vấn thông minh sử dụng trí tuệ nhân tạo và Vector Database.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-100 bg-white p-1 rounded-2xl shadow-xs max-w-md">
        {[
          { id: "history", label: "Lịch sử Chat", icon: MessageSquare },
          { id: "settings", label: "Cấu hình AI", icon: Settings },
          { id: "sync", label: "Đồng bộ VectorDB", icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-pink-100 text-pink-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        
        {/* TAB 1: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Danh sách phiên trò chuyện của khách</h2>
              <button 
                onClick={fetchSessions} 
                disabled={loadingSessions} 
                className="p-1.5 text-gray-400 hover:text-pink-600 rounded-lg hover:bg-slate-50 transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={16} className={loadingSessions ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingSessions ? (
              <div className="py-20 text-center text-gray-400 animate-pulse">Đang tải danh sách...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-50">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Khách hàng</th>
                      <th className="px-4 py-3 text-left">Số tin nhắn</th>
                      <th className="px-4 py-3 text-left">IP Address</th>
                      <th className="px-4 py-3 text-left">Thời gian chat</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {sessions.map(s => {
                      const name = s.userFullName || "Khách vãng lai";
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3.5">
                            <div>
                              <p className="font-bold text-gray-900">{name}</p>
                              {s.userEmail && <p className="text-xs text-gray-400 font-medium">{s.userEmail}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                              {s.messageCount}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{s.ipAddress || "Unknown"}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">
                            <div>
                              <p>Bắt đầu: {new Date(s.startedAt).toLocaleString("vi-VN")}</p>
                              <p className="text-gray-400">Cuối: {new Date(s.lastMessageAt).toLocaleString("vi-VN")}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleViewSession(s)}
                                className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                                title="Xem nội dung trò chuyện"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(s.id, name)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa phiên"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400">Chưa có phiên trò chuyện nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setHistoryPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer ${
                      p === historyPage
                        ? "bg-pink-600 text-white"
                        : "border border-gray-200 hover:border-pink-500"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SETTINGS */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-2">Thiết lập Trợ lý ảo Lyp AI</h2>

            <div className="space-y-4">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <div>
                  <label htmlFor="ai-enabled" className="font-bold text-gray-800 text-sm cursor-pointer">Kích hoạt Chatbot Lyp AI</label>
                  <p className="text-xs text-gray-400 mt-1">Bật/tắt bong bóng chat thông minh ở ngoài trang chủ khách hàng.</p>
                </div>
                <input
                  type="checkbox"
                  id="ai-enabled"
                  checked={settings.enabled}
                  onChange={e => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-pink-500 relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all cursor-pointer border border-transparent checked:border-transparent"
                />
              </div>

              {/* Greeting */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 text-sm">Lời chào mở đầu</label>
                <textarea
                  value={settings.greeting}
                  onChange={e => setSettings(prev => ({ ...prev, greeting: e.target.value }))}
                  rows={2}
                  required
                  placeholder="VD: Xin chào! Tôi là trợ lý ảo Lyp AI..."
                  className="w-full bg-slate-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block p-3 transition-colors hover:bg-white resize-none"
                />
                <p className="text-[10px] text-gray-400">Tin nhắn chào mừng hiển thị đầu tiên khi khách mở hộp chat.</p>
              </div>

              {/* System Instruction Prompt */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 text-sm">Huấn luyện Prompt (System Instruction)</label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={e => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={8}
                  required
                  placeholder="Nhập System Prompt định hình tính cách và hành vi của AI..."
                  className="w-full bg-slate-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block p-3 transition-colors hover:bg-white resize-y font-mono text-xs"
                />
                <p className="text-[10px] text-gray-400">Hướng dẫn chi tiết quy định cách ứng xử của Lyp AI, cách phân tích nhu cầu và gợi ý hoa.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary w-full max-w-xs font-bold text-xs py-3"
            >
              {savingSettings ? "Đang lưu cấu hình..." : "Lưu cài đặt trợ lý"}
            </button>
          </form>
        )}

        {/* TAB 3: SYNC VECTORDB */}
        {activeTab === "sync" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-2">Đồng bộ Cơ sở dữ liệu Vector (MongoDB Atlas)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SQL Server Stats */}
              <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">SQL Server (WebHoaTuoiDb)</h4>
                  <p className="text-2xl font-black text-gray-900 mt-2">{dbStatus.sqlCount} sản phẩm</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-4">Số lượng sản phẩm hoa đang kích hoạt hoạt động trong cơ sở dữ liệu quan hệ chính.</p>
              </div>

              {/* VectorDB Stats */}
              <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">MongoDB Atlas Vector DB</h4>
                  <p className="text-2xl font-black text-gray-900 mt-2">{dbStatus.mongoCount} sản phẩm</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-4">Số lượng sản phẩm đã được nhúng vector (embedding) lưu trong kho lưu trữ dữ liệu tìm kiếm ngữ nghĩa.</p>
              </div>
            </div>

            {/* Sync status badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
              {loadingStatus ? (
                <div className="text-gray-400 animate-pulse">Đang tải trạng thái...</div>
              ) : dbStatus.isSynced ? (
                <>
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-slate-800">Dữ liệu đồng bộ hoàn hảo</p>
                    <p className="text-xs text-gray-400 mt-0.5">Số lượng hoa ở hai cơ sở dữ liệu trùng khớp nhau.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="text-amber-500 shrink-0 animate-bounce" size={20} />
                  <div>
                    <p className="font-bold text-slate-800">Cơ sở dữ liệu lệch nhau</p>
                    <p className="text-xs text-gray-400 mt-0.5">Một số sản phẩm chưa được tạo vector nhúng. Vui lòng bấm đồng bộ ngay để cập nhật.</p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunSync}
                disabled={syncing || dbStatus.isSyncing}
                className="btn-primary flex items-center justify-center gap-2 max-w-xs font-bold text-xs py-3 w-full animate-none"
              >
                <RefreshCw size={16} className={(syncing || dbStatus.isSyncing) ? "animate-spin" : ""} />
                {(syncing || dbStatus.isSyncing) 
                  ? `Đang đồng bộ... (${dbStatus.mongoCount}/${dbStatus.sqlCount})` 
                  : "Đồng bộ thủ công ngay"}
              </button>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                Quá trình này chạy ngầm dưới máy chủ giúp tránh lỗi timeout. Số lượng sản phẩm trên MongoDB sẽ được cập nhật liên tục trên màn hình cho đến khi hoàn tất.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* DETAIL CONVERSATION TRANSCRIPT DIALOG */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setSelectedSession(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col space-y-4 shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-bold text-gray-950 text-base">
                  Chi tiết hội thoại: {selectedSession.userFullName || "Khách vãng lai"}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1 font-mono">{selectedSession.id}</p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Chat Logs) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-2xl space-y-4">
              {loadingMessages ? (
                <div className="py-20 text-center text-gray-400 animate-pulse text-sm">Đang tải lịch sử tin nhắn...</div>
              ) : (
                sessionMessages.map((m) => {
                  const isAi = m.sender === "AI";
                  return (
                    <div key={m.id} className={`flex ${isAi ? "justify-start" : "justify-end"} items-start gap-2.5`}>
                      {isAi && (
                        <div className="w-7 h-7 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center text-xs shrink-0 shadow-xs">
                          🌸
                        </div>
                      )}
                      <div className="max-w-[80%] flex flex-col gap-1">
                        <div className={`text-xs p-3 rounded-2xl ${
                          isAi 
                            ? "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-2xs" 
                            : "bg-pink-600 text-white rounded-tr-none shadow-2xs"
                        }`}>
                          {m.content}
                        </div>
                        <span className="text-[9px] text-gray-400 px-1">
                          {new Date(m.createdAt).toLocaleString("vi-VN")}
                        </span>

                        {/* Sản phẩm đã gợi ý */}
                        {isAi && m.recommendedProducts && m.recommendedProducts.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {m.recommendedProducts.map((p) => (
                              <div key={p.id} className="bg-pink-50 border border-pink-100 text-[10px] text-pink-700 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                💐 {p.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {!loadingMessages && sessionMessages.length === 0 && (
                <div className="text-center py-20 text-gray-400 text-sm">Không có tin nhắn nào trong phiên này</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
              <button 
                onClick={() => setSelectedSession(null)} 
                className="btn-outline font-bold text-xs py-2 px-6 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
