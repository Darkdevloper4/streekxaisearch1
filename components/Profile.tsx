
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
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const ShortcutButton = ({ icon, label, onClick, color = "bg-[#1c1c1e] text-gray-400" }: { icon: React.ReactNode, label: string, onClick: () => void, color?: string }) => (
      <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center py-4 px-2 rounded-3xl border border-[#2c2c2e] active:scale-[0.98] transition-all gap-2 w-full ${color}`}
      >
          <div className="text-2xl">
              {icon}
          </div>
          <span className="text-[13px] font-bold text-gray-200">{label}</span>
      </button>
  );

  const MenuRow = ({ icon, label, onClick, isDestructive = false }: { icon: React.ReactNode, label: string, onClick?: () => void, isDestructive?: boolean }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-5 hover:bg-[#2c2c2e] transition-colors ${isDestructive ? 'text-red-400' : 'text-gray-200'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`${isDestructive ? 'text-red-400' : 'text-gray-400'}`}>
                {icon}
            </div>
            <span className="font-bold text-[17px]">{label}</span>
        </div>
        {!isDestructive && <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col animate-slide-up font-sans text-white overflow-hidden">
      
      {showAccountSwitcher && (
          <div className="absolute inset-0 z-[60] bg-black/80 flex items-end justify-center animate-fade-in" onClick={() => setShowAccountSwitcher(false)}>
              <div 
                className="w-full bg-[#1c1c1e] rounded-t-[2rem] overflow-hidden shadow-2xl animate-slide-up relative max-h-[80vh] flex flex-col pb-safe"
                onClick={(e) => e.stopPropagation()} 
              >
                  <div className="flex items-center justify-between p-5 border-b border-[#2c2c2e]">
                      <h2 className="text-xl font-bold text-white pl-2">Switch Account</h2>
                      <button onClick={() => setShowAccountSwitcher(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-[#2c2c2e]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto p-3 space-y-2">
                      {otherAccounts.map(acc => (
                          <div key={acc.id} onClick={() => { onSwitchAccount(acc); setShowAccountSwitcher(false); }} className="flex items-center gap-4 px-4 py-4 hover:bg-[#2c2c2e] cursor-pointer rounded-2xl bg-black/20 border border-transparent hover:border-gray-700">
                                <div className="w-12 h-12 rounded-full bg-purple-900 text-white flex items-center justify-center text-lg font-bold overflow-hidden border-2 border-gray-700">
                                    {acc.avatar_url ? <img src={acc.avatar_url} className="w-full h-full object-cover"/> : acc.full_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-lg truncate">{acc.full_name}</h4>
                                    <p className="text-sm text-gray-500 truncate">{acc.streekx_id}</p>
                                </div>
                          </div>
                      ))}
                      <div onClick={() => { setShowAccountSwitcher(false); onAddAccount(); }} className="flex items-center gap-4 px-4 py-4 hover:bg-[#2c2c2e] cursor-pointer rounded-2xl text-streekx-primary bg-black/20 border border-dashed border-gray-700">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-streekx-primary/50 flex items-center justify-center">
                              <span className="text-2xl font-bold">+</span>
                          </div>
                          <span className="font-bold text-lg">Add another account</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#000000]">
           <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full active:scale-95 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
           <h1 className="text-lg font-bold">Profile</h1>
           <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-5 overflow-y-auto no-scrollbar pb-6">
          
          {/* User Info */}
          <div className="flex flex-col items-center justify-center mt-2 mb-6">
                <div className="relative mb-3 group cursor-pointer active:scale-95 transition-transform" onClick={() => setShowAccountSwitcher(true)}>
                    <div className="w-24 h-24 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 text-4xl border-[3px] border-[#2c2c2e] shadow-xl overflow-hidden">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover"/>
                        ) : (
                            user?.full_name?.[0] || 'G'
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-streekx-primary rounded-full p-1.5 border-[3px] border-black">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white leading-tight truncate max-w-[280px] text-center mb-1">{user?.full_name || 'Guest User'}</h2>
                <p className="text-gray-500 font-bold text-sm mb-5">{user?.streekx_id || 'Sign in to sync'}</p>

                <button 
                    onClick={() => onNavigate('ACCOUNT')}
                    className="px-6 py-2.5 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-sm font-bold text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-all active:scale-95"
                >
                    Manage Account
                </button>
          </div>

          {/* Shortcuts Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
               <ShortcutButton 
                    onClick={() => onNavigate('HISTORY')}
                    label="History"
                    icon="🕒"
               />
               <ShortcutButton 
                    onClick={() => onNavigate('PROJECTS')}
                    label="Projects"
                    icon="📂"
               />
               <ShortcutButton 
                    onClick={() => onNavigate('WORKSPACE')}
                    label="Space"
                    icon="🏢"
               />
               <ShortcutButton 
                    onClick={() => onNavigate('NOTIFICATIONS')}
                    label="Alerts"
                    icon="🔔"
               />
          </div>

          {/* Menu List */}
          <div className="bg-[#1c1c1e] rounded-[24px] overflow-hidden border border-[#2c2c2e] mb-4">
              <MenuRow 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                  label="Settings"
                  onClick={() => onNavigate('SETTINGS')}
              />
              <div className="h-px bg-[#2c2c2e] mx-4"></div>
              <MenuRow 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                  label="Help & Feedback"
                  onClick={() => onNavigate('FEEDBACK')}
              />
              {user && (
                <>
                <div className="h-px bg-[#2c2c2e] mx-4"></div>
                <MenuRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>}
                    label="Sign Out"
                    onClick={onSignOut}
                    isDestructive
                />
                </>
              )}
          </div>

      </div>
    </div>
  );
}
