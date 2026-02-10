import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Lock, Eye, EyeOff, Shield, Smartphone, Fingerprint, 
  Zap, Phone, Mail, Plus, Edit2, Trash2, ChevronRight, AlertCircle,
  CheckCircle, Clock, MapPin, Download, LogOut
} from 'lucide-react';
import { securityService } from '../services/securityService';
import { useAuth } from '../context/AuthContext';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SecurityData {
  twoFactor: any;
  passkeys: any[];
  authenticators: any[];
  devices: any[];
  recoveryContacts: any[];
  securityCodes: any[];
}

export const AccountSecurity: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [securityData, setSecurityData] = useState<SecurityData>({
    twoFactor: null,
    passkeys: [],
    authenticators: [],
    devices: [],
    recoveryContacts: [],
    securityCodes: []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [twoFactor, passkeys, authenticators, devices, recovery, codes] = await Promise.all([
        securityService.getTwoFactorStatus(user.id),
        securityService.getPasskeys(user.id),
        securityService.getAuthenticators(user.id),
        securityService.getDeviceSessions(user.id),
        securityService.getRecoveryContacts(user.id),
        securityService.getSecurityCodes(user.id)
      ]);
      
      setSecurityData({
        twoFactor,
        passkeys,
        authenticators,
        devices,
        recoveryContacts: recovery,
        securityCodes: codes
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tabs configuration
  const tabs: Tab[] = [
    { id: 'overview', label: 'How you sign in', icon: <Zap size={20} /> },
    { id: 'devices', label: 'Your devices', icon: <Smartphone size={20} /> },
    { id: 'connections', label: 'Your connections', icon: <Shield size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">StreekX Account</h1>
            <p className="text-sm text-gray-600">Security & Privacy</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab 
                data={securityData} 
                onEdit={(type) => setShowModal(type)}
                onReload={loadSecurityData}
              />
            )}
            {activeTab === 'devices' && (
              <DevicesTab 
                devices={securityData.devices}
                onReload={loadSecurityData}
              />
            )}
            {activeTab === 'connections' && (
              <ConnectionsTab />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// OVERVIEW TAB
const OverviewTab: React.FC<{
  data: SecurityData;
  onEdit: (type: string) => void;
  onReload: () => void;
}> = ({ data, onEdit, onReload }) => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={40} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Secure your StreekX Account</h2>
        <p className="text-gray-600">
          Add or remove security options to keep your account safe
        </p>
      </div>

      {/* How you sign in */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">How you sign in</h3>
          <p className="text-sm text-gray-600">
            Keep your account secure by regularly updating your security methods
          </p>
        </div>

        {/* Password */}
        <PasswordOption />

        {/* Passkeys */}
        <PasskeysOption passkeys={data.passkeys} />

        {/* StreekX Prompts */}
        <StreekXPromptsOption devices={data.devices} />

        {/* Authenticator */}
        <AuthenticatorOption authenticators={data.authenticators} />

        {/* Phone Number */}
        <PhoneRecoveryOption recovery={data.recoveryContacts} />
      </div>

      {/* Security Codes */}
      <SecurityCodesSection codes={data.securityCodes} />

      {/* Safe Browsing */}
      <SafeBrowsingSection />
    </div>
  );
};

// Password Component
const PasswordOption = () => {
  const [showForm, setShowForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = (pwd: string) => {
    if (pwd.length < 8) return { level: 'weak', color: 'bg-red-400' };
    if (pwd.length < 12) return { level: 'medium', color: 'bg-yellow-400' };
    return { level: 'strong', color: 'bg-green-400' };
  };

  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-gray-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Password</h4>
            <p className="text-xs text-gray-600">Last changed 3 months ago</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Change
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-sm text-gray-700 mb-4">
            Choose a strong password and don't reuse it for other accounts.{' '}
            <a href="#" className="text-blue-600">Learn more</a>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Password strength:</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full w-1/3 ${passwordStrength(newPassword).color}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 capitalize">
                  {passwordStrength(newPassword).level}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Use at least 8 characters. Don't use a password from another site, or something too obvious like your pet's name.{' '}
                <a href="#" className="text-blue-600">Why?</a>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-full hover:bg-blue-700 transition">
            Change password
          </button>
        </div>
      )}
    </div>
  );
};

// Passkeys Component
const PasskeysOption = ({ passkeys }: { passkeys: any[] }) => {
  const [showForm, setShowForm] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');

  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Fingerprint size={24} className="text-gray-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Passkeys and security keys</h4>
            <p className="text-xs text-gray-600">{passkeys.length} passkey{passkeys.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
          {passkeys.length > 0 ? '✓' : '+'}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Start using your passkeys. With passkeys you can now use your fingerprint, face or screen lock to verify that it's really you.{' '}
        <a href="#" className="text-blue-600">Learn more</a>
      </p>

      {passkeys.length === 0 ? (
        <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-full hover:bg-blue-700 transition mb-4">
          Create a passkey
        </button>
      ) : (
        <div className="space-y-2 mb-4">
          {passkeys.map((pk) => (
            <div key={pk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{pk.name}</p>
                <p className="text-xs text-gray-600">{new Date(pk.created_at).toLocaleDateString()}</p>
              </div>
              <button className="text-gray-600 hover:text-gray-900">
                <Edit2 size={18} />
              </button>
            </div>
          ))}
          <button className="w-full border-2 border-blue-600 text-blue-600 font-semibold py-2 rounded-full hover:bg-blue-50 transition">
            + Create a passkey
          </button>
        </div>
      )}
    </div>
  );
};

// StreekX Prompts Component
const StreekXPromptsOption = ({ devices }: { devices: any[] }) => {
  const activeDevices = devices.filter(d => d.is_current);

  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Smartphone size={24} className="text-gray-600" />
          <div>
            <h4 className="font-semibold text-gray-900">StreekX prompts</h4>
            <p className="text-xs text-gray-600">{activeDevices.length} device</p>
          </div>
        </div>
        <CheckCircle size={20} className="text-green-600" />
      </div>

      <p className="text-sm text-gray-600 mb-4">
        You need to be signed in to your StreekX account on a phone to get a prompt on it.{' '}
        <a href="#" className="text-blue-600">More about StreekX prompts</a>
      </p>

      <button className="text-blue-600 font-medium text-sm hover:underline">
        → Manage devices
      </button>
    </div>
  );
};

// Authenticator Component
const AuthenticatorOption = ({ authenticators }: { authenticators: any[] }) => {
  return (
    <div className="border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-gray-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Authenticator</h4>
            <p className="text-xs text-gray-600">
              {authenticators.length === 0 ? 'Add authenticator app' : `${authenticators.length} app`}
            </p>
          </div>
        </div>
        {authenticators.length === 0 && (
          <AlertCircle size={20} className="text-orange-500" />
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Use an authenticator app for an extra layer of security. You'll enter a code from the app along with your password.{' '}
        <a href="#" className="text-blue-600">Learn more</a>
      </p>

      <button className="w-full border-2 border-gray-300 text-gray-900 font-semibold py-2 rounded-full hover:bg-gray-50 transition">
        {authenticators.length === 0 ? 'Set up authenticator' : '+ Add another'}
      </button>
    </div>
  );
};

// Phone Recovery Component
const PhoneRecoveryOption = ({ recovery }: { recovery: any[] }) => {
  const phoneRecovery = recovery?.find(r => r.type === 'phone');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Phone size={24} className="text-gray-600" />
          <div>
            <h4 className="font-semibold text-gray-900">Phone number</h4>
            <p className="text-xs text-gray-600">
              {phoneRecovery ? 'For account recovery' : 'Not set'}
            </p>
          </div>
        </div>
        {phoneRecovery && <CheckCircle size={20} className="text-green-600" />}
      </div>

      {phoneRecovery ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">
            {phoneRecovery.value.replace(/(\d{4})(?=\d)/g, '$1 ')}
          </p>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-200 rounded">
              <Edit2 size={18} className="text-gray-600" />
            </button>
            <button className="p-1 hover:bg-gray-200 rounded">
              <Trash2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      ) : (
        <button className="w-full border-2 border-gray-300 text-gray-900 font-semibold py-2 rounded-full hover:bg-gray-50 transition">
          + Add recovery phone
        </button>
      )}
    </div>
  );
};

// Security Codes Section
const SecurityCodesSection = ({ codes }: { codes: any[] }) => {
  const unusedCount = codes?.filter(c => !c.is_used).length || 0;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Security codes</h3>
          <p className="text-sm text-gray-600">{unusedCount} unused codes</p>
        </div>
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View all
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Save these codes in a safe place. If you lose access to your other security methods, you can use them to sign in.
      </p>

      <button className="w-full border-2 border-blue-600 text-blue-600 font-semibold py-2 rounded-full hover:bg-blue-50 transition">
        ↓ Download codes
      </button>
    </div>
  );
};

// Safe Browsing Section
const SafeBrowsingSection = () => {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Enhance safe browsing for your account</h3>
          <p className="text-sm text-gray-600">
            Get alerted if StreekX detects that your password has been exposed by a data breach
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`ml-4 relative inline-flex h-8 w-14 items-center rounded-full transition ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

// DEVICES TAB
const DevicesTab: React.FC<{
  devices: any[];
  onReload: () => void;
}> = ({ devices, onReload }) => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  // Group devices by type
  const groupedDevices = devices.reduce((acc, device) => {
    const key = device.device_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(device);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Your devices</h2>
        <p className="text-sm text-gray-600 mb-6">
          You're signed in on these devices or have been in the last 28 days. There might be multiple activity sessions from the same device.{' '}
          <a href="#" className="text-blue-600">Learn more</a>
        </p>

        {Object.entries(groupedDevices).map(([deviceType, devs]) => (
          <div key={deviceType} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              {devs.length} session{devs.length !== 1 ? 's' : ''} on {deviceType}
            </h3>

            <div className="space-y-2">
              {devs.map((device, idx) => (
                <div
                  key={device.id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() =>
                    setExpandedDevice(expandedDevice === device.id ? null : device.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Smartphone size={24} className="text-gray-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{device.device_name}</p>
                          {device.is_current && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                              <CheckCircle size={14} />
                              Your current session
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="inline-flex bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {device.location || 'Unknown location'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {deviceType}, {device.last_used}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-600 transition ${
                        expandedDevice === device.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {expandedDevice === device.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">IP Address</p>
                          <p className="font-medium text-gray-900">{device.ip_address || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Last active</p>
                          <p className="font-medium text-gray-900">{device.last_used}</p>
                        </div>
                      </div>
                      <button className="w-full bg-red-50 text-red-600 font-semibold py-2 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2">
                        <LogOut size={18} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// CONNECTIONS TAB
const ConnectionsTab = () => {
  const connections = [
    { id: 1, name: 'GitHub', connected: true, permissions: ['read', 'write'] },
    { id: 2, name: 'Google Drive', connected: true, permissions: ['read'] },
    { id: 3, name: 'Slack', connected: false, permissions: [] }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Your connections</h2>
        <p className="text-sm text-gray-600 mb-6">
          Apps and services connected to your StreekX account have access to certain information. You can disconnect any of them at any time.
        </p>

        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{conn.name}</p>
                <p className="text-xs text-gray-600">
                  {conn.connected
                    ? `Connected with ${conn.permissions.join(', ')} permissions`
                    : 'Not connected'}
                </p>
              </div>
              <button className={`px-4 py-2 rounded-full font-medium transition ${
                conn.connected
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {conn.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSecurity;
