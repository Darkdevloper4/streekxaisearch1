import { createClient } from '@supabase/supabase-js';
import { DeviceSession, NotificationItem, SecurityPreferences, UserProfile, Project, SearchSession } from '../types';

// Real Supabase Configuration
const SUPABASE_URL = 'https://wyqruqdgjmxwyhpybqha.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7wT2EtTVpISAXHe5idr0cg_7CriYwvM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// Helper to generate a local offline user if Supabase fails
const createOfflineUser = (data: any): UserProfile => {
    return {
        id: 'local_' + crypto.randomUUID(),
        streekx_id: data.streekx_id,
        username: data.username || 'User',
        full_name: data.full_name || 'Offline User',
        dob: data.dob,
        gender: data.gender,
        mobile: data.mobile,
        created_at: new Date().toISOString(),
    };
};

export const authService = {
  signIn: async (streekxId: string, password: string): Promise<UserProfile> => {
    const emailLocal = streekxId.replace(/[^a-zA-Z0-9._-]/g, '');
    const email = `${emailLocal}@streekx.ai`;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("User data unavailable");

        const meta = data.user.user_metadata || {};

        // 1. Force Profile Check/Update
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        // If profile missing or we want to ensure latest metadata sync
        if (!existingProfile) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                streekx_id: meta.streekx_id || streekxId,
                username: meta.username || 'User',
                full_name: meta.full_name || 'User',
                avatar_url: meta.avatar_url,
                dob: meta.dob,
                gender: meta.gender,
                mobile: meta.mobile,
                updated_at: new Date().toISOString()
            });
        }

        // 2. Return the profile
        const { data: finalProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        return {
            id: data.user.id,
            streekx_id: finalProfile?.streekx_id || meta.streekx_id,
            username: finalProfile?.username || meta.username,
            full_name: finalProfile?.full_name || meta.full_name,
            avatar_url: finalProfile?.avatar_url || meta.avatar_url,
            bio: finalProfile?.bio || meta.bio,
            job_title: finalProfile?.job_title || meta.job_title,
            dob: finalProfile?.dob || meta.dob,
            gender: finalProfile?.gender || meta.gender,
            mobile: finalProfile?.mobile || meta.mobile,
            created_at: finalProfile?.created_at || data.user.created_at,
        } as UserProfile;

    } catch (error: any) {
        if (error.message.includes("Invalid login") || error.message.includes("credentials")) {
            throw new Error("Incorrect StreekX ID or password.");
        }
        throw new Error(error.message || "Authentication failed");
    }
  },

  signUp: async (data: any): Promise<UserProfile> => {
    const emailLocal = data.streekx_id.replace(/[^a-zA-Z0-9._-]/g, '');
    const email = `${emailLocal}@streekx.ai`;

    try {
        // 1. Create Auth User
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password: data.password,
          options: {
            data: {
                streekx_id: data.streekx_id,
                username: data.username,
                full_name: data.full_name,
                dob: data.dob,
                mobile: data.mobile,
                gender: data.gender
            }
          }
        });

        if (error) throw error;
        if (!authData.user) throw new Error("ID creation failed.");

        // 2. CRITICAL: Manually Insert Profile
        // We do NOT rely on SQL triggers alone because they often fail silently or have permission issues.
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            streekx_id: data.streekx_id,
            username: data.username,
            full_name: data.full_name,
            dob: data.dob,
            mobile: data.mobile,
            gender: data.gender,
            created_at: new Date().toISOString()
        });

        if (profileError) {
            console.error("Manual Profile Creation Error:", profileError);
            // We don't throw here, we try to proceed, maybe the trigger worked.
        }

        // 3. Handle Session
        if (!authData.session) {
            // Attempt immediate login
             const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password: data.password
            });
            
            if (loginError || !loginData.session) {
                 // Fallback to offline if we created a user but can't login (e.g. email verify required)
                 console.warn("User created but login failed. Using Offline Mode temporarily.");
                 return createOfflineUser(data);
            }
            authData.session = loginData.session;
            authData.user = loginData.user;
        }

        const meta = authData.user?.user_metadata || {};

        return {
            id: authData.user!.id,
            streekx_id: meta.streekx_id || data.streekx_id,
            username: meta.username || data.username,
            full_name: meta.full_name || data.full_name,
            created_at: new Date().toISOString(),
            dob: meta.dob,
            mobile: meta.mobile,
            gender: meta.gender
        } as UserProfile;

    } catch (error: any) {
        console.warn("Supabase Signup Error:", error.message);
        
        // Strict Fallback for unavailable service
        if (
            error.message?.toLowerCase().includes("signups are disabled") ||
            error.status === 429 || 
            error.status === 500
        ) {
            console.log("Activating Local/Guest Fallback due to backend restriction.");
            return createOfflineUser(data);
        }

        if (error.message?.includes("already registered") || error.message?.includes("unique")) {
            throw new Error("This StreekX ID is already taken. Please try another.");
        }

        // Default to Offline if critical failure, to let user test the UI
        return createOfflineUser(data);
    }
  },

  signOut: async () => {
      await supabase.auth.signOut();
  }
};

