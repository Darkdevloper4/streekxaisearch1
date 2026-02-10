-- StreekX Security & Account Management Tables
-- This migration creates all tables needed for production-grade account security

-- 1. Two-Step Verification & OTP Table
CREATE TABLE IF NOT EXISTS two_step_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_streekx_id varchar(255),
  is_enabled boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. OTP/Verification Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code varchar(6) NOT NULL,
  type varchar(50) NOT NULL, -- 'two_step', 'recovery', 'passkey_setup'
  is_used boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  expires_at timestamp NOT NULL,
  UNIQUE(user_id, code)
);

-- 3. Passkeys & Security Keys Table
CREATE TABLE IF NOT EXISTS passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passkey_name varchar(255) NOT NULL,
  public_key text NOT NULL,
  credential_id varchar(255) NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  last_used timestamp,
  UNIQUE(user_id, credential_id)
);

-- 4. Authenticator Apps Table (TOTP)
CREATE TABLE IF NOT EXISTS authenticators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name varchar(255) NOT NULL, -- 'Google Authenticator', 'Microsoft Authenticator'
  secret_key text NOT NULL, -- encrypted base32 secret
  backup_codes text[], -- array of backup codes
  is_verified boolean DEFAULT false,
  verified_at timestamp,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, app_name)
);

-- 5. Phone Numbers & Recovery Contacts Table
CREATE TABLE IF NOT EXISTS recovery_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type varchar(50) NOT NULL, -- 'phone', 'email', 'streekx_id'
  contact_value varchar(255) NOT NULL,
  is_verified boolean DEFAULT false,
  verification_code varchar(6),
  code_expires_at timestamp,
  is_primary boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  verified_at timestamp
);

-- 6. Security Codes Table
CREATE TABLE IF NOT EXISTS security_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL UNIQUE,
  is_used boolean DEFAULT false,
  used_at timestamp,
  generated_at timestamp DEFAULT now(),
  expires_at timestamp
);

-- 7. Device Sessions & Management Table
CREATE TABLE IF NOT EXISTS device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id varchar(255) NOT NULL,
  device_name varchar(255) NOT NULL,
  device_type varchar(50) NOT NULL, -- 'android', 'ios', 'windows', 'mac', 'web'
  browser_info varchar(255),
  ip_address inet,
  location varchar(255),
  is_current_session boolean DEFAULT false,
  last_used timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  expires_at timestamp,
  UNIQUE(user_id, device_id)
);

-- 8. Third-Party App Connections Table
CREATE TABLE IF NOT EXISTS third_party_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name varchar(255) NOT NULL,
  app_icon_url text,
  oauth_provider varchar(100),
  access_token text, -- encrypted
  refresh_token text, -- encrypted
  scopes text[],
  permissions text[],
  connected_at timestamp DEFAULT now(),
  last_accessed timestamp,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, app_name)
);

-- 9. Saved Passwords & Credentials Table
CREATE TABLE IF NOT EXISTS saved_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name varchar(255) NOT NULL,
  username varchar(255) NOT NULL,
  password_hash text, -- encrypted password hash
  password_salt varchar(32),
  security_level varchar(50), -- 'weak', 'fair', 'strong', 'very_strong'
  is_compromised boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  last_used timestamp
);

-- 10. Security Audit Log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action varchar(100) NOT NULL, -- 'password_changed', '2fa_enabled', 'device_added', etc
  status varchar(50), -- 'success', 'failed', 'pending'
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp DEFAULT now()
);

-- 11. Safe Browsing Preferences
CREATE TABLE IF NOT EXISTS safe_browsing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled boolean DEFAULT true,
  block_malware boolean DEFAULT true,
  block_phishing boolean DEFAULT true,
  block_unwanted_software boolean DEFAULT true,
  block_deceptive_content boolean DEFAULT true,
  warning_level varchar(50) DEFAULT 'standard', -- 'standard', 'enhanced'
  updated_at timestamp DEFAULT now()
);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE two_step_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE authenticators ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_browsing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own two_step_verification" 
  ON two_step_verification FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own two_step_verification" 
  ON two_step_verification FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own otp_codes" 
  ON otp_codes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own passkeys" 
  ON passkeys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own device_sessions" 
  ON device_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recovery_contacts" 
  ON recovery_contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own third_party_connections" 
  ON third_party_connections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved_passwords" 
  ON saved_passwords FOR SELECT 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_two_step_user ON two_step_verification(user_id);
CREATE INDEX idx_otp_user_type ON otp_codes(user_id, type);
CREATE INDEX idx_passkeys_user ON passkeys(user_id);
CREATE INDEX idx_authenticators_user ON authenticators(user_id);
CREATE INDEX idx_recovery_contacts_user ON recovery_contacts(user_id);
CREATE INDEX idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX idx_third_party_user ON third_party_connections(user_id);
CREATE INDEX idx_saved_passwords_user ON saved_passwords(user_id);
CREATE INDEX idx_audit_log_user ON security_audit_log(user_id, created_at);
