
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, WeatherData, Screen, Attachment, SearchMode, SourceFlags } from '../types';

interface HomeProps {
  user: UserProfile | null;
  weather: WeatherData | null;
  onSearch: (query: string, attachments?: Attachment[], mode?: SearchMode, isIncognito?: boolean, sourceFlags?: SourceFlags) => void;
  onOpenProfile: () => void;
  searchHistory: string[];
  onNavigate: (screen: Screen) => void;
}

export default function Home({ user, weather, onSearch, onOpenProfile, searchHistory, onNavigate }: HomeProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Mode Selector State
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('Standard');
  const [isProToggleOn, setIsProToggleOn] = useState(false); 
  const [isIncognito, setIsIncognito] = useState(false);

  // Sources Selector State
  const [showSources, setShowSources] = useState(false);
  const [sourceFlags, setSourceFlags] = useState<SourceFlags>({
      web: true,
      academic: false,
      finance: false,
      social: false
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- HANDLERS ---

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
                // Close sources modal if open after upload
                setShowSources(false); 
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
        const finalMode = isProToggleOn ? 'Pro' : searchMode;
        onSearch(query, attachments, finalMode, isIncognito, sourceFlags);
    }
  };

  const startDictation = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
             setIsListening(false);
             recognitionRef.current = null;
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    } else {
        alert("Voice input not supported in this browser.");
    }
  };

  const getModeIcon = () => {
      if (isIncognito) return <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>; 
      if (isProToggleOn || searchMode === 'Pro') return <span className="text-xs font-bold bg-streekx-primary text-white px-1.5 py-0.5 rounded">PRO</span>;
      if (searchMode === 'Research') return <span className="text-lg">⚡️</span>;
      if (searchMode === 'Labs') return <span className="text-lg">🧪</span>;
      return <svg className="w-5 h-5 text-streekx-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>;
  };

  const getModeLabel = () => {
      if (isIncognito) return "Incognito";
      if (isProToggleOn || searchMode === 'Pro') return "Pro Mode";
      if (searchMode === 'Research') return "Research";
      if (searchMode === 'Labs') return "Labs";
      return "Mode"; // Renamed from "AI Mode"
  };

  const suggestions = searchHistory.slice(0, 5);
  const showDropdown = isFocused && !query && suggestions.length > 0;
  
  const hasContent = query.trim().length > 0 || attachments.length > 0;

  // --- COMPONENTS ---

  const ToggleSwitch = ({ checked, onChange, colorClass }: { checked: boolean, onChange: (v: boolean) => void, colorClass?: string }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className={`w-[44px] h-[24px] rounded-full p-1 transition-all duration-300 relative cursor-pointer ${checked ? (colorClass || 'bg-streekx-primary') : 'bg-gray-300 dark:bg-[#3a3a3c]'}`}>
        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50 dark:bg-[#000000] relative overflow-hidden text-gray-900 dark:text-white font-sans transition-colors duration-200" onClick={() => { setIsFocused(false); setIsMenuOpen(false); }}>
      
      {/* MODE SELECTOR MODAL */}
      {showModeSelector && (
          <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowModeSelector(false)}>
              <div className="w-full sm:max-w-md bg-white dark:bg-[#1c1c1e] rounded-t-[2rem] sm:rounded-2xl border border-gray-200 dark:border-[#2c2c2e] overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-center pt-3 pb-1">
                      <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
                  </div>
                  
                  <div className="p-6 pt-2 pb-10">
                      <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">Choose a mode</h2>

                      <div className="space-y-1">
                          {/* Standard Search */}
                          <div 
                            onClick={() => { setSearchMode('Standard'); setIsProToggleOn(false); setShowModeSelector(false); }}
                            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${searchMode === 'Standard' && !isProToggleOn ? 'bg-gray-100 dark:bg-[#2c2c2e]' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                          >
                              <div className="mt-1"><svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                              <div>
                                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Search</h3>
                                  <p className="text-[13px] text-gray-500 dark:text-gray-400">Fast answers to everyday questions</p>
                              </div>
                          </div>

                          {/* Pro Search Toggle */}
                          <div className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${isProToggleOn ? 'bg-streekx-primary/10 border border-streekx-primary/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                              <div className="mt-1"><span className="text-xs font-bold text-streekx-primary border border-streekx-primary px-1 rounded">PRO</span></div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Try Pro Search</h3>
                                      <ToggleSwitch checked={isProToggleOn} onChange={(v) => { setIsProToggleOn(v); if(v) setSearchMode('Pro'); }} />
                                  </div>
                                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">Advanced search with 10x the sources and citations, powered by the most powerful models</p>
                              </div>
                          </div>

                          {/* Research */}
                          <div 
                            onClick={() => { setSearchMode('Research'); setIsProToggleOn(false); setShowModeSelector(false); }}
                            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${searchMode === 'Research' ? 'bg-gray-100 dark:bg-[#2c2c2e]' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                          >
                               <div className="mt-1"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>
                               <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                       <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Research</h3>
                                       <span className="text-[9px] border border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-1 rounded uppercase">Pro</span>
                                   </div>
                                   <p className="text-[13px] text-gray-500 dark:text-gray-400">Deep research on any topic</p>
                               </div>
                               {searchMode === 'Research' && <button className="text-xs font-bold bg-gray-200 dark:bg-[#333] px-3 py-1 rounded-full text-gray-900 dark:text-white">Active</button>}
                          </div>

                           {/* Labs */}
                           <div 
                            onClick={() => { setSearchMode('Labs'); setIsProToggleOn(false); setShowModeSelector(false); }}
                            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${searchMode === 'Labs' ? 'bg-gray-100 dark:bg-[#2c2c2e]' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                          >
                               <div className="mt-1"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div>
                               <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                       <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Labs</h3>
                                       <span className="text-[9px] border border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-1 rounded uppercase">Pro</span>
                                   </div>
                                   <p className="text-[13px] text-gray-500 dark:text-gray-400">Create projects from scratch</p>
                               </div>
                          </div>
                      </div>

                      <div className="h-px bg-gray-200 dark:bg-[#2c2c2e] my-4"></div>

                      {/* Incognito */}
                      <div className="flex items-center justify-between px-4 pb-4">
                           <div className="flex items-center gap-4">
                               <div className="text-gray-400">
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                               </div>
                               <div>
                                   <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Incognito mode</h3>
                                   <p className="text-[13px] text-gray-500 dark:text-gray-400">Activity won't be saved</p>
                               </div>
                           </div>
                           <ToggleSwitch checked={isIncognito} onChange={setIsIncognito} />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SOURCES MODAL (Perplexity Style) */}
      {showSources && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-fade-in" onClick={() => setShowSources(false)}>
            <div className="w-full sm:max-w-md bg-[#1c1c1e] rounded-t-[2rem] border-t border-[#2c2c2e] overflow-hidden animate-slide-up p-6 pb-12 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Handle */}
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6 opacity-40"></div>
                
                <h2 className="text-xl font-bold text-white mb-6">Add sources</h2>

                {/* Media Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-[13px] font-bold text-gray-300">Image</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span className="text-[13px] font-bold text-gray-300">Camera</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="text-[13px] font-bold text-gray-300">File</span>
                    </button>
                </div>

                {/* Toggles List */}
                <div className="space-y-1">
                    {[
                        { id: 'web', label: 'Web', sub: 'Search across the entire Internet', icon: '🌐' },
                        { id: 'academic', label: 'Academic', sub: 'Search academic papers', icon: '🎓' },
                        { id: 'finance', label: 'Finance', sub: 'Search SEC filings', icon: '💰' },
                        { id: 'social', label: 'Social', sub: 'Discussions and opinions', icon: '💬' }
                    ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#2c2c2e] cursor-pointer" onClick={() => setSourceFlags(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl opacity-80">{item.icon}</span>
                                <div>
                                    <h3 className="text-[15px] font-bold text-white">{item.label}</h3>
                                    <p className="text-[13px] text-gray-400">{item.sub}</p>
                                </div>
                            </div>
                            <ToggleSwitch colorClass="bg-[#00c2cb]" checked={sourceFlags[item.id as keyof typeof sourceFlags]} onChange={() => setSourceFlags(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <>
           <div className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
           <div className="absolute top-0 left-0 bottom-0 w-72 bg-gray-50 dark:bg-[#1c1c1e] z-50 shadow-2xl animate-slide-right flex flex-col p-6 border-r border-gray-200 dark:border-[#2c2c2e]">
                <div className="flex items-center gap-3 mb-10">
                     <div className="w-10 h-10 bg-streekx-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">S</div>
                     <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">StreekX</span>
                </div>

                <div className="space-y-3">
                    <button onClick={() => { setIsMenuOpen(false); onNavigate('HOME'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-streekx-primary/10 dark:bg-[#2c2c2e] text-streekx-primary font-bold">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        Home
                    </button>
                    <button onClick={() => { setIsMenuOpen(false); onNavigate('DISCOVERY'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] font-medium transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                        Discovery
                    </button>
                     <button onClick={() => { setIsMenuOpen(false); onNavigate('PROJECTS'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] font-medium transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                        Library
                    </button>
                </div>
           </div>
        </>
      )}

      {/* Header - Fixed at Top */}
      <div className="flex justify-between items-center px-6 pt-6 pb-2 z-30 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onOpenProfile(); }} className="w-11 h-11 rounded-full border-2 border-white dark:border-[#1c1c1e] shadow-md flex items-center justify-center bg-gray-100 dark:bg-[#2c2c2e] overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User" className="w-full h-full object-cover"/>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </button>
      </div>

      {/* Main Content - Moved Up */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar relative z-10 pt-20">
        
        {/* Top Centering Wrapper */}
        <div className="flex flex-col items-center px-6">
            
            {/* LOGO RESTORED */}
            <h2 className="text-6xl font-extrabold mb-8 tracking-tighter text-center animate-fade-in">
                <span className="text-streekx-primary">Streek</span><span className="text-gray-900 dark:text-white">X</span>
            </h2>

            {weather && (
            <div className="flex items-center gap-2 text-gray-500 mb-8 font-semibold bg-gray-100 dark:bg-[#1c1c1e] px-4 py-1 rounded-full border border-gray-200 dark:border-[#2c2c2e] text-xs">
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
                    <div className={`relative w-full h-[64px] bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#2c2c2e] group-focus-within:border-gray-400 dark:group-focus-within:border-gray-600 group-focus-within:shadow-lg flex items-center px-3 shadow-md transition-all duration-300 ${showDropdown ? 'rounded-t-[2rem] rounded-b-none border-b-0' : 'rounded-full'}`}>
                        
                        {/* LEFT: SOURCES TRIGGER */}
                        <button type="button" onClick={() => setShowSources(true)} className="p-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-full transition-colors flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        
                        <input 
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            placeholder={isListening ? "Listening..." : (isIncognito ? "Search anonymously..." : "Search...")}
                            className={`flex-1 h-full outline-none bg-transparent text-lg font-medium px-3 min-w-0 ${isListening ? 'text-streekx-primary animate-pulse' : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'}`}
                        />

                        {/* RIGHT: ACTION ICONS */}
                        <div className="flex items-center gap-1 flex-shrink-0 pr-1">
                            <button type="button" onClick={startDictation} className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500/10 text-red-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-white'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </button>

                            {hasContent ? (
                                <button 
                                    type="submit" 
                                    className="p-2.5 text-white bg-streekx-primary hover:bg-streekx-primaryDark rounded-full transition-all flex items-center justify-center animate-fade-in"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg>
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => onNavigate('ASSISTANT')} 
                                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-streekx-primary hover:bg-streekx-primary/10 rounded-full transition-all animate-fade-in"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* DROPDOWN */}
                {showDropdown && (
                    <div className="absolute top-[62px] left-0 right-0 bg-white dark:bg-[#1c1c1e] border border-t-0 border-gray-200 dark:border-[#2c2c2e] rounded-b-[2rem] shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-slide-up z-10">
                        {suggestions.map((item, idx) => (
                            <div 
                                key={idx}
                                onMouseDown={() => { onSearch(item, attachments, searchMode, isIncognito, sourceFlags); setIsFocused(false); }}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] cursor-pointer"
                            >
                                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-gray-900 dark:text-gray-300 font-medium text-lg">{item}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BUTTONS BELOW SEARCH BAR */}
            <div className="flex gap-3 justify-center w-full max-w-2xl px-6 mb-8">
                {/* Mode Button */}
                <button 
                    onClick={() => setShowModeSelector(true)}
                    className="flex-1 h-14 bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center gap-3 border border-gray-200 dark:border-[#2c2c2e] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors shadow-sm"
                >
                    {getModeIcon()}
                    <span className="font-bold text-gray-700 dark:text-gray-200">{getModeLabel()}</span>
                </button>
                
                {/* Sources Button */}
                <button 
                    onClick={() => setShowSources(true)}
                    className="flex-1 h-14 bg-white dark:bg-[#1c1c1e] rounded-full flex items-center justify-center gap-3 border border-gray-200 dark:border-[#2c2c2e] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    <span className="font-bold text-gray-700 dark:text-gray-200">Sources</span>
                </button>
            </div>
            
            {/* Trending */}
            {!isFocused && (
                <div className="w-full max-w-md text-center px-4">
                     <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Trending</p>
                     <div className="flex flex-wrap justify-center gap-2">
                        {["PSLV-C62", "Tech News", "Crypto", "SpaceX", "AI Models"].map((t, i) => (
                            <button key={i} onClick={() => onSearch(t)} className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full border border-gray-200 dark:border-[#2c2c2e] transition-colors shadow-sm hover:shadow-md">{t}</button>
                        ))}
                     </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
