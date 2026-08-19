import { useState, useEffect } from 'react';
import { CheckCircle, EyeOff, MessageCircle, Trash2, Star, Search } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import RatingStars from '../../components/common/RatingStars';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' }
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(''); // default to all (Tất cả)
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const PAGE_SIZE = 15;

  const fetchReviews = () => {
    let url = `/reviews?page=${page}&pageSize=${PAGE_SIZE}`;
    if (filter === 'pending') url += '&approved=false';
    if (filter === 'approved') url += '&approved=true';
    if (ratingFilter) url += `&rating=${ratingFilter}`;
    if (replyFilter) url += `&hasReply=${replyFilter}`;

    apiClient.get(url)
      .then(r => { setReviews(r.data.items ?? []); setTotal(r.data.total ?? 0); })
      .catch(() => toast.error('Lỗi tải đánh giá'));
  };

  useEffect(() => { fetchReviews(); }, [page, filter, ratingFilter, replyFilter]);

  async function approveAction(id) {
    try {
      await apiClient.put(`/reviews/${id}/approve`);
      toast.success('Đã duyệt đánh giá');
      fetchReviews();
    } catch { toast.error('Lỗi khi duyệt'); }
  }

  async function hideAction(id) {
    try {
      await apiClient.put(`/reviews/${id}/hide`);
      toast.success('Đã ẩn đánh giá');
      fetchReviews();
    } catch { toast.error('Lỗi khi ẩn'); }
  }

  async function deleteAction(id) {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn đánh giá này?')) return;
    try {
      await apiClient.delete(`/reviews/${id}`);
      toast.success('Đã xóa đánh giá');
      fetchReviews();
    } catch { toast.error('Lỗi khi xóa'); }
  }

  async function sendReply(id) {
    if (!replyText.trim()) return toast.error('Vui lòng nhập nội dung');
    try {
      await apiClient.put(`/reviews/${id}/reply`, { reply: replyText });
      toast.success('Đã gửi phản hồi');
      setReplyId(null); setReplyText(''); fetchReviews();
    } catch { toast.error('Lỗi khi gửi'); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Đánh giá</h1>
        <p className="text-sm text-gray-400">{total} đánh giá</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center border-b border-gray-100 pb-3">
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.value} onClick={() => { setFilter(t.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${filter === t.value ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <select
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
            className="input text-xs w-32 font-bold py-2 px-3 bg-white border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 cursor-pointer"
          >
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          <select
            value={replyFilter}
            onChange={e => { setReplyFilter(e.target.value); setPage(1); }}
            className="input text-xs w-40 font-bold py-2 px-3 bg-white border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 cursor-pointer"
          >
            <option value="">Tất cả phản hồi</option>
            <option value="false">Chưa trả lời</option>
            <option value="true">Đã trả lời</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800 font-bold text-lg shadow-sm border border-amber-300/30">
                  {r.userName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{r.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RatingStars rating={r.rating} size={14} />
                    <span className="text-xs text-gray-400">&bull; {new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold px-3 py-1 mr-2 rounded-full ${r.isApproved ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                  {r.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>

                {!r.isApproved && (
                  <button onClick={() => approveAction(r.id)} title="Duyệt" className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors">
                    <CheckCircle size={18} />
                  </button>
                )}
                {r.isApproved && (
                  <button onClick={() => hideAction(r.id)} title="Ẩn" className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-xl transition-colors">
                    <EyeOff size={18} />
                  </button>
                )}

                <button onClick={() => { setReplyId(replyId === r.id ? null : r.id); setReplyText(r.adminReply ?? ''); }} title="Phản hồi"
                  className={`p-2 rounded-xl transition-colors ${r.adminReply ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-500'}`}>
                  <MessageCircle size={18} />
                </button>

                <button onClick={() => deleteAction(r.id)} title="Xóa" className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">{r.comment || <span className="text-gray-400 italic">Chỉ đánh giá sao, không có bình luận</span>}</p>

            {r.images?.length > 0 && (
              <div className="flex gap-3 mb-4">
                {r.images.map((img, i) => (
                  <img key={i} src={img} alt="Review" className="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-100 shadow-sm" />
                ))}
              </div>
            )}

            {r.adminReply && replyId !== r.id && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-blue-800 text-sm">Shop phản hồi</span>
                  <CheckCircle size={12} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-700">{r.adminReply}</p>
              </div>
            )}

            {replyId === r.id && (
              <div className="flex gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                  placeholder="Nhập phản hồi của bạn..." className="input text-sm flex-1 resize-none bg-blue-50/30 font-medium focus:bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400/20" />
                <button onClick={() => sendReply(r.id)} className="btn-primary whitespace-nowrap px-6 shadow-sm hover:shadow-md transition-shadow">
                  Gửi
                </button>
              </div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-24 text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <Star size={48} className="mx-auto mb-4 text-gray-300 drop-shadow-sm" />
            <p className="font-medium text-gray-500">Không có đánh giá nào phù hợp</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm ${p === page ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white border border-gray-200 hover:border-amber-400 hover:text-amber-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
