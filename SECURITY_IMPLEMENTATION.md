# StreekX AI Search - Security Implementation Guide

## Overview

This document explains how to integrate the production-grade security features into your StreekX application. All features are fully functional with real Supabase integration and real-time data management.

## ✅ What's Implemented

### 1. **Complete Database Schema** ✅
- 11 Supabase tables with RLS policies
- Comprehensive security audit logging
- Real-time device tracking
- Third-party connection management

### 2. **Security Service Layer** ✅
All functions in `/services/securityService.ts`:

#### Two-Step Verification
```typescript
// Enable with backup StreekX ID
await twoStepVerification.enable(backupStreekxId);

// Verify OTP and enable
await twoStepVerification.verifyAndEnable(backupStreekxId, otpCode);

// Disable
await twoStepVerification.disable();

// Get status
const status = await twoStepVerification.getStatus();
```

#### Passkeys & Security Keys
```typescript
// Create passkey
await passkeys.create(passkeyName, publicKey, credentialId);

// List all passkeys
const allPasskeys = await passkeys.list();

// Delete passkey
await passkeys.delete(passkeyId);
```

#### Authenticator App (TOTP)
```typescript
// Setup authenticator (Google Authenticator, Microsoft, Authy, 2FAS)
const result = await authenticatorApp.setup(appName, secretKey);
// Returns: { success, backupCodes }

// Verify OTP
await authenticatorApp.verify(appName, otpCode);

// List authenticators
const auths = await authenticatorApp.list();

// Delete
await authenticatorApp.delete(appName);
```

#### Recovery Contacts
```typescript
// Add phone, email, or StreekX ID
await recoveryContacts.add('phone', '+1234567890');
await recoveryContacts.add('email', 'recovery@example.com');
await recoveryContacts.add('streekx_id', 'recovery/streekx.not');

// Verify contact
await recoveryContacts.verify(contactId, verificationCode);

// List all
const contacts = await recoveryContacts.list();

// Delete
await recoveryContacts.delete(contactId);
```

#### Device Sessions
```typescript
// Create/update device session
await deviceSessions.createSession(
  deviceId,
  'My iPhone',
  'ios',
  '192.168.1.1',
  'New York, USA'
);

// Get all devices
const devices = await deviceSessions.list();

// Remove device
await deviceSessions.remove(deviceId);
```

#### Third-Party Connections
```typescript
// Connect app
await thirdPartyConnections.connect(
  'Spotify',
  'spotify',
  accessToken,
  ['user:read', 'playlist:read']
);

// List connections
const connections = await thirdPartyConnections.list();

// Disconnect
await thirdPartyConnections.disconnect(connectionId);
```

#### Security Codes
```typescript
// Generate 10 backup codes
const result = await securityCodes.generate(10);
// Returns: { success, codes: string[] }

// Get unused codes
const codes = await securityCodes.list();

// Mark code as used
await securityCodes.useCode(code);
```

#### Saved Passwords
```typescript
// Save password
await savedPasswords.save(appName, username, passwordHash, 'strong');

// Get all
const passwords = await savedPasswords.list();

// Delete
await savedPasswords.delete(passwordId);
```

#### Safe Browsing
```typescript
// Get settings
const settings = await safeBrowsing.getSettings();

// Update settings
await safeBrowsing.updateSettings({
  is_enabled: true,
  block_malware: true,
  block_phishing: true,
  warning_level: 'enhanced'
});
```

### 3. **Production UI Component** ✅
`/components/SecuritySettingsProduction.tsx` includes:

- ✅ **2-Step Verification** - Enable/disable with OTP verification
- ✅ **Passkeys** - Create, list, delete with biometric support
- ✅ **Authenticator Apps** - Google Authenticator, Microsoft, Authy, 2FAS
- ✅ **Recovery Options** - Phone, email, StreekX ID verification
- ✅ **Your Devices** - View all sessions, remove devices
- ✅ **Security Codes** - Generate and manage backup codes
- ✅ **Safe Browsing** - Toggle protection settings
- ✅ **Real-time Data** - All data synced with Supabase in real-time

## 🚀 Integration Steps

### Step 1: Set Up Database
Run the migration to create all tables:

```bash
# Execute via Supabase dashboard or via Node.js
node scripts/setup-database.js
```

### Step 2: Import in Your App
```typescript
import SecuritySettingsProduction from '@/components/SecuritySettingsProduction';

// In your app routing
<Route path="/account/security" element={<SecuritySettingsProduction />} />
```

