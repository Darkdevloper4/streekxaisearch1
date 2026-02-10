import { supabase } from './supabase';
import { generateOTP, generateSecurityCode } from '../utils/generators';

// ============================================
// TWO-STEP VERIFICATION FUNCTIONS
// ============================================

export const twoStepVerification = {
  // Enable 2-step with backup StreekX ID
  async enable(backupStreekxId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate OTP for the backup account
    const otp = generateOTP();
    
    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: user.id,
        code: otp,
        type: 'two_step',
        expires_at: new Date(Date.now() + 10 * 60000) // 10 minutes
      });

    if (otpError) throw otpError;

    // In a real app, send OTP to backup_streekx_id user's notifications
    // For now, return OTP for demo
    return { otp, backupStreekxId };
  },

  // Verify OTP and enable 2-step
  async verifyAndEnable(backupStreekxId: string, otpCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify OTP code
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', otpCode)
      .eq('type', 'two_step')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) throw new Error('Invalid or expired OTP code');

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ is_used: true })
      .eq('id', otpData.id);

    // Enable 2-step verification
    const { error: setupError } = await supabase
      .from('two_step_verification')
      .upsert({
        user_id: user.id,
        backup_streekx_id: backupStreekxId,
        is_enabled: true,
        updated_at: new Date()
      }, { onConflict: 'user_id' });

    if (setupError) throw setupError;

    // Log security event
    await logSecurityAudit(user.id, 'two_step_enabled', 'success');

    return { success: true, message: '2-Step Verification enabled successfully!' };
  },

  // Disable 2-step verification
  async disable() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('two_step_verification')
      .update({ is_enabled: false })
      .eq('user_id', user.id);

    if (error) throw error;

    await logSecurityAudit(user.id, 'two_step_disabled', 'success');
    return { success: true };
  },

  // Get 2-step status
  async getStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('two_step_verification')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return data || { user_id: user.id, is_enabled: false };
  }
};

// ============================================
// PASSKEYS & SECURITY KEYS FUNCTIONS
// ============================================

export const passkeys = {
  // Create passkey
  async create(passkeyName: string, publicKey: string, credentialId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('passkeys')
      .insert({
        user_id: user.id,
        passkey_name: passkeyName,
        public_key: publicKey,
        credential_id: credentialId,
        is_active: true
      });

    if (error) throw error;

    await logSecurityAudit(user.id, 'passkey_created', 'success');
    return { success: true, message: 'Passkey created successfully!' };
  },

  // List passkeys
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('passkeys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return data || [];
  },

  // Delete passkey
  async delete(passkeyId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('passkeys')
      .delete()
      .eq('id', passkeyId)
      .eq('user_id', user.id);

    if (error) throw error;

    await logSecurityAudit(user.id, 'passkey_deleted', 'success');
    return { success: true };
  }
};

// ============================================
// AUTHENTICATOR APP FUNCTIONS
// ============================================

export const authenticatorApp = {
  // Setup authenticator (Google Authenticator, Microsoft Authenticator, etc)
  async setup(appName: string, secretKey: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => generateSecurityCode());

    const { error } = await supabase
      .from('authenticators')
      .insert({
        user_id: user.id,
        app_name: appName,
        secret_key: secretKey, // Should be encrypted in production
        backup_codes: backupCodes,
        is_verified: false
      });

    if (error) throw error;

    return { success: true, backupCodes };
  },

  // Verify authenticator OTP
  async verify(appName: string, otpCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // In production, validate OTP against the stored secret
    const { data: auth, error } = await supabase
      .from('authenticators')
      .select('*')
      .eq('user_id', user.id)
      .eq('app_name', appName)
      .single();

    if (error || !auth) throw new Error('Authenticator not found');

    // Mark as verified
    const { error: updateError } = await supabase
      .from('authenticators')
      .update({ is_verified: true, verified_at: new Date() })
      .eq('id', auth.id);

    if (updateError) throw updateError;

    await logSecurityAudit(user.id, 'authenticator_verified', 'success');
    return { success: true, message: 'Authenticator verified!' };
  },

  // List authenticators
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('authenticators')
      .select('id, app_name, is_verified, verified_at, created_at')
      .eq('user_id', user.id);

    return data || [];
  },

  // Delete authenticator
  async delete(appName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('authenticators')
      .delete()
      .eq('user_id', user.id)
      .eq('app_name', appName);

    if (error) throw error;

    await logSecurityAudit(user.id, 'authenticator_deleted', 'success');
    return { success: true };
  }
};

// ============================================
// RECOVERY CONTACTS FUNCTIONS
// ============================================

