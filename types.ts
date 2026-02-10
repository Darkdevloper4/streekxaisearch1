
// Security & Authentication
export interface SecuritySettings {
  two_step_enabled: boolean;
  backup_streekx_id?: string;
  passkey_enabled: boolean;
  security_key_enabled: boolean;
  authenticator_enabled: boolean;
  recovery_email?: string;
  safe_browsing: boolean;
  skip_password_possible: boolean;
  security_codes: string[];
  active_sessions: DeviceSession[];
  third_party_connections: ThirdPartyConnection[];
  saved_passwords: SavedPassword[];
}

export interface DeviceSession {
  id: string;
  device_name: string;
  device_type: 'android' | 'ios' | 'windows' | 'mac' | 'web';
  last_used: string;
  location: string;
  is_current: boolean;
}

export interface ThirdPartyConnection {
  id: string;
  app_name: string;
  app_icon?: string;
  connected_at: string;
  permissions: string[];
  last_accessed: string;
}

export interface SavedPassword {
  id: string;
  app_name: string;
  username: string;
  created_at: string;
}

// User & Profile
export interface UserProfile {
  id: string;
  streekx_id: string; // Auth Identity (Format: user/streekx.not) - NOT an email
  username: string;   // Public Profile Handle (e.g. @explorer)
  full_name: string;
  avatar_url?: string;
  bio?: string;       // Public Bio
  job_title?: string; // For Workspace context
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  mobile?: string;
  recovery_id?: string;
  recovery_email?: string;
  two_step_enabled?: boolean;
  passkey_enabled?: boolean;
  authenticator_enabled?: boolean;
  security: SecuritySettings;
  created_at: string;
}

// Project / Workspace (Perplexity Collections Style)
export interface Project {
  id: string;
  title: string;
  emoji: string;
  description: string;
  ai_prompt: string; // Custom System Instruction for this collection
  visibility: 'Public' | 'Private';
  created_at: number;
  updated_at: number;
}

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  type: 'Personal' | 'Team' | 'Education';
  is_active: boolean;
  members?: string[]; // IDs of users
}

// Search & AI
export type SearchMode = 'Standard' | 'Pro' | 'Research' | 'Labs';

export interface SourceFlags {
    web: boolean;
    academic: boolean;
    finance: boolean;
    social: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string; // Base64
  name: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  source: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: SearchResult[]; // Updated to hold full search results
  attachments?: Attachment[];
  relatedQuestions?: string[]; // For follow-up suggestions
}

export interface SearchSession {
  id: string;
  query: string;
  timestamp: number;
  messages: ChatMessage[];
  projectId?: string; // Link to a project context
  mode?: SearchMode; // Store which mode was used
  sourceFlags?: SourceFlags;
}

// Weather
export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
}

// App State
export type Screen = 
  | 'INTRO' 
  | 'AUTH' 
  | 'HOME' 
  | 'SEARCH' 
  | 'ASSISTANT'
  | 'PROFILE' 
  | 'EDIT_PROFILE'
  | 'SETTINGS'
  | 'ACCOUNT'
  | 'PROJECTS'
  | 'PROJECT_DETAIL' // View inside a project
  | 'WORKSPACE'
  | 'FEEDBACK'
  | 'DISCOVERY'
  | 'HISTORY'
  | 'NOTIFICATIONS';

export interface AppState {
  currentScreen: Screen;
  user: UserProfile | null;
  theme: 'light' | 'dark';
  currentSearchId: string | null;
}
