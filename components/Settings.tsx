
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SettingsProps {
  user: UserProfile | null;
  onBack: () => void;
  onLogout: () => void;
  onClearHistory: () => void;
  onUpdateUser: (u: UserProfile) => void;
}

// --- DATA ---
const LANGUAGES = [
    { label: 'Automatic (detect)', code: 'Automatic' },
    { label: 'English (English)', code: 'English' },
    { label: 'English (India)', code: 'English (India)' },
    { label: 'Hindi (हिंदी)', code: 'Hindi' },
    { label: 'Spanish (Español)', code: 'Spanish' },
    { label: 'French (Français)', code: 'French' },
    { label: 'German (Deutsch)', code: 'German' },
    { label: 'Japanese (日本語)', code: 'Japanese' },
    { label: 'Chinese (中文)', code: 'Chinese' },
    { label: 'Russian (Русский)', code: 'Russian' },
    { label: 'Arabic (العربية)', code: 'Arabic' },
    { label: 'Bengali (বাংলা)', code: 'Bengali' },
    { label: 'Korean (한국어)', code: 'Korean' },
    { label: 'Portuguese (Português)', code: 'Portuguese' },
    { label: 'Italian (Italiano)', code: 'Italian' },
    { label: 'Dutch (Nederlands)', code: 'Dutch' },
    { label: 'Turkish (Türkçe)', code: 'Turkish' },
];

const SPEECH_LOCALES = [
    { label: 'English (US)', code: 'en-US' },
    { label: 'English (UK)', code: 'en-GB' },
    { label: 'English (India)', code: 'en-IN' },
    { label: 'Hindi (India)', code: 'hi-IN' },
    { label: 'Spanish (Spain)', code: 'es-ES' },
    { label: 'French (France)', code: 'fr-FR' },
    { label: 'German (Germany)', code: 'de-DE' },
    { label: 'Japanese (Japan)', code: 'ja-JP' },
    { label: 'Korean (South Korea)', code: 'ko-KR' },
    { label: 'Mandarin (China)', code: 'zh-CN' },
    { label: 'Russian (Russia)', code: 'ru-RU' },
];

const IMAGE_MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash', desc: 'Fast, efficient generation', badge: 'Fast' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro Image', desc: 'High fidelity, complex details', badge: 'Pro' },
    { id: 'imagen-3.0-generate-001', name: 'Imagen 3', desc: 'Photorealistic, artistic', badge: 'Creative' }
];

const VOICE_STYLES = ['Kyrin', 'Velox', 'Tylis', 'Torma', 'Mylva', 'Syla', 'Gravo', 'Solva'];

const CATEGORIES = [
    { id: 'sports', label: 'Sports', desc: 'Updates, breaking news, and live scores', icon: '🏀' },
    { id: 'finance', label: 'Finance', desc: 'Watchlist updates and summaries', icon: '🏦' },
    { id: 'tech', label: 'Technology', desc: 'Latest innovations and gadget reviews', icon: '🚀' },
    { id: 'entertainment', label: 'Entertainment', desc: 'Movies, music, and celebrity news', icon: '🎬' },
    { id: 'science', label: 'Science', desc: 'Discoveries and research news', icon: '🔬' },
    { id: 'politics', label: 'Politics', desc: 'Global affairs and policy updates', icon: '⚖️' },
];

// --- HELPER COMPONENTS ---

const SectionHeader = ({ label }: { label: string }) => (
  <h3 className="px-4 mt-8 mb-3 text-[12px] font-extrabold text-streekx-primary uppercase tracking-widest opacity-80">
    {label}
  </h3>
);

