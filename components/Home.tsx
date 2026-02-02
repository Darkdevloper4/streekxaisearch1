
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, WeatherData, Screen, Attachment } from '../types';

interface HomeProps {
  user: UserProfile | null;
  weather: WeatherData | null;
  onSearch: (query: string, attachments?: Attachment[]) => void;
  onOpenProfile: () => void;
  searchHistory: string[];
  onNavigate: (screen: Screen) => void;
}

type FocusMode = 'All' | 'Academic' | 'Writing' | 'YouTube' | 'Reddit';

export default function Home({ user, weather, onSearch, onOpenProfile, searchHistory, onNavigate }: HomeProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('All');
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const newAtt: Attachment = {
                    id: crypto.randomUUID(),
                    type: file.type.startsWith('image') ? 'image' : 'file',
                    url: ev.target.result as string,
                    name: file.name
                };
                setAttachments(prev => [...prev, newAtt]);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || attachments.length > 0) {
        const finalQuery = focusMode === 'All' ? query : `[Focus: ${focusMode}] ${query}`;
        onSearch(finalQuery, attachments);
    }
  };

  const suggestions = searchHistory.slice(0, 5);
  const showDropdown = isFocused && !query && suggestions.length > 0;

  const trendingTopics = [
      "PSLV-C62 Launch",
      "Friedrich Merz",
      "Devendra Fadnavis",
      "Delhi Cold Wave",
      "LoC Drone Intrusion",
      "Mani Shankar Aiyar",
      "Priyanka Chopra",
      "Vijay"
  ];

  return (
    <div className="h-full flex flex-col bg-[#000000] relative overflow-hidden text-white font-sans" onClick={() => { setIsFocused(false); setIsMenuOpen(false); }}>
      
      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <>
           <div className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
           <div className="absolute top-0 left-0 bottom-0 w-72 bg-[#1c1c1e] z-50 shadow-2xl animate-slide-right flex flex-col p-6 border-r border-[#2c2c2e]">
                <div className="flex items-center gap-3 mb-10">
                     <div className="w-10 h-10 bg-streekx-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">S</div>
                     <span className="text-2xl font-extrabold text-white tracking-tight">StreekX</span>
                </div>

                <div className="space-y-3">
                    <button onClick={() => { setIsMenuOpen(false); onNavigate('HOME'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#2c2c2e] text-streekx-primary font-bold">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        Home
                    </button>
                    <button onClick={() => { setIsMenuOpen(false); onNavigate('DISCOVERY'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-400 hover:bg-[#2c2c2e] font-medium transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                        Discovery
                    </button>
                     <button onClick={() => { setIsMenuOpen(false); onNavigate('PROJECTS'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-400 hover:bg-[#2c2c2e] font-medium transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                        Library
                    </button>
                </div>
           </div>
        </>
      )}

      {/* Header - Fixed at Top */}
      <div className="flex justify-between items-center px-6 pt-6 pb-2 z-30 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onOpenProfile(); }} className="w-11 h-11 rounded-full border-2 border-[#1c1c1e] shadow-md flex items-center justify-center bg-[#2c2c2e] overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User" className="w-full h-full object-cover"/>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar relative z-10">
        
        {/* Inner Centering Wrapper */}
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-4">
        
            <h2 className="text-6xl font-extrabold mb-3 tracking-tighter text-center">
                <span className="text-streekx-primary">Streek</span><span className="text-white">X</span>
            </h2>
            
            {weather && (
            <div className="flex items-center gap-2 text-gray-500 mb-8 font-semibold bg-[#1c1c1e] px-4 py-1 rounded-full border border-[#2c2c2e]">
                <span>{weather.condition}, {weather.temp}°</span>
            </div>
            )}

            <div className="w-full max-w-2xl relative z-20 mb-6" onClick={(e) => e.stopPropagation()}>
                {attachments.length > 0 && (
                    <div className="absolute -top-16 left-0 flex gap-2 overflow-x-auto pb-2 w-full px-2">
                        {attachments.map(att => (
                            <div key={att.id} className="relative group flex-shrink-0 animate-fade-in">
                                {att.type === 'image' ? (
                                    <img src={att.url} className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100">📄</div>
                                )}
                                <button onClick={(e) => removeAttachment(e, att.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs shadow-md">✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full relative group">
                    <div className={`relative w-full h-[72px] bg-[#1c1c1e] border border-[#2c2c2e] group-focus-within:border-gray-600 group-focus-within:shadow-lg flex items-center px-6 shadow-md transition-all duration-300 ${showDropdown ? 'rounded-t-[2.2rem] rounded-b-none border-b-0' : 'rounded-[2.2rem]'}`}>
                        
                        <svg className="w-7 h-7 text-gray-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        
                        <input 
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            placeholder="Ask anything..."
                            className="flex-1 h-full outline-none bg-transparent text-xl text-white placeholder-gray-500 font-medium"
                        />

                        <div className="flex items-center gap-3 pl-2 border-l border-[#2c2c2e]">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-streekx-primary hover:bg-streekx-primary/10 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

                            <button type="button" onClick={() => onNavigate('ASSISTANT')} className="p-2 text-gray-500 hover:text-streekx-primary hover:bg-streekx-primary/10 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </button>
                        </div>
                    </div>
                </form>

                {showDropdown && (
                    <div className="absolute top-[70px] left-0 right-0 bg-[#1c1c1e] border border-t-0 border-[#2c2c2e] rounded-b-[2.2rem] shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-slide-up z-10">
                        {suggestions.map((item, idx) => (
                            <div 
                                key={idx}
                                onMouseDown={() => { onSearch(item, attachments); setIsFocused(false); }}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-[#2c2c2e] cursor-pointer"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-gray-300 font-medium text-lg">{item}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 z-10 max-w-md mb-10">
                {(['All', 'Academic', 'Writing', 'YouTube', 'Reddit'] as FocusMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setFocusMode(mode)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${focusMode === mode ? 'bg-streekx-primary text-white border-streekx-primary shadow-md transform scale-105' : 'bg-[#1c1c1e] text-gray-400 border-[#2c2c2e] hover:border-streekx-primary hover:text-white'}`}
                    >
                        {mode === 'All' && '🌐 '}
                        {mode === 'Academic' && '🎓 '}
                        {mode === 'Writing' && '✍️ '}
                        {mode === 'YouTube' && '▶️ '}
                        {mode === 'Reddit' && '💬 '}
                        {mode}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-md mb-6">
                <h3 className="text-center font-semibold text-gray-500 mb-6 text-lg">Trending now</h3>
                <div className="grid grid-cols-2 gap-3">
                    {trendingTopics.map((topic, i) => (
                        <button 
                            key={i}
                            onClick={() => onSearch(topic)}
                            className="w-full px-2 py-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-full text-[13px] font-bold text-gray-300 hover:bg-[#2c2c2e] hover:text-white transition-all active:scale-95 text-center shadow-sm truncate"
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
