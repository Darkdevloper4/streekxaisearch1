
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import SecuritySettings from './SecuritySettings';

interface ManageAccountProps {
  user: UserProfile | null;
  onBack: () => void;
  onUpdate: (user: UserProfile) => void;
  onLogout: () => void;
}

const AccountCard = ({ iconColor, icon, title, desc, onClick }: { iconColor: string, icon: React.ReactNode, title: string, desc: string, onClick: () => void }) => (
  <div onClick={onClick} className="bg-[#1c1c1e] rounded-3xl p-4 mb-4 flex items-start gap-4 border border-[#2c2c2e] active:scale-[0.98] transition-transform cursor-pointer">
       <div className={`w-12 h-12 rounded-full ${iconColor} flex items-center justify-center text-2xl flex-shrink-0`}>
           {icon}
       </div>
       <div className="flex-1 pt-1">
           <h3 className="text-[17px] font-bold text-white leading-tight mb-1">{title}</h3>
           <p className="text-[13px] text-gray-400 leading-snug">{desc}</p>
       </div>
  </div>
);

const InfoRow = ({ label, value, onClick, isImage = false }: { label: string, value: string | React.ReactNode, onClick?: () => void, isImage?: boolean }) => (
  <div onClick={onClick} className={`flex items-center justify-between py-4 px-1 ${onClick ? 'cursor-pointer hover:bg-[#2c2c2e]/30 -mx-1 px-2 rounded-lg transition-colors' : ''}`}>
       <div className="flex-1">
           <div className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
           {!isImage && <div className={`text-[16px] font-medium text-white truncate pr-4 ${value === 'Not set' ? 'text-gray-500 italic' : ''}`}>{value}</div>}
       </div>
       {isImage && (
           <div className="w-14 h-14 rounded-full bg-streekx-primary overflow-hidden border-2 border-[#2c2c2e]">
               {typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:')) ? (
                   <img src={value as string} className="w-full h-full object-cover" />
               ) : (
                   <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">{value}</div>
               )}
           </div>
       )}
       {onClick && (
           <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
       )}
  </div>
);

const Card = ({ children, title }: { children?: React.ReactNode, title?: string }) => (
  <div className="bg-[#1c1c1e] rounded-[24px] border border-[#2c2c2e] overflow-hidden mb-4">
      {title && <div className="px-5 pt-5 pb-1 text-xl font-bold text-white">{title}</div>}
      <div className="p-5 flex flex-col divide-y divide-[#2c2c2e]">
          {children}
      </div>
  </div>
);

