import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Smartphone, Key, Phone, Mail, Fingerprint, LogOut, 
  Plus, Trash2, Eye, EyeOff, Copy, Check, AlertCircle, Check2Circle 
} from 'lucide-react';
import securityService from '../services/securityService';
import { generateDeviceId, generateOTP } from '../utils/generators';

interface ModalState {
  [key: string]: boolean;
}

interface TwoStepData {
  is_enabled: boolean;
  backup_streekx_id?: string;
}

interface DeviceSession {
  id: string;
  device_name: string;
  device_type: string;
  location: string;
  last_used: string;
  is_current_session: boolean;
}

interface RecoveryContact {
  id: string;
  contact_type: string;
  contact_value: string;
  is_verified: boolean;
}

export default function SecuritySettingsProduction() {
  // State management
  const [modals, setModals] = useState<ModalState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2-Step Verification
  const [twoStepData, setTwoStepData] = useState<TwoStepData>({ is_enabled: false });
  const [backupStreekxId, setBackupStreekxId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Passkeys
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyName, setPasskeyName] = useState('');

  // Authenticator
  const [authenticators, setAuthenticators] = useState([]);
  const [authAppName, setAuthAppName] = useState('Google Authenticator');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Recovery
  const [recoveryContacts, setRecoveryContacts] = useState<RecoveryContact[]>([]);
  const [recoveryType, setRecoveryType] = useState<'phone' | 'email' | 'streekx_id'>('phone');
  const [recoveryValue, setRecoveryValue] = useState('');
  const [recoveryVerificationCode, setRecoveryVerificationCode] = useState('');

  // Security Codes
  const [securityCodes, setSecurityCodes] = useState<any[]>([]);

  // Devices
  const [devices, setDevices] = useState<DeviceSession[]>([]);

  // Passwords
  const [savedPasswords, setSavedPasswords] = useState([]);

  // Safe Browsing
  const [safeBrowsingEnabled, setSafeBrowsingEnabled] = useState(true);

  // Load initial data
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [twoStep, keys, auths, recovery, codes, devs, passwords] = await Promise.all([
        securityService.twoStepVerification.getStatus(),
        securityService.passkeys.list(),
        securityService.authenticatorApp.list(),
        securityService.recoveryContacts.list(),
        securityService.securityCodes.list(),
        securityService.deviceSessions.list(),
        securityService.savedPasswords.list()
      ]);

      setTwoStepData(twoStep);
      setPasskeys(keys);
      setAuthenticators(auths);
      setRecoveryContacts(recovery);
      setSecurityCodes(codes);
      setDevices(devs);
      setSavedPasswords(passwords);
    } catch (err) {
      console.error('[v0] Error loading security data:', err);
      setError('Failed to load security information');
    }
  };

  const toggleModal = (modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: !prev[modalId] }));
    setError('');
    setSuccess('');
  };

  // ============================================
  // 2-STEP VERIFICATION HANDLERS
  // ============================================

  const handleEnable2Step = async () => {
    if (!backupStreekxId.trim()) {
      setError('Please enter a backup StreekX ID');
      return;
    }

    setLoading(true);
    try {
      const result = await securityService.twoStepVerification.enable(backupStreekxId);
      setGeneratedOtp(result.otp);
      setSuccess('OTP sent to backup account. Check notifications!');
      // In real app, this would be sent via real-time notification
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2Step = async () => {
    if (!otpCode.trim() || !generatedOtp) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      const result = await securityService.twoStepVerification.verifyAndEnable(
        backupStreekxId,
        otpCode
      );
      setSuccess(result.message);
      await loadSecurityData();
      setTimeout(() => toggleModal('enable2step'), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2Step = async () => {
    if (!window.confirm('Disable 2-Step Verification? Your account will be less secure.')) return;

    setLoading(true);
    try {
      await securityService.twoStepVerification.disable();
      setSuccess('2-Step Verification disabled');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASSKEY HANDLERS
  // ============================================

  const handleCreatePasskey = async () => {
    if (!passkeyName.trim()) {
      setError('Please enter a passkey name');
      return;
    }

    setLoading(true);
    try {
      // In production, this would trigger WebAuthn API
      const credentialId = `cred_${Date.now()}`;
      const publicKey = `pk_${Math.random().toString(36).substring(7)}`;

      await securityService.passkeys.create(passkeyName, publicKey, credentialId);
      setSuccess('Passkey created successfully!');
      setPasskeyName('');
      await loadSecurityData();
      toggleModal('addpasskey');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!window.confirm('Delete this passkey?')) return;

    setLoading(true);
    try {
      await securityService.passkeys.delete(passkeyId);
      setSuccess('Passkey deleted');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // AUTHENTICATOR HANDLERS
  // ============================================

  const handleSetupAuthenticator = async () => {
    setLoading(true);
    try {
      // In production, generate actual TOTP secret
      const secretKey = `secret_${Math.random().toString(36).substring(7)}`;

      const result = await securityService.authenticatorApp.setup(authAppName, secretKey);
      setBackupCodes(result.backupCodes);
      setSuccess('Authenticator app configured. Save these backup codes!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuthenticator = async (appName: string) => {
    if (!window.confirm(`Delete ${appName}?`)) return;

    setLoading(true);
    try {
      await securityService.authenticatorApp.delete(appName);
      setSuccess('Authenticator deleted');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RECOVERY HANDLERS
  // ============================================

  const handleAddRecovery = async () => {
    if (!recoveryValue.trim()) {
      setError(`Please enter a ${recoveryType}`);
      return;
    }

    setLoading(true);
    try {
      await securityService.recoveryContacts.add(recoveryType, recoveryValue);
      setSuccess('Verification code sent!');
      setRecoveryValue('');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (contactId: string) => {
    if (!recoveryVerificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      await securityService.recoveryContacts.verify(contactId, recoveryVerificationCode);
      setSuccess('Recovery contact verified!');
      setRecoveryVerificationCode('');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecovery = async (contactId: string) => {
    if (!window.confirm('Delete this recovery contact?')) return;

    setLoading(true);
    try {
      await securityService.recoveryContacts.delete(contactId);
      setSuccess('Recovery contact deleted');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DEVICE HANDLERS
  // ============================================

  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Remove this device? You may be logged out.')) return;

    setLoading(true);
    try {
      await securityService.deviceSessions.remove(deviceId);
      setSuccess('Device removed');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrentDevice = async () => {
    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      await securityService.deviceSessions.createSession(
        deviceId,
        'Current Device',
        navigator.userAgent.includes('Mobile') ? 'mobile' : 'web',
        undefined,
        'Current Location' // In production, get actual location
      );
      setSuccess('Device registered');
      await loadSecurityData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SECURITY CODES HANDLERS
  // ============================================

  const handleGenerateSecurityCodes = async () => {
    setLoading(true);
    try {
      const result = await securityService.securityCodes.generate(10);
      setSecurityCodes(result.codes as any[]);
      setSuccess('Security codes generated! Save them in a safe place.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render helper
  const renderModal = (modalId: string, title: string, children: React.ReactNode) => {
    if (!modals[modalId]) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-[#2c2c2e]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={() => toggleModal(modalId)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm flex gap-2">
              <Check2Circle size={16} className="flex-shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="text-blue-500" size={32} />
            Security Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Protect your StreekX account with multiple layers of security
          </p>
        </div>

        {/* 2-Step Verification Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Lock className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  2-Step Verification
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                twoStepData.is_enabled
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {twoStepData.is_enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Second Steps Available:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={16} className="text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    StreekX Backup ID
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {twoStepData.backup_streekx_id || 'Not configured'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint size={16} className="text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Passkeys</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{passkeys.length} added</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={16} className="text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Authenticator</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {authenticators.length > 0 ? 'Connected' : 'Not set up'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={16} className="text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Phone</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {recoveryContacts.filter(c => c.contact_type === 'phone').length > 0
                    ? 'Added'
                    : 'Not added'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {!twoStepData.is_enabled ? (
              <button
                onClick={() => toggleModal('enable2step')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Turn On 2-Step Verification
              </button>
            ) : (
              <button
                onClick={handleDisable2Step}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Turn Off 2-Step Verification
              </button>
            )}
          </div>
        </div>

        {/* Passkeys Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Fingerprint className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Passkeys</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sign in with biometrics or device unlock
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {passkeys.length > 0 ? (
              passkeys.map(pk => (
                <div key={pk.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{pk.passkey_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Created {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No passkeys configured</p>
            )}
          </div>

          <button
            onClick={() => toggleModal('addpasskey')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create Passkey
          </button>
        </div>

        {/* Authenticator Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Key className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Authenticator App
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Time-based one-time passwords
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {authenticators.length > 0 ? (
              authenticators.map(auth => (
                <div key={auth.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{auth.app_name}</p>
                    <p className={`text-xs ${auth.is_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {auth.is_verified ? '✓ Verified' : 'Pending verification'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAuthenticator(auth.app_name)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No authenticator app configured</p>
            )}
          </div>

          <button
            onClick={() => toggleModal('addauth')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Authenticator App
          </button>
        </div>

        {/* Recovery Contacts Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Phone className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recovery Options</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Keep your account accessible
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {recoveryContacts.length > 0 ? (
              recoveryContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {contact.contact_type}: {contact.contact_value}
                    </p>
                    <p className={`text-xs ${contact.is_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {contact.is_verified ? '✓ Verified' : 'Verification pending'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRecovery(contact.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No recovery contacts added</p>
            )}
          </div>

          <button
            onClick={() => toggleModal('addrecovery')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Recovery Contact
          </button>
        </div>

        {/* Your Devices Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Smartphone className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Devices</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage devices signed in to your account
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {devices.length > 0 ? (
              devices.map(device => (
                <div key={device.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-[#2c2c2e]">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {device.device_name}
                      {device.is_current_session && (
                        <span className="ml-2 inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                          Current Session
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {device.device_type.toUpperCase()} • {device.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Last used: {new Date(device.last_used).toLocaleString()}
                    </p>
                  </div>
                  {!device.is_current_session && (
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">No devices registered</p>
            )}
          </div>

          <button
            onClick={handleAddCurrentDevice}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Register Current Device
          </button>
        </div>

        {/* Security Codes Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Key className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Codes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  One-time backup codes for account recovery
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {securityCodes.filter((c: any) => !c.is_used).length} / {securityCodes.length} unused
            </span>
          </div>

          {securityCodes.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                Save your backup codes in a secure place:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {securityCodes.slice(0, 6).map((code: any) => (
                  <code key={code} className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-white">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateSecurityCodes}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition"
          >
            {securityCodes.length > 0 ? 'Regenerate' : 'Generate'} Security Codes
          </button>
        </div>

        {/* Safe Browsing Section */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#2c2c2e] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-500 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Safe Browsing</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Protect yourself from malware and phishing
                </p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={safeBrowsingEnabled}
                onChange={(e) => setSafeBrowsingEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* 2-Step Verification Modal */}
      {renderModal('enable2step', 'Enable 2-Step Verification', (
        <div className="space-y-4">
          {!generatedOtp ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Backup StreekX ID
                </label>
                <input
                  type="text"
                  placeholder="example/streekx.not"
                  value={backupStreekxId}
                  onChange={(e) => setBackupStreekxId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleEnable2Step}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
              >
                {loading ? 'Sending OTP...' : 'Send OTP to Backup Account'}
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded text-blue-800 dark:text-blue-200 text-sm">
                <p className="font-medium mb-1">OTP Generated (Demo):</p>
                <p className="font-mono font-bold text-lg">{generatedOtp}</p>
                <p className="text-xs mt-2">In production, this would be sent to the backup account's notifications.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                />
              </div>
              <button
                onClick={handleVerify2Step}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </>
          )}
        </div>
      ))}

      {/* Add Passkey Modal */}
      {renderModal('addpasskey', 'Create Passkey', (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Passkey Name
            </label>
            <input
              type="text"
              placeholder="My Fingerprint"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            You'll be asked to verify with your device's biometric authentication.
          </p>
          <button
            onClick={handleCreatePasskey}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create Passkey'}
          </button>
        </div>
      ))}

      {/* Add Authenticator Modal */}
      {renderModal('addauth', 'Add Authenticator App', (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              App Name
            </label>
            <select
              value={authAppName}
              onChange={(e) => setAuthAppName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Google Authenticator</option>
              <option>Microsoft Authenticator</option>
              <option>Authy</option>
              <option>2FAS</option>
            </select>
          </div>

          {backupCodes.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
              <p className="text-green-800 dark:text-green-200 font-medium text-sm mb-2">
                Backup Codes Generated:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-white">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSetupAuthenticator}
            disabled={loading || backupCodes.length > 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? 'Setting up...' : backupCodes.length > 0 ? 'Setup Complete' : 'Setup Authenticator'}
          </button>
        </div>
      ))}

      {/* Add Recovery Contact Modal */}
      {renderModal('addrecovery', 'Add Recovery Contact', (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Contact Type
            </label>
            <select
              value={recoveryType}
              onChange={(e) => setRecoveryType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="phone">Phone Number</option>
              <option value="email">Email Address</option>
              <option value="streekx_id">StreekX ID</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {recoveryType === 'phone' ? 'Phone Number' : recoveryType === 'email' ? 'Email Address' : 'StreekX ID'}
            </label>
            <input
              type={recoveryType === 'email' ? 'email' : 'text'}
              placeholder={recoveryType === 'phone' ? '+1234567890' : recoveryType === 'email' ? 'example@email.com' : 'example/streekx.not'}
              value={recoveryValue}
              onChange={(e) => setRecoveryValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2c2c2e] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAddRecovery}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? 'Sending verification...' : 'Add Recovery Contact'}
          </button>
        </div>
      ))}
    </div>
  );
}
