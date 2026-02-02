
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

export const authService = {
  signIn: async (streekxId: string, password: string): Promise<UserProfile> => {
    // Sanitize but keep structure to avoid collisions. 
    // e.g. "user.name" -> "user.name@streekx.ai"
    const emailLocal = streekxId.replace(/[^a-zA-Z0-9._-]/g, '');
    const email = `${emailLocal}@streekx.ai`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("User data unavailable");

    // Fetch rich profile data from the public.profiles table if available
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    const meta = data.user.user_metadata || {};
    
    // Merge Auth metadata with Profile table data
    return {
        id: data.user.id,
        streekx_id: profile?.streekx_id || meta.streekx_id || streekxId,
        username: profile?.username || meta.username || 'User',
        full_name: profile?.full_name || meta.full_name || 'User',
        avatar_url: profile?.avatar_url || meta.avatar_url,
        bio: profile?.bio || meta.bio,
        job_title: profile?.job_title || meta.job_title,
        dob: profile?.dob || meta.dob,
        gender: profile?.gender || meta.gender,
        mobile: profile?.mobile || meta.mobile,
        created_at: profile?.created_at || data.user.created_at,
    } as UserProfile;
  },

  signUp: async (data: any): Promise<UserProfile> => {
    const emailLocal = data.streekx_id.replace(/[^a-zA-Z0-9._-]/g, '');
    const email = `${emailLocal}@streekx.ai`;

    // 1. Create the user
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

    // 2. Handle Auto-Login vs Email Confirmation
    if (authData.user && !authData.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password: data.password
        });
        
        if (loginError || !loginData.session) {
             throw new Error("Account created successfully! Please check your email inbox to confirm your account before logging in.");
        }
        
        authData.session = loginData.session;
        authData.user = loginData.user;
    }

    if (!authData.user) throw new Error("Signup failed. Please try again.");

    // 3. Return the profile
    const meta = authData.user.user_metadata || {};

    return {
        id: authData.user.id,
        streekx_id: meta.streekx_id || data.streekx_id,
        username: meta.username || data.username,
        full_name: meta.full_name || data.full_name,
        created_at: new Date().toISOString(),
        dob: meta.dob,
        mobile: meta.mobile,
        gender: meta.gender
    } as UserProfile;
  },

  signOut: async () => {
      await supabase.auth.signOut();
  }
};

// Database Helpers
export const db = {
    // Sync Projects: Load from DB
    async loadProjects(userId: string): Promise<Project[]> {
        const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
        if (error) {
            console.error("Error loading projects:", error);
            return [];
        }
        return data as Project[];
    },

    // Sync Projects: Save/Update
    async saveProject(project: Project, userId: string) {
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
        if (error) console.error("Error saving project:", error);
    },

    // Sync History: Load
    async loadSessions(userId: string): Promise<SearchSession[]> {
        // Fetch sessions and their messages
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`*, messages (*)`)
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error("Error loading history:", error);
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
        // 1. Upsert Session
        const { error: sErr } = await supabase.from('sessions').upsert({
            id: session.id,
            user_id: userId,
            query: session.query,
            timestamp: session.timestamp,
            project_id: session.projectId
        });
        if (sErr) {
             console.error("Error saving session:", sErr);
             return;
        }

        // 2. Delete old messages for this session to avoid duplication/complexity on sync
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
            if (mErr) console.error("Error saving messages:", mErr);
        }
    },

    async deleteSession(sessionId: string) {
        await supabase.from('sessions').delete().eq('id', sessionId);
    },

    async deleteProject(projectId: string) {
        await supabase.from('projects').delete().eq('id', projectId);
    }
};
