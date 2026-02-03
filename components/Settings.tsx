
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

// --- SUB-SCREEN FOR SELECTIONS ---
const OptionsScreen = ({ title, options, selected, onSelect, onBack }: { title: string, options: string[], selected: string, onSelect: (val: string) => void, onBack: () => void }) => (
    <div className="h-full bg-gray-50 dark:bg-[#000000] flex flex-col animate-slide-right font-sans text-gray-900 dark:text-gray-200">
        <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-[#1c1c1e] bg-gray-50 dark:bg-[#000000] sticky top-0 z-20">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-[#1c1c1e] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h2 className="ml-3 text-[19px] font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
        </div>
        <div className="p-4 space-y-2">
            {options.map(opt => (
                <button 
                    key={opt} 
                    onClick={() => { onSelect(opt); onBack(); }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${selected === opt ? 'bg-white dark:bg-[#1c1c1e] border-streekx-primary text-streekx-primary' : 'bg-transparent border-transparent hover:bg-gray-200 dark:hover:bg-[#1c1c1e] text-gray-900 dark:text-gray-200'}`}
                >
                    <span className="font-bold text-[16px]">{opt}</span>
                    {selected === opt && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                </button>
            ))}
        </div>
    </div>
);

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
         // theme handled by context now
         imageModel: 'Gemini Imagen 3',
         aiLanguage: 'Automatic',
         speechRecognition: 'System Default',
         voiceStyle: 'Kyrin',
         voiceMode: 'Hands Free',
         assistantEnabled: true,
         assistantLanguage: 'English (US)',
         accentColor: '#8d6e63'
     };
  });

  const [activeSubMenu, setActiveSubMenu] = useState<{ id: string, title: string, options: string[], key: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');

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

  const openSubMenu = (id: string, title: string, options: string[], key: string) => {
      setActiveSubMenu({ id, title, options, key });
  };
  
  // Theme sub-menu handler wrapper
  const handleThemeSelect = (val: string) => {
      const mapped = val === 'Dark Theme' ? 'dark' : val === 'Light Theme' ? 'light' : 'system';
      setTheme(mapped as any);
  };
  
  const currentThemeLabel = theme === 'dark' ? 'Dark Theme' : theme === 'light' ? 'Light Theme' : 'System Default';

  // --- SUB-SCREEN RENDER ---
  if (activeSubMenu) {
      // Special check for Theme menu to use Context
      if (activeSubMenu.key === 'theme') {
          return (
            <OptionsScreen 
                title={activeSubMenu.title}
                options={activeSubMenu.options}
                selected={currentThemeLabel}
                onSelect={handleThemeSelect}
                onBack={() => setActiveSubMenu(null)}
            />
          );
      }
      return (
          <OptionsScreen 
              title={activeSubMenu.title}
              options={activeSubMenu.options}
              selected={settings[activeSubMenu.key]}
              onSelect={(val) => updateSetting(activeSubMenu.key, val)}
              onBack={() => setActiveSubMenu(null)}
          />
      );
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

        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => updateSetting('dataRetention', !settings.dataRetention)}>
            <div className="flex flex-col max-w-[80%]">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">AI Data Retention</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug mt-1">Allow StreekX to use search patterns to improve AI models.</span>
            </div>
            <ToggleSwitch enabled={settings.dataRetention} onChange={(v) => updateSetting('dataRetention', v)} />
        </div>

        <SettingRow label="Clear History" onClick={() => { if(confirm("Clear all search history?")) onClearHistory(); }} isDestructive />
        <SettingRow label="Logout" onClick={() => { if(confirm("Are you sure you want to logout?")) onLogout(); }} isDestructive />

        {/* PROFILE SECTION */}
        <SectionHeader label="Profile" />
        
        <SettingRow 
            label="Image Generation Model" 
            value={settings.imageModel} 
            onClick={() => openSubMenu('img_model', 'Image Model', ['Gemini Imagen 3', 'DALL-E 3 (Simulated)', 'Stable Diffusion XL', 'Midjourney V6 (Alpha)'], 'imageModel')}
        />
        <SettingRow 
            label="AI Language" 
            value={settings.aiLanguage} 
            onClick={() => openSubMenu('ai_lang', 'AI Language', ['Automatic', 'English (US)', 'English (UK)', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'], 'aiLanguage')}
        />
        
        {/* Simple Color Picker for Personalize */}
        <div className="px-4 py-4 flex items-center justify-between">
            <span className="text-[17px] text-gray-900 dark:text-white font-medium">Personalize</span>
            <div className="flex gap-2">
                {['#8d6e63', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'].map(color => (
                    <button 
                        key={color}
                        onClick={() => updateSetting('accentColor', color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${settings.accentColor === color ? 'border-gray-900 dark:border-white scale-125' : 'border-transparent scale-100'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>

        <SettingRow 
            label="Speech Recognition" 
            value={settings.speechRecognition} 
            onClick={() => openSubMenu('speech_rec', 'Speech Recognition', ['System Default', 'StreekX Whisper', 'Deepgram Nova'], 'speechRecognition')}
        />
        <SettingRow 
            label="Voice Style" 
            value={settings.voiceStyle} 
            onClick={() => openSubMenu('voice_style', 'Voice Style', ['Kyrin', 'Amber', 'Echo', 'Alloy', 'Fable', 'Onyx'], 'voiceStyle')}
        />
        <SettingRow 
            label="Voice Mode" 
            value={settings.voiceMode} 
            onClick={() => openSubMenu('voice_mode', 'Voice Mode', ['Hands Free', 'Press to Talk', 'Continuous'], 'voiceMode')}
        />

        {/* APPEARANCE SECTION */}
        <SectionHeader label="Appearance" />
        <SettingRow 
            label="Theme" 
            value={currentThemeLabel} 
            onClick={() => openSubMenu('theme', 'Theme', ['Dark Theme', 'Light Theme', 'System Default'], 'theme')}
        />

        {/* ASSISTANT SECTION */}
        <SectionHeader label="Assistant" />
        <div className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-[#1c1c1e]" onClick={() => updateSetting('assistantEnabled', !settings.assistantEnabled)}>
            <div className="flex flex-col">
                <span className="text-[17px] text-gray-900 dark:text-white font-medium">Enable Assistant</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Wake with "Hey StreekX"</span>
            </div>
            <ToggleSwitch enabled={settings.assistantEnabled} onChange={(v) => updateSetting('assistantEnabled', v)} />
        </div>
        
        <SettingRow label="Capabilities" onClick={() => alert("StreekX Assistant can:\n- Search the web\n- Manage projects\n- Create images\n- Summarize content")} />
        <SettingRow 
            label="Assistant Language" 
            value={settings.assistantLanguage}
            onClick={() => openSubMenu('assist_lang', 'Assistant Language', ['English (US)', 'English (IN)', 'English (UK)', 'Hindi'], 'assistantLanguage')}
        />

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

        <div className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-600 pb-12 pt-4 uppercase tracking-widest">
            StreekX v2.4.0 (Build 302)
        </div>

      </div>
    </div>
  );
}
