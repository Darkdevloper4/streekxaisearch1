
import React, { useState, useEffect } from 'react';
import { UserProfile, SearchSession } from '../types';

// --- SHARED COMPONENTS ---

const ScreenHeader = ({ title, onBack, action }: { title: string, onBack: () => void, action?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20 border-b border-[#1c1c1e]">
    <div className="flex items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c1c1e] rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h2 className="ml-3 text-[19px] font-semibold text-gray-200 tracking-tight">{title}</h2>
    </div>
    {action}
  </div>
);

// --- FEEDBACK SCREEN ---
export const FeedbackScreen = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200">
            <ScreenHeader title="Feedback" onBack={onBack} />
            <div className="p-6">
                <p className="text-gray-400 mb-4">We'd love to hear your thoughts.</p>
                <textarea className="w-full p-4 bg-[#1c1c1e] text-white rounded-xl outline-none focus:ring-1 focus:ring-streekx-primary transition-all h-40 resize-none mb-4 border border-[#2c2c2e]" placeholder="Type your feedback here..." />
                <button onClick={onBack} className="w-full py-3 bg-streekx-primary text-white rounded-xl font-bold shadow-md">Submit Feedback</button>
            </div>
        </div>
    );
};

// --- DISCOVERY SCREEN ---
export const DiscoveryScreen = ({ onBack, onSearch }: { onBack: () => void, onSearch: (q: string) => void }) => {
    const topics = [
        { emoji: '🌎', title: 'World News', query: 'Latest world news headlines' },
        { emoji: '🚀', title: 'Technology', query: 'Newest tech innovations this week' },
        { emoji: '🎬', title: 'Entertainment', query: 'Trending movies and TV shows' },
        { emoji: '⚽', title: 'Sports', query: 'Sports highlights today' },
    ];

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200">
            <ScreenHeader title="Discovery" onBack={onBack} />
            <div className="p-4 grid grid-cols-2 gap-4">
                {topics.map(t => (
                    <div key={t.title} onClick={() => onSearch(t.query)} className="bg-[#1c1c1e] p-5 rounded-2xl border border-[#2c2c2e] hover:border-streekx-primary cursor-pointer transition-all active:scale-95">
                        <div className="text-3xl mb-3">{t.emoji}</div>
                        <h3 className="font-bold text-gray-200">{t.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- EDIT PROFILE ---
export const EditProfileScreen = ({ user, onUpdate, onBack }: { user: UserProfile | null, onUpdate: (u: UserProfile) => void, onBack: () => void }) => {
     return <div />;
};
