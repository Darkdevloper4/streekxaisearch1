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
  two_step_enabled?: boolean;
  created_at: string;
}

export type NotificationType = 'info' | 'security' | 'otp' | 'prompt';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface SecurityPreferences {
  user_id: string;
  skip_password: boolean;
  safe_browsing: boolean;
  updated_at: string;
}

export interface DeviceSession {
  id: string;
  user_id: string;
  device_name: string;
  platform: string;
  user_agent: string;
  last_seen_at: string;
  created_at: string;
  is_lost: boolean;
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

export type SearchFilter = 'All' | 'Images' | 'Videos' | 'Maps' | 'Shopping';

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

export type SearchResultType = 'web' | 'image' | 'video' | 'map' | 'shopping';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  source: string;
  type?: SearchResultType; // NEW: Type of result
  imageUrl?: string; // For image/shopping results
  thumbnailUrl?: string; // For video/image results
  videoUrl?: string; // For video results
  coordinates?: { lat: number; lng: number }; // For map results
  price?: string; // For shopping results
  rating?: number; // For shopping/map results
  reviews?: number; // For shopping/map results
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
  allResults?: SearchResult[]; // NEW: All search results from search
  currentFilter?: SearchFilter; // NEW: Currently applied filter
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
  | 'SEARCH_RESULTS' // NEW: Google-like results view before creating thread
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
