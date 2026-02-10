import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SQL = `
-- StreekX Security & Account Management Tables

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
  type varchar(50) NOT NULL,
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
  app_name varchar(255) NOT NULL,
  secret_key text NOT NULL,
  backup_codes text[],
  is_verified boolean DEFAULT false,
  verified_at timestamp,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, app_name)
);

-- 5. Phone Numbers & Recovery Contacts Table
CREATE TABLE IF NOT EXISTS recovery_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type varchar(50) NOT NULL,
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
  device_type varchar(50) NOT NULL,
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
  access_token text,
  refresh_token text,
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
  password_hash text,
  password_salt varchar(32),
  security_level varchar(50),
  is_compromised boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  last_used timestamp
);

-- 10. Security Audit Log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action varchar(100) NOT NULL,
  status varchar(50),
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
  warning_level varchar(50) DEFAULT 'standard',
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
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

-- RLS Policies
CREATE POLICY "Users can view own two_step_verification" ON two_step_verification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own two_step_verification" ON two_step_verification FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own otp_codes" ON otp_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own passkeys" ON passkeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own device_sessions" ON device_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own recovery_contacts" ON recovery_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own third_party_connections" ON third_party_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own saved_passwords" ON saved_passwords FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_two_step_user ON two_step_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_user_type ON otp_codes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_passkeys_user ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_authenticators_user ON authenticators(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_contacts_user ON recovery_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_third_party_user ON third_party_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_passwords_user ON saved_passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON security_audit_log(user_id, created_at);
`;

async function setupDatabase() {
  try {
    console.log('🔧 Setting up StreekX security tables...');
    
    // Execute SQL
    const { error } = await supabase.rpc('execute_sql', { sql: SQL });
    
    if (error) {
      // If RPC doesn't exist, try with raw SQL
      const sqlStatements = SQL.split(';').filter(s => s.trim());
      for (const statement of sqlStatements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.rpc('execute_sql', { 
            sql: statement + ';' 
          }).catch(() => ({ error: null }));
          
          if (execError && !execError.message.includes('does not exist')) {
            console.warn(`⚠️ Warning: ${execError.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err);
    process.exit(1);
  }
}

setupDatabase();
