
import React, { useState, useEffect } from 'react';
import { AppState, Screen, UserProfile, WeatherData, ChatMessage, SearchSession, Project, Workspace, Attachment, SearchMode, SourceFlags } from './types';
import { supabase, authService, db } from './services/supabase';
import { getWeather } from './services/weather';
import Home from './components/Home';
import Auth from './components/Auth';
import Intro from './components/Intro';
import Profile from './components/Profile';
import SearchInterface from './components/SearchInterface';
import ManageAccount from './components/ManageAccount'; 
import Notifications from './components/Notifications';
import Projects from './components/Projects';
import WorkspaceManager from './components/Workspace';
import StreekxAssistant from './components/StreekxAssistant'; 
import Settings from './components/Settings';
import History from './components/History'; 
import { FeedbackScreen, DiscoveryScreen } from './components/FeatureScreens';

const App: React.FC = () => {
  // --- STATE ---
  const [screen, setScreen] = useState<Screen>('INTRO');
  const [showAssistant, setShowAssistant] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUsers, setAuthUsers] = useState<UserProfile[]>([]); 

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'ws_default', name: 'My Workspace', emoji: '🏠', type: 'Personal', is_active: true }
  ]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null); 
  const [initialQuery, setInitialQuery] = useState('');
  
  // Search Context State (Ephemeral for new session creation)
  const [initialAttachments, setInitialAttachments] = useState<Attachment[]>([]);
  const [initialMode, setInitialMode] = useState<SearchMode>('Standard');
  const [initialSourceFlags, setInitialSourceFlags] = useState<SourceFlags | undefined>(undefined);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load Auth State
    const storedAuthUsers = localStorage.getItem('streekx_auth_users');
    let loadedUsers: UserProfile[] = [];
    if (storedAuthUsers) {
        loadedUsers = JSON.parse(storedAuthUsers);
        setAuthUsers(loadedUsers);
    }

    const storedActiveUser = localStorage.getItem('streekx_active_user');
    if (storedActiveUser) {
      const activeUser = JSON.parse(storedActiveUser);
      setUser(activeUser);
      setScreen('HOME');
      initWeather();
      loadCloudData(activeUser.id);
    } else if (loadedUsers.length > 0) {
        const firstUser = loadedUsers[0];
        setUser(firstUser);
        localStorage.setItem('streekx_active_user', JSON.stringify(firstUser));
        setScreen('HOME');
        initWeather();
        loadCloudData(firstUser.id);
    } else {
        // Only load local storage if no user logged in (guest mode or pre-auth)
        loadLocalData();
    }
    
    // Fallback load local data anyway for workspaces (not yet in DB)
    const storedWorkspaces = localStorage.getItem('streekx_workspaces');
    if (storedWorkspaces) setWorkspaces(JSON.parse(storedWorkspaces));
  }, []);

  // --- REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
      if (!user || user.id.startsWith('local_')) return;

      // 1. Subscribe to Projects
      const projectChannel = supabase
        .channel('public:projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` }, (payload) => {
             // Reload projects when any change happens
             db.loadProjects(user.id).then(setProjects);
        })
        .subscribe();

      // 2. Subscribe to Sessions
      const sessionChannel = supabase
        .channel('public:sessions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${user.id}` }, (payload) => {
             // Reload sessions when new sessions created or updated
             db.loadSessions(user.id).then(setSessions);
        })
        .subscribe();

      return () => {
          supabase.removeChannel(projectChannel);
          supabase.removeChannel(sessionChannel);
      };
  }, [user]);


  const loadLocalData = () => {
      const storedSessions = localStorage.getItem('streekx_sessions');
      if (storedSessions) setSessions(JSON.parse(storedSessions));
      const storedProjects = localStorage.getItem('streekx_projects');
      if (storedProjects) setProjects(JSON.parse(storedProjects));
  };

  const loadCloudData = async (userId: string) => {
      try {
          const cloudProjects = await db.loadProjects(userId);
          const cloudSessions = await db.loadSessions(userId);
          
          // Even if empty, we trust cloud for logged in user (unless it's a first sync)
          setProjects(cloudProjects);
          setSessions(cloudSessions);
          
      } catch (e) {
          console.warn("Could not load cloud data, falling back to local", e);
          loadLocalData();
      }
  };

  // --- PERSISTENCE ---
  useEffect(() => {
      localStorage.setItem('streekx_auth_users', JSON.stringify(authUsers));
  }, [authUsers]);

  useEffect(() => {
    localStorage.setItem('streekx_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('streekx_projects', JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    localStorage.setItem('streekx_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  // --- ACTIONS ---

  const initWeather = () => {
    if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const w = await getWeather(pos.coords.latitude, pos.coords.longitude);
            setWeather(w);
          }, 
          (err) => console.log("Geo denied", err)
        );
    }
  };

  const handleAuthSuccess = (userData: UserProfile) => {
      const updatedList = [userData, ...authUsers.filter(u => u.streekx_id !== userData.streekx_id)];
      setAuthUsers(updatedList);
      setUser(userData);
      localStorage.setItem('streekx_active_user', JSON.stringify(userData));
      
      loadCloudData(userData.id);
      setScreen('HOME');
      initWeather();
  };

  const handleLogin = async (streekxId: string, password: string) => {
    const userData = await authService.signIn(streekxId, password);
    handleAuthSuccess(userData);
  };

  const handleSignup = async (data: any) => {
    const userData = await authService.signUp(data);
    handleAuthSuccess(userData);
  };

  const handleSignOut = async () => {
    if (!user) return;
    await authService.signOut();
    const updatedList = authUsers.filter(u => u.streekx_id !== user.streekx_id);
    setAuthUsers(updatedList);
    
    if (updatedList.length > 0) {
        const nextUser = updatedList[0];
        setUser(nextUser);
        localStorage.setItem('streekx_active_user', JSON.stringify(nextUser));
        loadCloudData(nextUser.id);
        setScreen('HOME'); 
    } else {
        setUser(null);
        localStorage.removeItem('streekx_active_user');
        setSessions([]); 
        setProjects([]);
        setScreen('INTRO');
    }
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('streekx_active_user', JSON.stringify(updatedUser));
    setAuthUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    // Also update storage for this specific guest user if it exists
    if (updatedUser.id.startsWith('local_')) {
       localStorage.setItem('streekx_user', JSON.stringify(updatedUser));
    }
  };

  const handleSwitchAccount = (targetUser: UserProfile) => {
      setUser(targetUser);
      localStorage.setItem('streekx_active_user', JSON.stringify(targetUser));
      initWeather();
      loadCloudData(targetUser.id);
  };

  const handleAddAccount = () => {
      setScreen('AUTH');
  };

  const handleSkipAuth = () => {
    setScreen('HOME');
    initWeather();
  };

  // --- DATA OPERATIONS (Wrapped to Sync with DB) ---
  const startSearch = (
      query: string, 
      attachments: Attachment[] = [], 
      mode: SearchMode = 'Standard', 
      isIncognito: boolean = false, 
      sourceFlags?: SourceFlags,
      projectContextId?: string
  ) => {
    const newId = crypto.randomUUID();
    const newSession: SearchSession = {
      id: newId,
      query,
      timestamp: Date.now(),
      messages: [{ 
          role: 'user', 
          content: query, 
          timestamp: Date.now(),
          attachments: attachments
      }],
      projectId: projectContextId || activeProjectId || undefined,
      mode: mode,
      sourceFlags: sourceFlags
    };
    
    if (!isIncognito) {
        // Optimistic Update
        setSessions(prev => [newSession, ...prev]);
        if (user) db.saveSession(newSession, user.id); // SYNC
    }

    setCurrentSessionId(newId);
    setInitialQuery(query);
    setInitialAttachments(attachments);
    setInitialMode(mode);
    setInitialSourceFlags(sourceFlags);

    setScreen('SEARCH');
  };

  const updateSessionMessages = (sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => {
        // Don't save if it's an incognito session (not in list)
        const exists = prev.find(s => s.id === sessionId);
        if (!exists) return prev;

        const updated = prev.map(s => s.id === sessionId ? { ...s, messages } : s);
        const sess = updated.find(s => s.id === sessionId);
        if (user && sess) db.saveSession(sess, user.id); // SYNC
        return updated;
    });
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (user) db.deleteSession(sessionId); // SYNC
  };

  const clearHistory = async () => {
      if (window.confirm("Are you sure you want to clear all history? This cannot be undone.")) {
          setSessions([]); // Clear Local State IMMEDIATELY
          if (user) {
              await db.clearAllSessions(user.id); // Clear DB in background
          }
      }
  };

  // --- NEW: MOVE SESSION TO PROJECT ---
  const handleMoveSessionToProject = (sessionId: string, projectId: string) => {
      setSessions(prev => {
          const updated = prev.map(s => s.id === sessionId ? { ...s, projectId } : s);
          const sess = updated.find(s => s.id === sessionId);
          if (user && sess) {
              // Save with new Project ID to Supabase
              db.saveSession(sess, user.id);
          }
          return updated;
      });
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    if (user) db.saveProject(project, user.id); // SYNC
  };

  const updateProject = (project: Project) => {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      if (user) db.saveProject(project, user.id); // SYNC
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (user) db.deleteProject(id); // SYNC
  };

  const addWorkspace = (ws: Workspace) => {
    setWorkspaces(prev => [...prev, ws]);
  };

  const setActiveWorkspace = (id: string) => {
    setWorkspaces(prev => prev.map(w => ({ ...w, is_active: w.id === id })));
  };

  // --- RENDER ROUTER ---
  const renderScreen = () => {
    switch (screen) {
      case 'INTRO': return <Intro onAuth={() => setScreen('AUTH')} onSkip={handleSkipAuth} />;
      case 'AUTH': return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
      case 'HOME':
        return (
          <Home 
            user={user} 
            weather={weather} 
            onSearch={(q, att, mode, incognito, sources) => { 
                setActiveProjectId(null); 
                startSearch(q, att, mode, incognito, sources); 
            }}
            onOpenProfile={() => setScreen('PROFILE')}
            searchHistory={sessions.map(s => s.query)}
            onNavigate={(s) => {
                 if (s === 'ASSISTANT') setShowAssistant(true);
                 else setScreen(s);
            }}
          />
        );
      case 'SEARCH':
        return (
          <SearchInterface 
            sessionId={currentSessionId!}
            initialSessions={sessions}
            onBack={() => activeProjectId ? setScreen('PROJECT_DETAIL') : setScreen('HOME')}
            onUpdateMessages={updateSessionMessages}
            initialQuery={initialQuery}
            initialAttachments={initialAttachments}
            initialMode={initialMode}
            initialSourceFlags={initialSourceFlags}
            activeProject={projects.find(p => p.id === activeProjectId)}
            onOpenAssistant={() => setShowAssistant(true)}
          />
        );
      case 'PROFILE':
        return (
          <Profile 
            user={user} 
            otherAccounts={authUsers.filter(u => u.streekx_id !== user?.streekx_id)}
            onSwitchAccount={handleSwitchAccount}
            onAddAccount={handleAddAccount} 
            sessions={sessions}
            onClose={() => setScreen('HOME')}
            onSignOut={handleSignOut}
            onOpenSession={(id) => { setCurrentSessionId(id); setInitialQuery(''); setActiveProjectId(null); setScreen('SEARCH'); }}
            onDeleteSession={deleteSession}
            onNavigate={(s) => setScreen(s)}
          />
        );
      case 'EDIT_PROFILE':
        return <Settings user={user} onBack={() => setScreen('PROFILE')} onLogout={handleSignOut} onClearHistory={clearHistory} onUpdateUser={handleUpdateUser} />;
      case 'SETTINGS':
        return (
            <Settings 
                user={user} 
                onBack={() => setScreen('PROFILE')} 
                onLogout={handleSignOut} 
                onClearHistory={clearHistory}
                onUpdateUser={handleUpdateUser} 
            />
        );
      case 'ACCOUNT':
        return <ManageAccount user={user} onUpdate={handleUpdateUser} onBack={() => setScreen('PROFILE')} onLogout={handleSignOut} />;
      case 'PROJECTS':
        return (
            <Projects 
                projects={projects} 
                onAdd={addProject} 
                onDelete={deleteProject} 
                onBack={() => setScreen('PROFILE')} 
                onOpenProject={(p) => { setActiveProjectId(p.id); setScreen('PROJECT_DETAIL'); }} 
            />
        );
      case 'PROJECT_DETAIL': {
          const project = projects.find(p => p.id === activeProjectId);
          if (!project) return (
             <Projects 
                projects={projects} 
                onAdd={addProject} 
                onDelete={deleteProject} 
                onBack={() => setScreen('PROFILE')} 
                onOpenProject={(p) => setActiveProjectId(p.id)} 
             />
          );
          return (
             <Projects 
                projects={projects}
                onAdd={addProject}
                onDelete={deleteProject}
                onBack={() => { setActiveProjectId(null); setScreen('PROJECTS'); }}
                onOpenProject={() => {}}
                activeProject={project}
                sessions={sessions.filter(s => s.projectId === project.id)}
                onNewThread={() => { 
                    setInitialQuery(''); 
                    setCurrentSessionId(null); 
                    setActiveProjectId(project.id); 
                    startSearch('', [], 'Standard', false, undefined, project.id); 
                }}
                onOpenSession={(id) => { setCurrentSessionId(id); setInitialQuery(''); setScreen('SEARCH'); }}
                onUpdateProject={updateProject}
             />
          );
      }
      case 'WORKSPACE':
        return <WorkspaceManager workspaces={workspaces} onAdd={addWorkspace} onSetActive={setActiveWorkspace} onBack={() => setScreen('PROFILE')} />;
      case 'FEEDBACK':
        return <FeedbackScreen onBack={() => setScreen('PROFILE')} />;
      case 'DISCOVERY':
        return <DiscoveryScreen onBack={() => setScreen('HOME')} onSearch={(q) => startSearch(q)} />;
      case 'HISTORY':
        return (
            <History 
                sessions={sessions} 
                projects={projects}
                workspaces={workspaces}
                onOpenSession={(id) => { setCurrentSessionId(id); setInitialQuery(''); setScreen('SEARCH'); }} 
                onDeleteSession={deleteSession} 
                onAddToProject={handleMoveSessionToProject}
                onClearAll={clearHistory} 
                onBack={() => setScreen('PROFILE')} 
                onNavigateToProjects={() => setScreen('PROJECTS')}
            />
        );
      case 'NOTIFICATIONS':
        return <Notifications onBack={() => setScreen('HOME')} />;
      default:
        return <Intro onAuth={() => setScreen('AUTH')} onSkip={handleSkipAuth} />;
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden font-sans relative transition-colors duration-200">
      {renderScreen()}
      {showAssistant && <StreekxAssistant onClose={() => setShowAssistant(false)} />}
    </div>
  );
};

export default App;
