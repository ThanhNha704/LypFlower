import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'success' | 'info'
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const btnColors = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/20 focus:ring-red-500',
    warning: 'bg-amber-50 hover:bg-amber-600 shadow-amber-500/20 focus:ring-amber-500',
    success: 'bg-green-600 hover:bg-green-700 shadow-green-500/20 focus:ring-green-500',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 focus:ring-blue-500',
  };

  const btnColorClass = btnColors[confirmVariant] || btnColors.danger;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              confirmVariant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-500'
            }`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-600 mb-6 leading-relaxed">
          {description}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnColorClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
