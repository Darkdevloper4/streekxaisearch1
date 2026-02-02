
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Project, SearchSession } from '../types';

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
export const db = {
    // Sync Projects: Load from DB
    async loadProjects(userId: string): Promise<Project[]> {
        if (userId.startsWith('local_')) return []; 
        
        const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
        if (error) {
            console.error("Supabase: Error loading projects:", error);
            return [];
        }
        return data as Project[];
    },

    // Sync Projects: Save/Update
    async saveProject(project: Project, userId: string) {
        if (userId.startsWith('local_')) return;

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
        if (userId.startsWith('local_')) return [];

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
        if (userId.startsWith('local_')) return;

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

    async deleteProject(projectId: string) {
        await supabase.from('projects').delete().eq('id', projectId);
    }
};