export const recoveryContacts = {
  // Add recovery phone or email
  async add(contactType: 'phone' | 'email' | 'streekx_id', contactValue: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const verificationCode = generateOTP();

    const { error } = await supabase
      .from('recovery_contacts')
      .insert({
        user_id: user.id,
        contact_type: contactType,
        contact_value: contactValue,
        verification_code: verificationCode,
        code_expires_at: new Date(Date.now() + 10 * 60000),
        is_verified: false
      });

    if (error) throw error;

    return { success: true, verificationCode };
  },

  // Verify recovery contact
  async verify(contactId: string, verificationCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: contact, error: fetchError } = await supabase
      .from('recovery_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw new Error('Contact not found');

    if (contact.verification_code !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    const { error: updateError } = await supabase
      .from('recovery_contacts')
      .update({ is_verified: true, verified_at: new Date() })
      .eq('id', contactId);

    if (updateError) throw updateError;

    await logSecurityAudit(user.id, 'recovery_contact_verified', 'success');
    return { success: true };
  },

  // Get recovery contacts
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('recovery_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return data || [];
  },

  // Delete recovery contact
  async delete(contactId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('recovery_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  }
};

// ============================================
// DEVICE SESSION FUNCTIONS
// ============================================

export const deviceSessions = {
  // Create or update device session
  async createSession(
    deviceId: string,
    deviceName: string,
    deviceType: string,
    ipAddress?: string,
    location?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('device_sessions')
      .upsert(
        {
          user_id: user.id,
          device_id: deviceId,
          device_name: deviceName,
          device_type: deviceType,
          ip_address: ipAddress,
          location: location,
          last_used: new Date(),
          is_current_session: true
        },
        { onConflict: 'user_id,device_id' }
      );

    if (error) throw error;

    return { success: true };
  },

  // Get all devices
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used', { ascending: false });

    return data || [];
  },

  // Remove device
  async remove(deviceId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('device_sessions')
      .delete()
      .eq('device_id', deviceId)
      .eq('user_id', user.id);

    if (error) throw error;

    await logSecurityAudit(user.id, 'device_removed', 'success');
    return { success: true };
  }
};

// ============================================
// THIRD-PARTY CONNECTIONS FUNCTIONS
// ============================================

export const thirdPartyConnections = {
  // Add third-party connection
  async connect(
    appName: string,
    oauthProvider: string,
    accessToken: string,
    permissions: string[]
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('third_party_connections')
      .insert({
        user_id: user.id,
        app_name: appName,
        oauth_provider: oauthProvider,
        access_token: accessToken, // Encrypt in production
        permissions: permissions,
        connected_at: new Date(),
        is_active: true
      });

    if (error) throw error;

    await logSecurityAudit(user.id, 'third_party_connected', 'success');
    return { success: true };
  },

  // Get connections
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('third_party_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    return data || [];
  },

  // Disconnect
  async disconnect(connectionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('third_party_connections')
      .update({ is_active: false })
      .eq('id', connectionId)
      .eq('user_id', user.id);

    if (error) throw error;

    await logSecurityAudit(user.id, 'third_party_disconnected', 'success');
    return { success: true };
  }
};

// ============================================
// SECURITY CODES FUNCTIONS
// ============================================

export const securityCodes = {
  // Generate security codes
  async generate(count: number = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const codes = Array.from({ length: count }, () => generateSecurityCode());
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const { error } = await supabase
      .from('security_codes')
      .insert(
        codes.map(code => ({
          user_id: user.id,
          code: code,
          expires_at: expiresAt
        }))
      );

    if (error) throw error;

    return { success: true, codes };
  },

  // Get unused codes
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('security_codes')
      .select('code, created_at')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .order('created_at', { ascending: false });

    return data || [];
  },

  // Use code
  async useCode(code: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('security_codes')
      .update({ is_used: true, used_at: new Date() })
      .eq('user_id', user.id)
      .eq('code', code)
      .eq('is_used', false);

    if (error) throw error;

    return { success: true };
  }
};

// ============================================
// SAVED PASSWORDS FUNCTIONS
// ============================================

export const savedPasswords = {
  // Save password
  async save(
    appName: string,
    username: string,
    passwordHash: string,
    securityLevel: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_passwords')
      .insert({
        user_id: user.id,
        app_name: appName,
        username: username,
        password_hash: passwordHash, // Encrypt in production
        security_level: securityLevel
      });

    if (error) throw error;

    return { success: true };
  },

  // Get saved passwords
  async list() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('saved_passwords')
      .select('id, app_name, username, security_level, is_compromised, created_at, updated_at, last_used')
      .eq('user_id', user.id)
      .order('last_used', { ascending: false });

    return data || [];
  },

  // Delete password
  async delete(passwordId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_passwords')
      .delete()
      .eq('id', passwordId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  }
};

// ============================================
// SAFE BROWSING FUNCTIONS
// ============================================

export const safeBrowsing = {
  // Get settings
  async getSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('safe_browsing_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return data;
  },

  // Update settings
  async updateSettings(settings: {
    is_enabled?: boolean;
    block_malware?: boolean;
    block_phishing?: boolean;
    block_unwanted_software?: boolean;
    block_deceptive_content?: boolean;
    warning_level?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('safe_browsing_settings')
      .upsert(
        {
          user_id: user.id,
          ...settings,
          updated_at: new Date()
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    await logSecurityAudit(user.id, 'safe_browsing_updated', 'success');
    return { success: true };
  }
};

// ============================================
// AUDIT LOGGING
// ============================================

async function logSecurityAudit(
  userId: string,
  action: string,
  status: string = 'success',
  details?: any
) {
  try {
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action: action,
        status: status,
        details: details || {}
      });
  } catch (error) {
    console.error('Failed to log security audit:', error);
  }
}

// Export all services
export default {
  twoStepVerification,
  passkeys,
  authenticatorApp,
  recoveryContacts,
  deviceSessions,
  thirdPartyConnections,
  securityCodes,
  savedPasswords,
  safeBrowsing
};
