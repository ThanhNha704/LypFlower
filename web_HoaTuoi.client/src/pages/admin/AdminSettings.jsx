import { useState, useEffect } from 'react';
import { Save, Settings, Image as ImageIcon, Phone, Type, ExternalLink } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

// Helper to map known keys to nice UI labels
const SETTING_LABELS = {
  ShopName: { label: 'Tên Cửa Hàng', icon: Type, placeholder: 'VD: Lyp Flower' },
  Hotline: { label: 'Hotline / Zalo', icon: Phone, placeholder: 'VD: 0922 222 686' },
  HeroBanner: { label: 'Ảnh Banner Chính (URL)', icon: ImageIcon, placeholder: '/banner.png' },
  LogoUrl: { label: 'Logo / Icon (Emoji/URL)', icon: ImageIcon, placeholder: '🌸' }
};

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/settings')
      .then(r => {
        setSettings(r.data ?? []);
        // Initialize form data
        const iniData = {};
        for (const s of (r.data ?? [])) {
          iniData[s.id] = s.value;
        }
        setFormData(iniData);
      })
      .catch(() => toast.error('Không thể tải cài đặt hệ thống'));
  }, []);

  const handleChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    let successCount = 0;
    
    try {
      // Find what changed
      for (const s of settings) {
        const newValue = formData[s.id];
        if (s.value !== newValue) {
          await apiClient.put(`/settings/${s.id}`, { ...s, value: newValue });
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Đã cập nhật ${successCount} mục cài đặt!`);
        // refresh list to get new UpdatedAt
        const res = await apiClient.get('/settings');
        setSettings(res.data);
      } else {
        toast('Không có thay đổi nào');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cài đặt Hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình thông tin chung hiển thị trên website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 shadow-sm">
          {saving ? <span className="animate-spin text-lg">⚙️</span> : <Save size={18} />}
          {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Thông tin chung</h2>
            <p className="text-gray-500 text-xs">Các thiết lập cơ bản về thương hiệu</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {settings.map(s => {
            const meta = SETTING_LABELS[s.key] || { label: s.key, icon: Settings, placeholder: 'Nhập giá trị...' };
            const Icon = meta.icon;

            return (
              <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-start pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="md:col-span-1">
                  <label className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                    <Icon size={16} className="text-gray-400" /> 
                    {meta.label}
                  </label>
                  <p className="text-xs text-gray-400 font-mono">Key: {s.key}</p>
                  {s.updatedAt && (
                    <p className="text-[10px] text-gray-400 mt-2">Cập nhật: {new Date(s.updatedAt).toLocaleString('vi-VN')}</p>
                  )}
                </div>
                
                <div className="md:col-span-2 relative">
                  <input 
                    type="text"
                    value={formData[s.id] ?? ''} 
                    onChange={e => handleChange(s.id, e.target.value)}
                    placeholder={meta.placeholder}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-amber-500 focus:border-amber-500 block p-3 transition-colors hover:bg-white"
                  />
                  {(s.key === 'HeroBanner' || s.key === 'LogoUrl') && formData[s.id] && formData[s.id].startsWith('http') && (
                    <a href={formData[s.id]} target="_blank" rel="noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500" title="Xem ảnh">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {settings.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <p>Chưa có cấu hình nào trong hệ thống</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
