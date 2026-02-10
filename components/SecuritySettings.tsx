import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SecuritySettingsProps {
  user: UserProfile | null;
  onBack: () => void;
  onUpdate: (user: UserProfile) => void;
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
        <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-streekx-primary' : 'bg-[#5f6368]'}`}></div>
        <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform duration-200 shadow-sm ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}>
            {checked && <svg className="w-3 h-3 text-streekx-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
        </div>
    </div>
);

const OTPModal = ({ backupId, onConfirm, onCancel }: { backupId: string, onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-[#1c1c1e] rounded-2xl p-6 max-w-sm w-full mx-4 border border-[#2c2c2e]">
          <h3 className="text-xl font-bold text-white mb-2">Verify 2-Step Verification</h3>
          <p className="text-gray-400 text-sm mb-6">An OTP has been sent to {backupId}'s notifications.</p>
          <input type="text" placeholder="Enter 6-digit OTP" maxLength={6} className="w-full p-3 bg-[#2c2c2e] text-white rounded-lg border border-[#3a3a3c] focus:border-streekx-primary outline-none mb-4 font-mono text-center text-lg tracking-widest" />
          <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2 bg-[#2c2c2e] text-white rounded-lg hover:bg-[#3a3a3c] transition-colors">Cancel</button>
              <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-streekx-primary text-white rounded-lg hover:bg-streekx-primaryDark transition-colors">Verify</button>
          </div>
      </div>
  </div>
);

export default function SecuritySettings({ user, onBack, onUpdate }: SecuritySettingsProps) {
  const [skipPassword, setSkipPassword] = useState(user?.security?.skip_password_possible ?? true);
  const [safeBrowsing, setSafeBrowsing] = useState(user?.security?.safe_browsing ?? false);
  const [twoFactor, setTwoFactor] = useState(user?.two_step_enabled ?? false);
  const [passkeyEnabled, setPasskeyEnabled] = useState(user?.passkey_enabled ?? false);
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(user?.authenticator_enabled ?? false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [backupId, setBackupId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);

  const mockDevices = [
    { id: '1', name: 'POCO M7 Pro 5G', type: 'android', location: 'Delhi, India', lastUsed: 'Just now', isCurrent: true },
    { id: '2', name: 'Android Device', type: 'android', location: 'Unknown', lastUsed: '1 hour ago', isCurrent: false },
  ];

  const mockConnections = [
    { id: '1', app: 'GitHub', connected: '68 days ago', lastAccessed: '2 hours ago' },
    { id: '2', app: 'Google Drive', connected: '30 days ago', lastAccessed: '5 days ago' },
  ];

  const handleTwoFactorToggle = () => {
    if (!twoFactor) {
      const id = prompt("Enter another StreekX ID for 2-step verification:");
      if (id) {
        setBackupId(id);
        setShowOTPModal(true);
      }
    } else {
      if (confirm("Turn off 2-Step Verification?")) {
        setTwoFactor(false);
        if (user) onUpdate({ ...user, two_step_enabled: false });
      }
    }
  };

  const handleOTPConfirm = () => {
    setShowOTPModal(false);
    setTwoFactor(true);
    if (user) onUpdate({ ...user, two_step_enabled: true, recovery_id: backupId });
    alert("2-Step Verification is now enabled!");
  };

  const handlePasskeyToggle = () => {
    setPasskeyEnabled(!passkeyEnabled);
    if (user) onUpdate({ ...user, passkey_enabled: !passkeyEnabled });
  };

  const handleAuthenticatorToggle = () => {
    setAuthenticatorEnabled(!authenticatorEnabled);
    if (user) onUpdate({ ...user, authenticator_enabled: !authenticatorEnabled });
  };

  const handlePasswordChange = () => {
    const newPass = prompt("Enter new password (min 8 chars, uppercase, lowercase, number):");
    if (newPass && newPass.length >= 8) {
      alert("Password updated successfully!");
    }
  };

  const handleAddRecoveryEmail = () => {
    const email = prompt("Enter recovery email:");
    if (email) {
      if (user) onUpdate({ ...user, recovery_email: email });
      alert("Recovery email added successfully!");
    }
  };

  const handleAddRecoveryPhone = () => {
    const phone = prompt("Enter recovery phone number:", user?.mobile || "");
    if (phone && user) {
      onUpdate({ ...user, mobile: phone });
      alert("Recovery phone added successfully!");
    }
  };

  const handleAddRecoveryStreekXID = () => {
    const id = prompt("Enter recovery StreekX ID:", user?.recovery_id || "");
    if (id && user) {
      onUpdate({ ...user, recovery_id: id });
      alert("Recovery StreekX ID added successfully!");
    }
  };

  const handleSkipPasswordChange = (value: boolean) => {
    setSkipPassword(value);
    if (user) {
      const updatedUser = { ...user, security: { ...user.security, skip_password_possible: value } };
      onUpdate(updatedUser);
    }
  };

  const handleSafeBrowsingChange = (value: boolean) => {
    setSafeBrowsing(value);
    if (user) {
      const updatedUser = { ...user, security: { ...user.security, safe_browsing: value } };
      onUpdate(updatedUser);
    }
  };

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
                <svg className="w-6 h-6 cursor-pointer hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div className="w-7 h-7 rounded-full bg-streekx-primary flex items-center justify-center text-xs font-bold text-white border border-white">
                    {user?.full_name[0]}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-12">
            
            {/* How you sign in */}
            <SecurityCard title="How you sign in to StreekX">
                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                    title="2-Step Verification"
                    subtitle={`2-Step Verification is ${twoFactor ? 'on' : 'off'}`}
                    onClick={handleTwoFactorToggle}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M19 20d-7-18-7 18s2-4.2 2-10 10-10 10 10zM12 21a9 9 0 110-18 9 9 0 010 18zm1-12a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>}
                    title="Security code"
                    subtitle="Get a one-time code to verify that it's you"
                    action={<svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                    title="Passkeys and security keys"
                    subtitle={`${passkeyEnabled ? 'Enabled' : 'Not set up'}`}
                    action={<Toggle checked={passkeyEnabled} onChange={handlePasskeyToggle} />}
                 />

                 <SecurityRow 
                    icon={<div className="font-bold text-lg tracking-widest translate-y-1">***</div>}
                    title="Password"
                    subtitle="••••••••"
                    onClick={handlePasswordChange}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>}
                    title="Skip password when possible"
                    action={<Toggle checked={skipPassword} onChange={handleSkipPasswordChange} />}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title="Authenticator app"
                    subtitle={`${authenticatorEnabled ? 'Enabled' : 'Not set up'}`}
                    action={<Toggle checked={authenticatorEnabled} onChange={handleAuthenticatorToggle} />}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title="StreekX prompt"
                    subtitle="1 device"
                    action={<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
                    isLast
                 />

                 <div className="px-5 py-4 border-t border-[#2c2c2e]">
                    <span className="text-streekx-primary font-bold text-sm cursor-pointer hover:underline">Add more sign-in options</span>
                 </div>
            </SecurityCard>

            {/* Recovery options */}
            <SecurityCard title="Recovery options">
                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                    title="Recovery email"
                    subtitle={user?.recovery_email || "Not set"}
                    onClick={handleAddRecoveryEmail}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.048 1.024a11.07 11.07 0 010 1.586l-2.048 1.024a1 1 0 00-.502.756l-1.498 4.493a1 1 0 00-.948.684H5a2 2 0 01-2-2V5z"></path></svg>}
                    title="Recovery phone"
                    subtitle={user?.mobile || "Not set"}
                    onClick={handleAddRecoveryPhone}
                 />

                 <SecurityRow 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    title="Recovery StreekX ID"
                    subtitle={user?.recovery_id ? <span className="text-white">{user.recovery_id}</span> : <span className="bg-streekx-primary/20 text-streekx-primary px-2 py-0.5 rounded text-xs font-bold">+ Add</span>}
                    onClick={handleAddRecoveryStreekXID}
                    isLast
                 />
            </SecurityCard>

            {/* Your devices */}
            <SecurityCard title="Your devices">
                <p className="px-5 text-[13px] text-gray-400 mb-2 mt-2">Where you're signed in</p>
                
                {mockDevices.map((device, idx) => (
                  <SecurityRow 
                    key={device.id}
                    icon={<svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    title={device.name}
                    subtitle={`${device.location} • ${device.lastUsed}${device.isCurrent ? ' (Current)' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                    isLast={idx === mockDevices.length - 1}
                  />
                ))}
                
                <div className="px-5 py-4 border-t border-[#2c2c2e] flex justify-between items-center cursor-pointer hover:bg-[#2c2c2e]/30">
                    <span className="text-white font-medium text-[16px]">Manage all devices</span>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
            </SecurityCard>

            {/* Your connections */}
            <SecurityCard title="Your connections">
                <p className="px-5 text-[13px] text-gray-400 mb-2 mt-2">Third-party apps and services</p>
                
                {mockConnections.map((conn, idx) => (
                  <SecurityRow 
                    key={conn.id}
                    icon={<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>}
                    title={conn.app}
                    subtitle={`Connected ${conn.connected} • Last used ${conn.lastAccessed}`}
                    onClick={() => setSelectedConnection(conn)}
                    isLast={idx === mockConnections.length - 1}
                  />
                ))}

                <div className="px-5 py-4 border-t border-[#2c2c2e] flex justify-between items-center cursor-pointer hover:bg-[#2c2c2e]/30">
                    <span className="text-white font-medium text-[16px]">See all connections</span>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
            </SecurityCard>

            {/* Safe Browsing */}
            <SecurityCard className="p-5 flex flex-row gap-4 items-start">
                <div>
                    <svg className="w-10 h-10 text-streekx-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-[17px] font-medium text-white mb-3">Enhanced Safe Browsing</h3>
                    <p className="text-[14px] text-gray-400 leading-relaxed mb-4">
                        Protect yourself against dangerous websites, downloads and extensions.
                    </p>
                    <div className="flex items-center gap-2">
                        <Toggle checked={safeBrowsing} onChange={handleSafeBrowsingChange} />
                        <span className="text-sm font-bold text-white">{safeBrowsing ? 'On' : 'Off'}</span>
                    </div>
                </div>
            </SecurityCard>

            {/* Password Manager */}
            <SecurityCard className="p-5 flex flex-row gap-4 items-start cursor-pointer hover:bg-[#2c2c2e]/30">
                <div>
                    <svg className="w-10 h-10 text-streekx-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 000-2z" clipRule="evenodd"></path></svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-[17px] font-medium text-white mb-1">Password Manager</h3>
                    <p className="text-[14px] text-gray-400 leading-relaxed">
                        Manage your saved passwords and security securely.
                    </p>
                </div>
            </SecurityCard>

            <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 pb-4 pt-4">
                <span className="cursor-pointer hover:text-white">Privacy</span>
                <span>•</span>
                <span className="cursor-pointer hover:text-white">Terms</span>
                <span>•</span>
                <span className="cursor-pointer hover:text-white">Help</span>
            </div>

        </div>

        {/* OTP Modal */}
        {showOTPModal && (
          <OTPModal 
            backupId={backupId} 
            onConfirm={handleOTPConfirm} 
            onCancel={() => setShowOTPModal(false)} 
          />
        )}
    </div>
  );
}