// Database Helpers
const isLocalUserId = (userId: string) => isLocalUserId(userId);

export const db = {
    // Sync Projects: Load from DB
    async loadProjects(userId: string): Promise<Project[]> {
        if (isLocalUserId(userId)) return []; 
        
        const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
        if (error) {
            console.error("Supabase: Error loading projects:", error);
            return [];
        }
        return data as Project[];
    },

    // Sync Projects: Save/Update
    async saveProject(project: Project, userId: string) {
        if (isLocalUserId(userId)) return;

        const { error } = await supabase.from('projects').upsert({
            id: project.id,
            user_id: userId,
            title: project.title,
            emoji: project.emoji,
            description: project.description,
            ai_prompt: project.ai_prompt,
            visibility: project.visibility,
            created_at: project.created_at,
            updated_at: project.updated_at
        });
        if (error) console.error("Supabase: Error saving project:", error);
    },

    // Sync History: Load
    async loadSessions(userId: string): Promise<SearchSession[]> {
        if (isLocalUserId(userId)) return [];

        // Fetch sessions and their messages
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`*, messages (*)`)
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error("Supabase: Error loading history:", error);
            return [];
        }

        // Map DB structure back to app types
        return sessions.map((s: any) => ({
            id: s.id,
            query: s.query,
            timestamp: s.timestamp,
            projectId: s.project_id,
            messages: (s.messages || []).sort((a: any, b: any) => a.timestamp - b.timestamp).map((m: any) => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                sources: m.sources,
                attachments: m.attachments
            }))
        }));
    },

    // Sync History: Save Session & Messages
    async saveSession(session: SearchSession, userId: string) {
        if (isLocalUserId(userId)) return;

        // 1. Upsert Session
        const { error: sErr } = await supabase.from('sessions').upsert({
            id: session.id,
            user_id: userId,
            query: session.query,
            timestamp: session.timestamp,
            project_id: session.projectId
        });
        
        if (sErr) {
             console.error("Supabase: Error saving session:", sErr);
             return;
        }

        // 2. Delete old messages
        await supabase.from('messages').delete().eq('session_id', session.id);

        // 3. Insert all current messages
        const messagesToInsert = session.messages.map(m => ({
            session_id: session.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            sources: m.sources,
            attachments: m.attachments
        }));

        if (messagesToInsert.length > 0) {
            const { error: mErr } = await supabase.from('messages').insert(messagesToInsert);
            if (mErr) console.error("Supabase: Error saving messages:", mErr);
        }
    },

    async deleteSession(sessionId: string) {
        await supabase.from('sessions').delete().eq('id', sessionId);
    },

    async clearAllSessions(userId: string) {
        if (isLocalUserId(userId)) return;
        const { error } = await supabase.from('sessions').delete().eq('user_id', userId);
        if (error) console.error("Error clearing history:", error);
    },

    async deleteProject(projectId: string) {
        await supabase.from('projects').delete().eq('id', projectId);
    }
};

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const profileService = {
  async updateProfile(userId: string, patch: Partial<UserProfile>) {
    if (isLocalUserId(userId)) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() });

    if (error) throw error;
  },

  async getUserIdByStreekxId(streekxId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('streekx_id', streekxId)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  },
};

