
import React from 'react';

interface NotificationsProps {
  onBack: () => void;
}

export default function Notifications({ onBack }: NotificationsProps) {
  return (
    <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans">
      {/* Header - Implemented locally to maintain isolation */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20 border-b border-[#1c1c1e]">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c1c1e] rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h2 className="ml-3 text-[19px] font-semibold text-gray-200 tracking-tight">Notifications</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Notification Item */}
        <div className="p-4 bg-streekx-primary/10 rounded-2xl border border-streekx-primary/30 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎉</span>
                <h4 className="font-bold text-streekx-primary text-sm">Welcome to StreekX</h4>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">Thanks for joining! Explore our real-time search capabilities powered by Gemini.</p>
            <span className="text-xs text-gray-600 mt-3 block font-medium">Just now</span>
        </div>
        
        {/* Placeholder for empty state */}
        <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1c1c1e] rounded-full flex items-center justify-center mb-4 text-gray-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">You're all caught up</p>
        </div>
      </div>
    </div>
  );
}
