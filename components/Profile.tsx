
import React, { useState } from 'react';
import { UserProfile, SearchSession, Screen } from '../types';

interface ProfileProps {
  user: UserProfile | null;
  otherAccounts: UserProfile[];
  onSwitchAccount: (u: UserProfile) => void;
  onAddAccount: () => void;
  sessions: SearchSession[];
  onClose: () => void;
  onSignOut: () => void;
  onOpenSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNavigate: (screen: Screen) => void;
}

export default function Profile({ user, otherAccounts, onSwitchAccount, onAddAccount, sessions, onClose, onSignOut, onOpenSession, onDeleteSession, onNavigate }: ProfileProps) {
  const [isAccountListOpen, setIsAccountListOpen] = useState(false);

  const ShortcutButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
      <button 
        onClick={onClick} 
        className="flex flex-col items-center justify-center h-20 rounded-[24px] bg-[#1c1c1e] border border-[#2c2c2e] active:scale-95 transition-all gap-2 w-full hover:bg-[#252527]"
      >
          <div className="text-2xl mb-1 text-gray-300">
              {icon}
          </div>
          <span className="text-[12px] font-bold text-gray-200">{label}</span>
      </button>
  );

  const MenuRow = ({ icon, label, onClick, isDestructive = false }: { icon: React.ReactNode, label: string, onClick?: () => void, isDestructive?: boolean }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 hover:bg-[#252527] transition-colors ${isDestructive ? 'text-red-400' : 'text-gray-200'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`${isDestructive ? 'text-red-400' : 'text-gray-400'}`}>
                {icon}
            </div>
            <span className="font-bold text-[15px]">{label}</span>
        </div>
        {!isDestructive && <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col animate-slide-up font-sans text-white h-[100dvh]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#000000] border-b border-[#1c1c1e] shrink-0">
           <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full active:scale-95 transition-transform bg-[#1c1c1e]">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
           <h1 className="text-lg font-extrabold tracking-tight">StreekX</h1>
           <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-5 overflow-y-auto no-scrollbar pb-32">
          
          {/* PROFILE CARD */}
          <div className="bg-[#1c1c1e] rounded-[2rem] border border-[#2c2c2e] mt-4 mb-6 relative p-5 flex flex-col items-center text-center flex-shrink-0">
              
               {/* Identity Section (Clickable to toggle list) */}
               <div className="w-full flex flex-col items-center cursor-pointer" onClick={() => setIsAccountListOpen(!isAccountListOpen)}>
                  <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full bg-[#252527] flex items-center justify-center text-gray-300 text-3xl border border-[#3a3a3c] shadow-lg overflow-hidden">
                          {user?.avatar_url ? (
                              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover"/>
                          ) : (
                              user?.full_name?.[0] || 'G'
                          )}
                      </div>
                      {/* Camera Icon */}
                      {user && (
                        <div className="absolute bottom-0 right-0 bg-streekx-primary rounded-full p-1.5 border-4 border-[#1c1c1e]">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-2 mb-1 px-4 py-1 rounded-full hover:bg-white/5 transition-colors">
                      <h2 className="text-xl font-bold text-white truncate max-w-[250px]">
                          {user?.full_name || 'Guest User'}
                      </h2>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAccountListOpen ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                  </div>
                  
                  <p className="text-gray-500 font-medium text-sm mb-6">
                      {user?.streekx_id || 'Sign in to sync your history'}
                  </p>
              </div>

              {/* EXPANDED: Account List */}
              {isAccountListOpen ? (
                <div className="w-full border-t border-[#2c2c2e] pt-4 animate-fade-in">
                    <div className="space-y-1 mb-4">
                         {otherAccounts.map(acc => (
                             <div 
                                key={acc.id} 
                                onClick={() => { onSwitchAccount(acc); setIsAccountListOpen(false); }} 
                                className="flex items-center gap-4 px-3 py-3 hover:bg-[#2c2c2e] cursor-pointer rounded-xl transition-colors text-left"
                             >
                                 <div className="w-9 h-9 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-xs border border-gray-600">
                                     {acc.avatar_url ? <img src={acc.avatar_url} className="w-full h-full object-cover rounded-full" /> : acc.full_name[0]}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h4 className="font-bold text-white text-sm truncate">{acc.full_name}</h4>
                                     <p className="text-xs text-gray-500 truncate">{acc.streekx_id}</p>
                                 </div>
                             </div>
                         ))}
                    </div>

                    <button onClick={onAddAccount} className="w-full flex items-center gap-4 px-3 py-3 hover:bg-[#2c2c2e] rounded-xl text-left transition-colors">
                         <div className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                         </div>
                         <span className="font-bold text-sm text-gray-300">Add another account</span>
                     </button>

                     {user && (
                         <button onClick={onSignOut} className="w-full flex items-center gap-4 px-3 py-3 hover:bg-[#2c2c2e] rounded-xl text-left transition-colors mt-1">
                             <div className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                             </div>
                             <span className="font-bold text-sm text-gray-300">Sign out</span>
                         </button>
                     )}
                     
                     <div className="mt-4 pt-2 border-t border-[#2c2c2e]">
                        <button onClick={() => setIsAccountListOpen(false)} className="text-xs font-bold text-gray-500 py-2 w-full hover:text-white">Close</button>
                     </div>
                </div>
              ) : (
                /* COLLAPSED: Main Action Buttons */
                <div className="w-full animate-fade-in">
                    {user ? (
                      <button 
                          onClick={() => onNavigate('ACCOUNT')}
                          className="w-full py-3 rounded-full border border-gray-600 text-[14px] font-bold text-white hover:bg-[#2c2c2e] transition-all active:scale-[0.98]"
                      >
                          Manage your StreekX Account
                      </button>
                    ) : (
                       <div className="w-full space-y-3">
                          <button 
                              onClick={onAddAccount}
                              className="w-full py-3 rounded-full bg-streekx-primary text-[14px] font-bold text-white hover:bg-streekx-primaryDark transition-all active:scale-[0.98] shadow-lg"
                          >
                              Sign In
                          </button>
                           <button 
                              onClick={onAddAccount}
                              className="w-full py-3 rounded-full border border-gray-600 text-[14px] font-bold text-streekx-primary hover:bg-[#2c2c2e] transition-all active:scale-[0.98]"
                          >
                              Create Account
                          </button>
                       </div>
                    )}
                </div>
              )}
          </div>

          {/* Shortcuts Grid - Only show if list closed to save space */}
          {!isAccountListOpen && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6 flex-shrink-0">
                    <ShortcutButton 
                            onClick={() => onNavigate('HISTORY')}
                            label="History"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    />
                    <ShortcutButton 
                            onClick={() => onNavigate('PROJECTS')}
                            label="Projects"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>}
                    />
                    <ShortcutButton 
                            onClick={() => onNavigate('WORKSPACE')}
                            label="Space"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                    />
                    <ShortcutButton 
                            onClick={() => onNavigate('NOTIFICATIONS')}
                            label="Alerts"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>}
                    />
                </div>

                {/* Menu List - Settings & Help (Restored & footer removed) */}
                <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden border border-[#2c2c2e] mb-8 flex-shrink-0">
                    <MenuRow 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                        label="Settings"
                        onClick={() => onNavigate('SETTINGS')}
                    />
                    <div className="h-px bg-[#2c2c2e] mx-6"></div>
                    <MenuRow 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                        label="Help & Feedback"
                        onClick={() => onNavigate('FEEDBACK')}
                    />
                </div>
              </>
          )}

      </div>
    </div>
  );
}
