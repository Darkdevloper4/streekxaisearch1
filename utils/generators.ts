/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random security code (alphanumeric, 12 chars)
 */
export function generateSecurityCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate random device ID
 */
export function generateDeviceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Format code for display (e.g., "XXXX-XXXX-XXXX")
 */
export function formatSecurityCode(code: string): string {
  return code.replace(/(.{4})/g, '$1-').slice(0, -1);
}