export default function ManageAccount({ user, onBack, onUpdate, onLogout }: ManageAccountProps) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'MAIN' | 'PERSONAL' | 'SECURITY'>('MAIN');

  // Animation Timer
  useEffect(() => {
    const timer = setTimeout(() => {
        setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- PERSONAL INFO EDITOR (GOOGLE STYLE) ---
  const PersonalInfoEditor = () => {
      // Local state for addresses (mock persistence for this session since not in UserProfile type)
      const [addresses, setAddresses] = useState({
          home: 'Not set',
          work: 'Not set',
          other: 'None'
      });

      const [editingField, setEditingField] = useState<string | null>(null);
      const [editValue, setEditValue] = useState('');
      const fileInputRef = useRef<HTMLInputElement>(null);

      // Field Editor Sub-Screen
      const FieldEditor = () => {
          const handleSave = () => {
              if (!user) return;
              let updatedUser = { ...user };
              
              switch(editingField) {
                  case 'NAME': updatedUser.full_name = editValue; break;
                  case 'GENDER': updatedUser.gender = editValue as any; break;
                  case 'BIRTHDAY': updatedUser.dob = editValue; break;
                  case 'PHONE': updatedUser.mobile = editValue; break;
                  case 'ADDRESS_HOME': setAddresses(p => ({...p, home: editValue})); break;
                  case 'ADDRESS_WORK': setAddresses(p => ({...p, work: editValue})); break;
                  case 'ADDRESS_OTHER': setAddresses(p => ({...p, other: editValue})); break;
              }
              
              if (!['ADDRESS_HOME', 'ADDRESS_WORK', 'ADDRESS_OTHER'].includes(editingField || '')) {
                  onUpdate(updatedUser);
              }
              setEditingField(null);
          };

          const getLabel = () => {
              switch(editingField) {
                  case 'NAME': return 'Name';
                  case 'GENDER': return 'Gender';
                  case 'BIRTHDAY': return 'Birthday';
                  case 'PHONE': return 'Phone';
                  case 'ADDRESS_HOME': return 'Home Address';
                  case 'ADDRESS_WORK': return 'Work Address';
                  default: return 'Value';
              }
          };

          return (
              <div className="h-full bg-[#000000] flex flex-col animate-slide-right">
                  <div className="flex items-center justify-between px-4 py-4 border-b border-[#1c1c1e]">
                      <button onClick={() => setEditingField(null)} className="flex items-center text-gray-400 hover:text-white">
                          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                          Back
                      </button>
                      <h2 className="font-bold text-lg text-white">{getLabel()}</h2>
                      <div className="w-10"></div>
                  </div>
                  <div className="p-6">
                      <p className="text-gray-400 text-sm mb-6">Changes to your {getLabel().toLowerCase()} will be visible across StreekX services.</p>
                      
                      {editingField === 'GENDER' ? (
                          <div className="space-y-3">
                              {['Male', 'Female', 'Other', 'Prefer not to say'].map(opt => (
                                  <div key={opt} onClick={() => setEditValue(opt)} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center ${editValue === opt ? 'border-streekx-primary bg-streekx-primary/10' : 'border-[#2c2c2e] bg-[#1c1c1e]'}`}>
                                      <span className="text-white font-bold">{opt}</span>
                                      {editValue === opt && <div className="w-4 h-4 bg-streekx-primary rounded-full"></div>}
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="bg-[#1c1c1e] px-4 py-2 border border-[#2c2c2e] rounded-xl focus-within:border-streekx-primary focus-within:ring-1 focus-within:ring-streekx-primary transition-all">
                              <label className="text-xs text-gray-500 font-bold uppercase block mb-1">{getLabel()}</label>
                              <input 
                                  type={editingField === 'BIRTHDAY' ? 'date' : 'text'}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full bg-transparent text-white text-lg font-medium outline-none py-1"
                                  autoFocus
                              />
                          </div>
                      )}

                      <div className="mt-8 flex justify-end gap-4">
                          <button onClick={() => setEditingField(null)} className="px-6 py-2 rounded-full font-bold text-streekx-primary hover:bg-[#1c1c1e]">Cancel</button>
                          <button onClick={handleSave} className="px-8 py-2 rounded-full bg-streekx-primary text-white font-bold shadow-lg hover:bg-streekx-primaryDark">Save</button>
                      </div>
                  </div>
              </div>
          );
      };

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0] && user) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  if (ev.target?.result) {
                      onUpdate({ ...user, avatar_url: ev.target.result as string });
                  }
              };
              reader.readAsDataURL(e.target.files[0]);
          }
      };

      if (editingField) return <FieldEditor />;

      return (
          <div className="h-full bg-[#000000] flex flex-col animate-slide-right">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-[#000000] z-20 border-b border-[#1c1c1e]">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('MAIN')} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                      </button>
                      <h2 className="text-xl font-medium text-white">StreekX Account</h2>
                  </div>
                  <div className="flex gap-4 text-gray-400">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <div className="w-7 h-7 rounded-full bg-streekx-primary flex items-center justify-center text-xs font-bold text-white border border-white">
                            {user?.full_name[0]}
                        </div>
                  </div>
              </div>

              {/* Scroll Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-12">
                  <h1 className="text-4xl font-normal text-white mb-4 mt-2">Personal info</h1>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                      Manage details that make StreekX work better for you, and decide what info is visible to others
                  </p>

                  <Card>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      <InfoRow 
                        label="Profile picture" 
                        value={user?.avatar_url || user?.full_name[0] || 'A'} 
                        isImage 
                        onClick={() => fileInputRef.current?.click()} 
                      />
                      <InfoRow 
                        label="Name" 
                        value={user?.full_name || 'Not set'} 
                        onClick={() => { setEditValue(user?.full_name || ''); setEditingField('NAME'); }}
                      />
                      <InfoRow 
                        label="Birthday" 
                        value={user?.dob || 'Not set'} 
                        onClick={() => { setEditValue(user?.dob || ''); setEditingField('BIRTHDAY'); }}
                      />
                       <InfoRow 
                        label="Gender" 
                        value={user?.gender || 'Not set'} 
                        onClick={() => { setEditValue(user?.gender || ''); setEditingField('GENDER'); }}
                      />
                  </Card>

                  <Card>
                      <InfoRow 
                        label="StreekX ID" 
                        value={user?.streekx_id || 'Not set'} 
                      />
                      <InfoRow 
                        label="Phone" 
                        value={user?.mobile || 'Not set'} 
                        onClick={() => { setEditValue(user?.mobile || ''); setEditingField('PHONE'); }}
                      />
                  </Card>

                  <Card>
                      <InfoRow 
                        label="Home address" 
                        value={addresses.home} 
                        onClick={() => { setEditValue(addresses.home === 'Not set' ? '' : addresses.home); setEditingField('ADDRESS_HOME'); }}
                      />
                      <InfoRow 
                        label="Work address" 
                        value={addresses.work} 
                        onClick={() => { setEditValue(addresses.work === 'Not set' ? '' : addresses.work); setEditingField('ADDRESS_WORK'); }}
                      />
                       <InfoRow 
                        label="Other addresses" 
                        value={addresses.other === 'None' ? 'None' : addresses.other} 
                        onClick={() => { setEditValue(addresses.other === 'None' ? '' : addresses.other); setEditingField('ADDRESS_OTHER'); }}
                      />
                  </Card>

                   <Card>
                      <InfoRow 
                        label="StreekX password" 
                        value="Last changed 12 Oct 2025" 
                        onClick={() => {}}
                      />
                  </Card>

                  <div className="flex gap-3 mt-4 mb-8">
                       <button className="flex-1 py-3 rounded-full border border-[#2c2c2e] text-sm font-bold text-streekx-primary hover:bg-[#1c1c1e] flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            Search StreekX Account
                       </button>
                        <button className="flex-1 py-3 rounded-full border border-[#2c2c2e] text-sm font-bold text-streekx-primary hover:bg-[#1c1c1e] flex items-center justify-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Get help
                       </button>
                  </div>

                   <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 pb-4">
                       <span>Privacy</span>
                       <span>•</span>
                       <span>Terms</span>
                       <span>•</span>
                       <span>Help</span>
                       <span>•</span>
                       <span>About</span>
                   </div>

              </div>
          </div>
      );
  };

  // --- SPLASH SCREEN ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center animate-fade-in">
         <div className="flex flex-col items-center animate-slide-up">
            <h1 className="text-6xl font-extrabold tracking-tighter mb-4">
                <span className="text-streekx-primary">Streek</span><span className="text-white">X</span>
            </h1>
            <div className="flex items-center gap-2">
                 <div className="w-5 h-5 border-2 border-streekx-primary border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-gray-400 font-mono text-sm">Authenticating ID...</span>
            </div>
         </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  if (view === 'PERSONAL') return <PersonalInfoEditor />;
  if (view === 'SECURITY') return <SecuritySettings user={user} onBack={() => setView('MAIN')} />;

  return (
    <div className="h-[100dvh] bg-[#000000] flex flex-col animate-fade-in font-sans text-white overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-[#000000] z-20 border-b border-[#1c1c1e] flex-shrink-0">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h1 className="text-[19px] font-medium">StreekX Account</h1>
            <div className="flex gap-4">
                 <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
        </div>

        <div className="p-4 pb-12">
            
            {/* Hero Section */}
            <div className="flex flex-col items-center mt-2 mb-8">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-streekx-primary flex items-center justify-center text-5xl font-bold text-white border-4 border-[#1c1c1e] shadow-xl overflow-hidden">
                        {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : user?.full_name[0]}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-[#1c1c1e] rounded-full p-2 border border-[#2c2c2e] shadow-md">
                         <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-4 mb-1">{user?.full_name}</h2>
                <p className="text-gray-500 font-medium">{user?.streekx_id}</p>
            </div>

            {/* List Cards */}
            <AccountCard 
                onClick={() => setView('PERSONAL')}
                iconColor="bg-blue-900/40 text-blue-400"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .883-.393 1.627-1.08 1.998"></path></svg>}
                title="Personal info"
                desc="Name, StreekX ID, mobile, bio"
            />

             <AccountCard 
                onClick={() => setView('SECURITY')}
                iconColor="bg-emerald-900/40 text-emerald-400"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>}
                title="Security and access"
                desc="Password, 2-Step Verification, Recovery"
            />

            <AccountCard 
                onClick={() => {}}
                iconColor="bg-purple-900/40 text-purple-400"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                title="Data and privacy"
                desc="Search history, activity controls"
            />

             <AccountCard 
                onClick={() => {}}
                iconColor="bg-pink-900/40 text-pink-400"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                title="People and sharing"
                desc="Contacts, blocked users, workspace sharing"
            />
        </div>
    </div>
  );
}