const SettingRow = ({ label, value, onClick, action, isDestructive = false }: { label: string, value?: string, onClick?: () => void, action?: React.ReactNode, isDestructive?: boolean }) => (
  <div onClick={onClick} className={`px-4 py-4 flex items-center justify-between transition-colors ${onClick ? 'cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5' : ''}`}>
    <div className="flex flex-col">
      <span className={`text-[17px] font-medium ${isDestructive ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{label}</span>
      {value && <span className="text-[14px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{value}</span>}
    </div>
    <div className="flex items-center gap-3">
        {action}
        {onClick && !action && (
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        )}
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(!enabled); }} 
        className={`w-[52px] h-[32px] rounded-full p-1 transition-all duration-300 relative focus:outline-none ${enabled ? 'bg-streekx-primary' : 'bg-gray-300 dark:bg-[#3a3a3c]'}`}
    >
        <div className={`w-[24px] h-[24px] bg-white rounded-full shadow-lg transform transition-transform duration-300 ${enabled ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
    </button>
);

// --- SUB-SCREENS ---

const SelectionScreen = ({ title, options, selectedValue, onSelect, onBack, type = 'list' }: { title: string, options: any[], selectedValue: any, onSelect: (val: any) => void, onBack: () => void, type?: 'list' | 'radio' | 'models' }) => {
    
    // Helper for voice preview
    const playPreview = (style: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Hi, I'm ${style}.`);
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        const idx = VOICE_STYLES.indexOf(style) % Math.max(1, voices.length);
        if (voices[idx]) utterance.voice = voices[idx];
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans text-gray-900 dark:text-gray-200">
            <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] bg-gray-50 dark:bg-[#000000] sticky top-0 z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto no-scrollbar pb-20">
                {options.map(opt => {
                    const isSelected = type === 'models' ? selectedValue === opt.id : selectedValue === (opt.code || opt);
                    const val = type === 'models' ? opt.id : (opt.code || opt);
                    const label = opt.label || opt.name || opt;

                    return (
                        <div 
                            key={val} 
                            onClick={() => { onSelect(val); if(type !== 'radio') onBack(); }}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${isSelected ? 'bg-white dark:bg-[#1c1c1e] border-streekx-primary' : 'bg-transparent border-transparent hover:bg-gray-200 dark:hover:bg-[#1c1c1e]'}`}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    {type === 'radio' && (
                                        <button onClick={(e) => { e.stopPropagation(); playPreview(label); }} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center text-gray-500 hover:text-white">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </button>
                                    )}
                                    <span className={`font-bold text-[16px] ${isSelected ? 'text-streekx-primary' : 'text-gray-900 dark:text-white'}`}>{label}</span>
                                    {opt.badge && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold uppercase">{opt.badge}</span>}
                                </div>
                                {opt.desc && <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 ml-11">{opt.desc}</span>}
                            </div>
                            
                            {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-streekx-primary flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            ) : (
                                type === 'radio' && <div className="w-6 h-6 rounded-full border-2 border-gray-600"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PersonalizeScreen = ({ interests, onToggle, onBack }: { interests: string[], onToggle: (id: string) => void, onBack: () => void }) => (
    <div className="h-full bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans text-gray-900 dark:text-gray-200">
        <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] bg-gray-50 dark:bg-[#000000] sticky top-0 z-20">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">Personalise</h2>
        </div>
        <div className="p-4">
            <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Categories</h3>
            <div className="space-y-3">
                {CATEGORIES.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-[#2c2c2e]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] flex items-center justify-center text-xl">
                                {cat.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-[16px] text-gray-900 dark:text-white">{cat.label}</h4>
                                <p className="text-[13px] text-gray-500 dark:text-gray-400">{cat.desc}</p>
                            </div>
                        </div>
                        <ToggleSwitch enabled={interests.includes(cat.id)} onChange={() => onToggle(cat.id)} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const VoiceModeScreen = ({ selected, onSelect, onBack }: { selected: string, onSelect: (v: string) => void, onBack: () => void }) => (
    <div className="h-full bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans text-gray-900 dark:text-gray-200">
        <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] bg-gray-50 dark:bg-[#000000] sticky top-0 z-20">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">Voice Mode</h2>
        </div>
        <div className="p-6 space-y-6">
             <div onClick={() => onSelect('PUSH')} className="flex items-start gap-4 cursor-pointer">
                 <div className={`w-6 h-6 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${selected === 'PUSH' ? 'border-streekx-primary' : 'border-gray-500'}`}>
                     {selected === 'PUSH' && <div className="w-3 h-3 bg-streekx-primary rounded-full"></div>}
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-white">Push to talk</h3>
                     <p className="text-gray-400 text-sm mt-1">Press and hold the button to ask questions</p>
                 </div>
             </div>
             <div onClick={() => onSelect('FREE')} className="flex items-start gap-4 cursor-pointer">
                 <div className={`w-6 h-6 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${selected === 'FREE' ? 'border-streekx-primary' : 'border-gray-500'}`}>
                     {selected === 'FREE' && <div className="w-3 h-3 bg-streekx-primary rounded-full"></div>}
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-white">Hands free</h3>
                     <p className="text-gray-400 text-sm mt-1">Automatic speech detection</p>
                 </div>
             </div>
        </div>
    </div>
);

const CapabilitiesScreen = ({ onBack }: { onBack: () => void }) => {
    const caps = [
        { icon: '🌐', title: 'Pro Search', desc: 'Real-time web access with citations and deep research mode.' },
        { icon: '🧠', title: 'Reasoning', desc: 'Advanced logic for math, coding, and complex problem solving.' },
        { icon: '👁️', title: 'Vision', desc: 'Analyze images, screenshots, and documents instantly.' },
        { icon: '🎨', title: 'Image Generation', desc: 'Create stunning visuals using the latest diffusion models.' },
        { icon: '🎙️', title: 'Voice Mode', desc: 'Fluid, natural conversations with human-like latency.' },
        { icon: '📁', title: 'File Analysis', desc: 'Upload PDFs, CSVs, and text files for summarization and query.' }
    ];

    return (
        <div className="h-full bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans">
            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] bg-gray-50 dark:bg-[#000000] sticky top-0 z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">Capabilities</h2>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                    {caps.map((cap, i) => (
                        <div key={i} className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl border border-gray-200 dark:border-[#2c2c2e] flex items-start gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-streekx-primary/10 flex items-center justify-center text-xl flex-shrink-0 text-streekx-primary">
                                {cap.icon}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{cap.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{cap.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-br from-streekx-primary/10 to-transparent rounded-3xl border border-streekx-primary/20 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 bg-streekx-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">S</div>
                    </div>
                    <h3 className="text-lg font-bold text-streekx-primary mb-2">Powered by Gemini</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        StreekX leverages the most advanced multimodal models to understand text, images, audio, and video natively with low latency.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- MAIN SETTINGS COMPONENT ---
export default function Settings({ user, onBack, onLogout, onClearHistory, onUpdateUser }: SettingsProps) {
  const { theme, setTheme } = useTheme();

  // --- STATE ---
  const [settings, setSettings] = useState(() => {
     const saved = localStorage.getItem('streekx_settings');
     return saved ? JSON.parse(saved) : {
         incognito: false,
         notifications: true,
         dataRetention: true,
         imageModel: 'gemini-2.5-flash-image', // Default to valid model
         aiLanguage: 'Automatic',
         speechRecognition: 'en-US',
         voiceStyle: 'Kyrin',
         voiceMode: 'FREE',
         assistantEnabled: true,
         assistantLanguage: 'English (US)',
         accentColor: '#8d6e63',
         interests: []
     };
  });

  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');
  const [showCapabilities, setShowCapabilities] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
      localStorage.setItem('streekx_settings', JSON.stringify(settings));
  }, [settings]);

  // --- HANDLERS ---
  const updateSetting = (key: string, value: any) => {
      setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveName = () => {
    if (user && editName.trim()) {
        onUpdateUser({ ...user, username: editName });
        setIsEditingName(false);
    }
  };

  const openLink = (url: string) => {
      window.open(url, '_blank');
  };
  
  // Theme sub-menu handler wrapper
  const handleThemeSelect = (val: string) => {
      const mapped = val === 'Dark Theme' ? 'dark' : val === 'Light Theme' ? 'light' : 'system';
      setTheme(mapped as any);
  };
  
  const currentThemeLabel = theme === 'dark' ? 'Dark Theme' : theme === 'light' ? 'Light Theme' : 'System Default';

  // --- SUB-SCREEN RENDER ---
  if (showCapabilities) {
      return <CapabilitiesScreen onBack={() => setShowCapabilities(false)} />;
  }

  if (activeSubMenu) {
      if (activeSubMenu === 'theme') {
          return (
            <SelectionScreen 
                title="Theme"
                options={['Dark Theme', 'Light Theme', 'System Default']}
                selectedValue={currentThemeLabel}
                onSelect={handleThemeSelect}
                onBack={() => setActiveSubMenu(null)}
            />
          );
      }
      if (activeSubMenu === 'image_model') {
          return (
              <SelectionScreen 
                  title="Image Generation Model"
                  options={IMAGE_MODELS}
                  selectedValue={settings.imageModel}
                  onSelect={(val) => updateSetting('imageModel', val)}
                  onBack={() => setActiveSubMenu(null)}
                  type="models"
              />
          );
      }
      if (activeSubMenu === 'ai_language') {
          return (
              <SelectionScreen 
                  title="AI Language"
                  options={LANGUAGES}
                  selectedValue={settings.aiLanguage}
                  onSelect={(val) => updateSetting('aiLanguage', val)}
                  onBack={() => setActiveSubMenu(null)}
              />
          );
      }
      if (activeSubMenu === 'personalize') {
          return (
              <PersonalizeScreen 
                  interests={settings.interests || []}
                  onToggle={(id) => {
                      const current = settings.interests || [];
                      const next = current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id];
                      updateSetting('interests', next);
                  }}
                  onBack={() => setActiveSubMenu(null)}
              />
          );
      }
      if (activeSubMenu === 'speech_rec') {
          return (
              <SelectionScreen 
                  title="Speech Recognition"
                  options={SPEECH_LOCALES}
                  selectedValue={settings.speechRecognition}
                  onSelect={(val) => updateSetting('speechRecognition', val)}
                  onBack={() => setActiveSubMenu(null)}
              />
          );
      }
      if (activeSubMenu === 'voice_style') {
          return (
              <SelectionScreen 
                  title="Voice Style"
                  options={VOICE_STYLES}
                  selectedValue={settings.voiceStyle}
                  onSelect={(val) => updateSetting('voiceStyle', val)}
                  onBack={() => setActiveSubMenu(null)}
                  type="radio"
              />
          );
      }
      if (activeSubMenu === 'voice_mode') {
          return (
              <VoiceModeScreen 
                  selected={settings.voiceMode || 'FREE'} 
                  onSelect={(v) => { updateSetting('voiceMode', v); setActiveSubMenu(null); }}
                  onBack={() => setActiveSubMenu(null)} 
              />
          );
      }
  }

  // --- MAIN RENDER ---
  return (
    <div className="h-[100dvh] bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans text-gray-900 dark:text-gray-200 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] sticky top-0 bg-gray-50 dark:bg-[#000000] z-20 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 rounded-full hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-40 no-scrollbar">
        
        {/* ACCOUNT SECTION */}
        <SectionHeader label="Account" />
        
        {isEditingName ? (
            <div className="px-4 py-4 bg-white dark:bg-[#1c1c1e] mx-4 rounded-xl border border-gray-200 dark:border-[#2c2c2e] animate-fade-in shadow-sm">
                <label className="text-xs text-streekx-primary font-bold mb-2 block uppercase tracking-wide">Edit Username</label>
                <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#2c2c2e] text-gray-900 dark:text-white p-3 rounded-xl outline-none focus:border-streekx-primary mb-4 font-bold"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEditingName(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">Cancel</button>
                    <button onClick={handleSaveName} className="px-4 py-2 rounded-lg bg-streekx-primary text-white text-sm font-bold">Save</button>
                </div>
            </div>
        ) : (
            <SettingRow 
                label="Username" 
                value={user?.username || '@guest'} 
                onClick={() => { setEditName(user?.username || ''); setIsEditingName(true); }}
            />
        )}

        <SettingRow 
            label="StreekX ID" 
            value={user?.streekx_id || 'Not signed in'} 
        />

        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => updateSetting('incognito', !settings.incognito)}>
            <div className="flex flex-col max-w-[80%]">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">Incognito Mode</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug mt-1">Create anonymous threads that do not appear in your library and expire after 24 hours.</span>
            </div>
            <ToggleSwitch enabled={settings.incognito} onChange={(v) => updateSetting('incognito', v)} />
        </div>

        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => updateSetting('notifications', !settings.notifications)}>
             <div className="flex flex-col">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">Notifications</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Daily threads from Discover</span>
            </div>
            <ToggleSwitch enabled={settings.notifications} onChange={(v) => updateSetting('notifications', v)} />
        </div>

        {/* PROFILE SECTION */}
        <SectionHeader label="Profile" />
        
        <SettingRow 
            label="Image Generation Model" 
            value={IMAGE_MODELS.find(m => m.id === settings.imageModel)?.name || 'Default'} 
            onClick={() => setActiveSubMenu('image_model')}
        />
        <SettingRow 
            label="AI Language" 
            value={settings.aiLanguage} 
            onClick={() => setActiveSubMenu('ai_language')}
        />
        
        {/* Personalize */}
        <SettingRow 
            label="Personalize" 
            value="Categories"
            onClick={() => setActiveSubMenu('personalize')}
        />

        <SettingRow 
            label="Speech Recognition" 
            value={SPEECH_LOCALES.find(s => s.code === settings.speechRecognition)?.label || settings.speechRecognition} 
            onClick={() => setActiveSubMenu('speech_rec')}
        />
        <SettingRow 
            label="Voice Style" 
            value={settings.voiceStyle} 
            onClick={() => setActiveSubMenu('voice_style')}
        />
        <SettingRow 
            label="Voice Mode" 
            value={settings.voiceMode === 'FREE' ? 'Hands free' : 'Push to talk'} 
            onClick={() => setActiveSubMenu('voice_mode')}
        />

        {/* APPEARANCE SECTION */}
        <SectionHeader label="Appearance" />
        <SettingRow 
            label="Theme" 
            value={currentThemeLabel} 
            onClick={() => setActiveSubMenu('theme')}
        />

        {/* ASSISTANT SECTION */}
        <SectionHeader label="Assistant" />
        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => {
            updateSetting('assistantEnabled', !settings.assistantEnabled);
            if (!settings.assistantEnabled) {
                alert("Redirecting to System Assistant Settings...\nPlease select 'StreekX' as your default digital assistant app.");
            }
        }}>
            <div className="flex flex-col">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">Enable Assistant</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Wake with "Hey StreekX"</span>
            </div>
            <ToggleSwitch enabled={settings.assistantEnabled} onChange={(v) => {
                updateSetting('assistantEnabled', v);
                if (v) {
                     alert("Redirecting to System Assistant Settings...\nPlease select 'StreekX' as your default digital assistant app.");
                }
            }} />
        </div>
        
        <SettingRow 
            label="Capabilities" 
            value="View features"
            onClick={() => setShowCapabilities(true)} 
        />

        {/* DATA & PRIVACY - Clear History Moved Here */}
        <SectionHeader label="Data & Privacy" />
        
        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => updateSetting('dataRetention', !settings.dataRetention)}>
            <div className="flex flex-col max-w-[80%]">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">AI Data Retention</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug mt-1">Allow StreekX to use search patterns to improve AI models.</span>
            </div>
            <ToggleSwitch enabled={settings.dataRetention} onChange={(v) => updateSetting('dataRetention', v)} />
        </div>

        <SettingRow label="Clear Search History" onClick={() => { if(confirm("Clear all search history? This action cannot be undone.")) onClearHistory(); }} isDestructive />

        {/* SUPPORT / LEGAL */}
        <SectionHeader label="Follow Us" />
        <SettingRow label="X (Twitter)" onClick={() => openLink('https://twitter.com')} action={<span className="text-gray-500 text-sm">@streekx</span>} />
        <SettingRow label="Discord" onClick={() => openLink('https://discord.com')} action={<span className="text-gray-500 text-sm">Join Server</span>} />

        <SectionHeader label="More" />
        <SettingRow label="Privacy policy" onClick={() => openLink('https://streekx.ai/privacy')} />
        <SettingRow label="Terms of service" onClick={() => openLink('https://streekx.ai/terms')} />

        <div className="mt-8 mb-8 px-4">
             <button 
                onClick={() => { 
                    const confirmText = prompt("Type 'DELETE' to permanently delete your account.");
                    if (confirmText === 'DELETE') {
                        onLogout();
                        alert("Account deleted.");
                    }
                }} 
                className="text-[17px] font-bold text-red-500 text-left w-full py-3 hover:bg-red-500/10 rounded-xl transition-colors px-2"
             >
                 Delete Account
             </button>
             <p className="text-[13px] text-gray-500 mt-1 px-2">Permanently remove your account and all associated data from StreekX servers.</p>
        </div>

        {/* LOGOUT - MOVED TO BOTTOM */}
        <div className="px-4 pb-8">
             <button 
                onClick={() => { if(confirm("Are you sure you want to logout?")) onLogout(); }}
                className="w-full py-4 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] text-red-500 font-bold text-lg hover:bg-red-900/10 transition-colors active:scale-95"
             >
                 Log Out
             </button>
        </div>

        <div className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-600 pb-12 pt-4 uppercase tracking-widest">
            StreekX v2.4.0 (Build 302)
        </div>

      </div>
    </div>
  );
}