export const notificationsService = {
  async list(userId: string): Promise<NotificationItem[]> {
    if (isLocalUserId(userId)) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as NotificationItem[];
  },

  async markRead(userId: string, notificationId: string) {
    if (isLocalUserId(userId)) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async create(notification: Omit<NotificationItem, 'id' | 'created_at'>) {
    const { error } = await supabase.from('notifications').insert(notification);
    if (error) throw error;
  },

  subscribe(userId: string, onChange: () => void) {
    if (isLocalUserId(userId)) return () => {};

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export const securityPreferencesService = {
  async get(userId: string): Promise<SecurityPreferences | null> {
    if (isLocalUserId(userId)) return null;

    const { data, error } = await supabase
      .from('security_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as SecurityPreferences) || null;
  },

  async upsert(userId: string, patch: Partial<Omit<SecurityPreferences, 'user_id' | 'updated_at'>>) {
    if (isLocalUserId(userId)) return;

    const { error } = await supabase.from('security_preferences').upsert({
      user_id: userId,
      skip_password: patch.skip_password ?? false,
      safe_browsing: patch.safe_browsing ?? false,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },
};

export const deviceService = {
  async upsertCurrentDevice(userId: string) {
    if (isLocalUserId(userId)) return;

    const platform = navigator.platform || 'Unknown';
    const userAgent = navigator.userAgent || 'Unknown';
    const deviceName = platform;
    const fingerprint = await sha256Hex(`${platform}|${userAgent}`);

    const { error } = await supabase.from('device_sessions').upsert({
      user_id: userId,
      device_fingerprint: fingerprint,
      device_name: deviceName,
      platform,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  async list(userId: string): Promise<DeviceSession[]> {
    if (isLocalUserId(userId)) return [];

    const { data, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DeviceSession[];
  },

  subscribe(userId: string, onChange: () => void) {
    if (isLocalUserId(userId)) return () => {};

    const channel = supabase
      .channel(`device_sessions_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_sessions', filter: `user_id=eq.${userId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export const twoStepService = {
  async beginSetup(initiatorUser: UserProfile, backupStreekxId: string) {
    if (isLocalUserId(initiatorUser.id)) throw new Error('2-Step Verification is unavailable in offline mode.');

    const backupUserId = await profileService.getUserIdByStreekxId(backupStreekxId);
    if (!backupUserId) throw new Error('That StreekX ID does not exist.');

    const otp = generateOtpCode();
    const otpHash = await sha256Hex(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: challenge, error: challengeError } = await supabase
      .from('two_step_challenges')
      .insert({
        user_id: initiatorUser.id,
        backup_user_id: backupUserId,
        backup_streekx_id: backupStreekxId,
        otp_hash: otpHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (challengeError) throw challengeError;

    await notificationsService.create({
      user_id: backupUserId,
      type: 'otp',
      title: '2-Step Verification code',
      body: `Your StreekX verification code is ${otp}`,
      data: { challenge_id: challenge.id, for_streekx_id: initiatorUser.streekx_id },
      read: false,
    });

    return { challengeId: challenge.id as string, expiresAt };
  },

  async verifySetup(initiatorUser: UserProfile, challengeId: string, otp: string) {
    if (isLocalUserId(initiatorUser.id)) throw new Error('2-Step Verification is unavailable in offline mode.');

    const { data, error } = await supabase
      .from('two_step_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('user_id', initiatorUser.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('This verification request no longer exists.');
    if (data.verified_at) throw new Error('This code was already used.');
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) throw new Error('This code has expired.');

    const otpHash = await sha256Hex(otp);
    if (otpHash !== data.otp_hash) throw new Error('Incorrect code.');

    const { error: updErr } = await supabase
      .from('two_step_challenges')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', challengeId)
      .eq('user_id', initiatorUser.id);

    if (updErr) throw updErr;

    await profileService.updateProfile(initiatorUser.id, {
      two_step_enabled: true,
      recovery_id: data.backup_streekx_id,
    });

    return { backupStreekxId: data.backup_streekx_id as string };
  },

  async disable(userId: string) {
    await profileService.updateProfile(userId, { two_step_enabled: false, recovery_id: null as any });
  },
};