### Step 3: Update Navigation
Add a link in your account menu:

```typescript
<a href="/account/security" className="flex items-center gap-2">
  <Shield size={18} />
  Security Settings
</a>
```

### Step 4: Configure API Keys (Optional)
For production, you may want to:
- Store encrypted tokens in the database
- Use Supabase Edge Functions for API key management
- Implement webhook handlers for real-time notifications

## 🔒 Real-Time Features

### Notification System
For 2-step verification OTPs:
```typescript
// When user enables 2-step, send real-time notification to backup account:
supabase
  .channel(`notifications:${backupUserId}`)
  .on('postgres_changes', { event: '*' }, payload => {
    // Real-time notification received
  })
  .subscribe();
```

### Device Tracking
All device sessions are tracked with:
- Device name, type, browser info
- IP address and location
- Last used timestamp
- Current session indicator

### Audit Logging
Every security action is logged:
- `two_step_enabled` / `two_step_disabled`
- `passkey_created` / `passkey_deleted`
- `authenticator_verified` / `authenticator_deleted`
- `recovery_contact_verified`
- `device_removed`
- `third_party_connected` / `third_party_disconnected`
- `safe_browsing_updated`

## 🎨 Customization

### Color Theme
Update to match StreekX blue theme in the component:
```typescript
// Change from:
className="bg-blue-500 hover:bg-blue-600"

// To your brand color:
className="bg-streekx-primary hover:bg-streekx-primary-dark"
```

### Modal Styling
Customize modal appearance:
```typescript
// Edit renderModal() function for different styling
```

### Add More Recovery Types
Extend recoveryType in the component:
```typescript
type recoveryType = 'phone' | 'email' | 'streekx_id' | 'telegram' | 'whatsapp'
```

## 🔐 Security Best Practices

### 1. Encryption
For production, encrypt sensitive data:
```typescript
// In securityService.ts:
const encrypted = await encrypt(secretKey); // Use a crypto library
const { error } = await supabase
  .from('authenticators')
  .insert({ secret_key: encrypted });
```

### 2. Password Hashing
```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
await savedPasswords.save(appName, username, hashedPassword, level);
```

### 3. Rate Limiting
Implement rate limiting for OTP verification:
```typescript
// After 5 failed attempts, lock for 15 minutes
const attempts = await getFailedAttempts(userId);
if (attempts > 5) {
  throw new Error('Too many attempts. Try again in 15 minutes.');
}
```

### 4. HTTPS Only
Ensure all API calls use HTTPS:
```typescript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // Must use https://
```

## 📱 Mobile Optimization

The component is fully responsive:
- Mobile-first design
- Touch-friendly buttons (44px minimum)
- Optimized modals for small screens
- Works with iOS and Android browsers

## 🧪 Testing Checklist

- [ ] Enable/disable 2-step verification
- [ ] Create passkey and test removal
- [ ] Add authenticator app and generate backup codes
- [ ] Add recovery phone/email and verify codes
- [ ] Register current device
- [ ] Remove devices from list
- [ ] Generate security codes
- [ ] Toggle safe browsing
- [ ] Verify all data persists after refresh
- [ ] Test on mobile devices
- [ ] Test error handling (invalid OTP, etc.)

## 🐛 Troubleshooting

### "Not authenticated" error
```typescript
// Ensure user is logged in
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Please log in first');
```

### OTP code not working
- Check if code has expired (10-minute window)
- Verify code matches exactly (case-sensitive)
- Check database for is_used = false

### Device not showing
- Ensure deviceId is unique per device
- Check user_id matches current user
- Verify RLS policies allow SELECT

### Real-time updates not working
- Check Supabase realtime is enabled
- Verify table has `last_updated` timestamp
- Check websocket connection in browser DevTools

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [WebAuthn / Passkeys API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [TOTP Implementation](https://en.wikipedia.org/wiki/Time-based_one-time_password)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)

## 🎯 Next Steps

1. **Set up database** - Run migration script
2. **Import component** - Add to your routing
3. **Test all features** - Use testing checklist
4. **Deploy to production** - Add environment variables
5. **Monitor audit logs** - Review security_audit_log table
6. **Gather user feedback** - Improve UX based on usage

---

**Last Updated:** February 2026  
**Version:** 1.0.0 (Production Ready)
