import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modern & Minimalist 404 Not Found and Route Error View
 * Compliant with mobile 3-level padding discipline and clean UI standards.
 */
export default function NotFoundView({
  onNavigateTab,
  notFoundPath = '',
  error = null,
  onReset = null
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigateTab) {
      onNavigateTab('home');
    }
  };

  const quickPortals = [
    { id: 'champions', label: isEn ? 'Champions' : 'Tướng', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'relics', label: isEn ? 'Relics' : 'Cổ Vật', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'powers', label: isEn ? 'Powers' : 'Sức Mạnh', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'cards', label: isEn ? 'Cards' : 'Thẻ Bài', icon: 'M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'items', label: isEn ? 'Items' : 'Vật Phẩm', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'maps', label: isEn ? 'Maps' : 'Bản Đồ', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' }
  ];

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-2 py-6 sm:px-4 sm:py-12">
      <div className="w-full max-w-xl mx-auto text-center rounded-2xl bg-[#0c111d]/90 border border-white/10 backdrop-blur-md p-2 sm:p-6 shadow-2xl">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error ? (isEn ? 'System Error' : 'Lỗi Hệ Thống') : (isEn ? '404 Not Found' : 'Không Tìm Thấy Trang')}
        </div>

        {/* 404 Large Code */}
        <div className="text-6xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-2 select-none">
          {error ? '500' : '404'}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {error
            ? (isEn ? 'An Unexpected Error Occurred' : 'Đã Xảy Ra Lỗi Xử Lý')
            : (isEn ? 'Page Not Found' : 'Trang Không Tồn Tại')}
        </h1>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
          {error
            ? (error.message || (isEn ? 'Something went wrong while rendering this component.' : 'Không thể tải thành phần này. Vui lòng thử lại.'))
            : (isEn
                ? 'The page or resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
                : 'Đường dẫn bạn truy cập có thể đã bị di chuyển, đổi tên hoặc không tồn tại trong hệ thống.'
              )}
        </p>

        {/* Path Info if available */}
        {notFoundPath && (
          <div className="inline-block px-3 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300 font-mono text-[11px] mb-5 truncate max-w-full">
            {notFoundPath}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
          {error && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors"
            >
              {isEn ? 'Try Again' : 'Thử Lại'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('home')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8CC0EB] text-[#07090e] font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#BFDDF0] transition-colors"
            >
              {isEn ? 'Back to Home' : 'Về Trang Chủ'}
            </button>
          )}

          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs tracking-wider cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            {isEn ? 'Go Back' : 'Quay Lại'}
          </button>
        </div>

        {/* Quick Database Navigation Portals */}
        <div className="pt-4 border-t border-white/10">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {isEn ? 'Or explore database' : 'Hoặc tra cứu danh mục khác'}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {quickPortals.map((portal) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => onNavigateTab && onNavigateTab(portal.id)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#8CC0EB]/30 text-slate-300 hover:text-white transition-all cursor-pointer group"
              >
                <svg
                  className="w-4 h-4 mb-1 text-slate-400 group-hover:text-[#8CC0EB] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={portal.icon} />
                </svg>
                <span className="text-[11px] font-medium leading-tight">{portal.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
