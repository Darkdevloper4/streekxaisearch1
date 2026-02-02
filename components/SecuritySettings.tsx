
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SecuritySettingsProps {
  user: UserProfile | null;
  onBack: () => void;
}

interface SecurityCardProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ children, title, className = "" }) => (
  <div className={`bg-[#1c1c1e] rounded-[24px] border border-[#2c2c2e] overflow-hidden mb-4 ${className}`}>
      {title && <div className="px-5 pt-5 pb-2 text-xl font-normal text-white">{title}</div>}
      <div className="flex flex-col">
          {children}
      </div>
  </div>
);

interface SecurityRowProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string | React.ReactNode;
    status?: string;
    onClick?: () => void;
    isLast?: boolean;
    action?: React.ReactNode;
}

const SecurityRow: React.FC<SecurityRowProps> = ({ icon, title, subtitle, status, onClick, isLast = false, action }) => (
    <div onClick={onClick} className={`flex items-center justify-between px-5 py-5 ${!isLast ? 'border-b border-[#2c2c2e]' : ''} ${onClick ? 'cursor-pointer hover:bg-[#2c2c2e]/50 transition-colors' : ''}`}>
        <div className="flex items-start gap-4 flex-1">
            <div className="mt-1 text-gray-400">
                {icon}
            </div>
            <div className="flex-1">
                <div className="text-[16px] text-white font-medium leading-tight">{title}</div>
                {subtitle && <div className="text-[13px] text-gray-400 mt-1 leading-snug">{subtitle}</div>}
            </div>
        </div>
        <div className="flex items-center gap-3 pl-4">
             {status && <span className="text-[13px] text-gray-400">{status}</span>}
             {action}
             {onClick && !action && <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
        </div>
    </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className="relative cursor-pointer w-[42px] h-[24px]">
        <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-[#5f6368]'}`}></div>
        <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform duration-200 shadow-sm ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}>
            {checked && <svg className="w-3 h-3 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
        </div>
    </div>
);

export default function SecuritySettings({ user, onBack }: SecuritySettingsProps) {
  const [skipPassword, setSkipPassword] = useState(true);
  const [safeBrowsing, setSafeBrowsing] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="h-full bg-[#000000] flex flex-col animate-slide-right font-sans text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-[#000000] z-20 border-b border-[#1c1c1e]">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h2 className="text-xl font-medium text-white">Security and sign-in</h2>
            </div>
            <div className="flex gap-4 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <div className="w-7 h-7 rounded-full bg-streekx-primary flex items-center justify-center text-xs font-bold text-white border border-white">
                    {user?.full_name[0]}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-12">
            
            {/* Security Tips */}
            <SecurityCard className="bg-white/5 border border-transparent">
                 <div className="px-5 py-5 flex items-start gap-4 cursor-pointer hover:bg-[#2c2c2e]/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-green-700/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      </div>
                      <div className="flex-1">
                          <h3 className="text-white font-medium text-[15px] mb-1">You have security tips</h3>
                          <p className="text-gray-400 text-sm">Security tips found in the Security Check-up</p>
                      </div>
                 </div>
            </SecurityCard>

            <div className="mb-6 px-1">
                 <h3 className="text-[17px] font-normal text-white mb-1">Recent security activity</h3>
                 <p className="text-[13px] text-gray-400">No security activity or alerts in the last 28 days</p>
            </div>

            <SecurityCard title="How you sign in to StreekX">
                 <p className="px-5 text-[13px] text-gray-400 mb-4 leading-relaxed">Make sure that you can always access your StreekX Account by keeping this information up to date</p>
                 
                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                    title="2-Step Verification"
                    subtitle={`2-Step Verification is ${twoFactor ? 'on' : 'off'}`}
                    onClick={() => setTwoFactor(!twoFactor)}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M19 20d-7-18-7 18s2-4.2 2-10 10-10 10 10zM12 21a9 9 0 110-18 9 9 0 010 18zm1-12a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>}
                    title="Security code"
                    subtitle="Get a one-time code to verify that it's you"
                    action={<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                    title="Passkeys and security keys"
                    subtitle="Start using passkeys"
                    onClick={() => {}}
                 />

                 <SecurityRow 
                    icon={<div className="font-bold text-lg tracking-widest translate-y-1">***</div>}
                    title="Password"
                    subtitle="Last changed 12 Oct 2025"
                    onClick={() => {}}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>}
                    title="Skip password when possible"
                    action={<Toggle checked={skipPassword} onChange={setSkipPassword} />}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title="StreekX prompt"
                    subtitle="1 device"
                    onClick={() => {}}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title="Recovery phone"
                    subtitle={user?.mobile || "Not set"}
                    onClick={() => {}}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    title="Recovery StreekX ID"
                    subtitle={<span className="bg-streekx-primary/20 text-streekx-primary px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-fit mt-1">+ Add trusted ID</span>}
                    onClick={() => {}}
                    isLast
                 />

                 <div className="px-5 py-4 border-t border-[#2c2c2e]">
                    <span className="text-blue-400 font-bold text-sm cursor-pointer hover:underline">You can add more sign-in options</span>
                    <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
                         <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5f6368] text-sm font-bold text-blue-400 whitespace-nowrap hover:bg-[#2c2c2e]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            Recovery contacts
                         </button>
                         <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5f6368] text-sm font-bold text-blue-400 whitespace-nowrap hover:bg-[#2c2c2e]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M19 20d-7-18-7 18s2-4.2 2-10 10-10 10 10zM12 21a9 9 0 110-18 9 9 0 010 18zm1-12a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                            Authenticator
                         </button>
                    </div>
                 </div>
            </SecurityCard>

            <SecurityCard title="Your devices">
                <p className="px-5 text-[13px] text-gray-400 mb-4">Where you're signed in</p>
                
                <SecurityRow 
                    icon={<svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title="1 session on Android phone"
                    subtitle="POCO M7 Pro 5G"
                    onClick={() => {}}
                />
                
                <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    title="Find a lost device"
                    onClick={() => {}}
                    isLast
                />

                <div className="px-5 py-4 border-t border-[#2c2c2e]">
                    <span className="text-blue-400 font-bold text-sm cursor-pointer hover:underline">Manage all devices</span>
                     <span className="float-right bg-[#2c2c2e] text-gray-300 text-xs font-bold px-2 py-1 rounded">1</span>
                </div>
            </SecurityCard>

             <SecurityCard title="Your connections to third-party apps and services">
                <p className="px-5 text-[13px] text-gray-400 mb-4 leading-relaxed">Keep track of your connections to third-party apps and services</p>
                
                {['10Web', 'Adobe', 'Agent.ai'].map(app => (
                    <SecurityRow 
                        key={app}
                        icon={<div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs font-bold">{app[0]}</div>}
                        title={app}
                        onClick={() => {}}
                    />
                ))}

                 <div className="px-5 py-4 border-t border-[#2c2c2e] flex justify-between items-center cursor-pointer hover:bg-[#2c2c2e]/30">
                    <span className="text-white font-medium text-[16px]">See all connections</span>
                     <span className="bg-[#2c2c2e] text-gray-300 text-xs font-bold px-2 py-1 rounded">90</span>
                </div>
            </SecurityCard>

            <SecurityCard className="p-0">
                 <div className="p-5">
                    <h3 className="text-[17px] font-medium text-white mb-2 leading-tight">Enhanced Safe Browsing for your account</h3>
                    <div className="flex gap-4">
                        <div className="mt-1">
                             <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                        </div>
                        <div className="flex-1">
                             <p className="text-[14px] text-gray-400 leading-relaxed mb-4">
                                More personalised protections against dangerous websites, downloads and extensions.
                             </p>
                             <div className="flex items-center gap-2">
                                <Toggle checked={safeBrowsing} onChange={setSafeBrowsing} />
                                <span className="text-sm font-bold text-white">{safeBrowsing ? 'On' : 'Off'}</span>
                             </div>
                        </div>
                    </div>
                 </div>
            </SecurityCard>

             <SecurityCard className="p-5 flex flex-row gap-4 items-start cursor-pointer hover:bg-[#2c2c2e]/30">
                 <div className="text-4xl">
                     <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 000-2z" clipRule="evenodd"></path></svg>
                 </div>
                 <div className="flex-1">
                     <h3 className="text-[17px] font-medium text-white mb-1">Password Manager</h3>
                     <p className="text-[14px] text-gray-400 leading-relaxed">
                        You have 29 passwords saved in your StreekX Account. Password Manager makes it easier to sign in to sites and apps that you use on any signed-in device.
                     </p>
                 </div>
            </SecurityCard>

            <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 pb-4 pt-4">
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
}
