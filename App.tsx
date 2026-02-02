
import React, { useState, useEffect } from 'react';
import { AppState, Screen, UserProfile, WeatherData, ChatMessage, SearchSession, Project, Workspace, Attachment } from './types';
import { supabase, authService, db } from './services/supabase';
import { getWeather } from './services/weather';
import Home from './components/Home';
import Auth from './components/Auth';
import Intro from './components/Intro';
import Permissions from './components/Permissions';
import Profile from './components/Profile';
import SearchInterface from './components/SearchInterface';
import ManageAccount from './components/ManageAccount'; 
import Notifications from './components/Notifications';
import Projects from './components/Projects';
import WorkspaceManager from './components/Workspace';
import StreekxAssistant from './components/StreekxAssistant'; 
import Settings from './components/Settings';
import { FeedbackScreen, DiscoveryScreen, HistoryScreen, EditProfileScreen } from './components/FeatureScreens';

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

  const loadLocalData = () => {
      const storedSessions = localStorage.getItem('streekx_sessions');
      if (storedSessions) setSessions(JSON.parse(storedSessions));
      const storedProjects = localStorage.getItem('streekx_projects');
      if (storedProjects) setProjects(JSON.parse(storedProjects));
  };

  const loadCloudData = async (userId: string) => {
      // Try to load from Supabase
      try {
          const cloudProjects = await db.loadProjects(userId);
          const cloudSessions = await db.loadSessions(userId);
          
          if (cloudProjects.length > 0 || cloudSessions.length > 0) {
              setProjects(cloudProjects);
              setSessions(cloudSessions);
          } else {
              // If cloud empty, fall back to local (migration scenario)
              loadLocalData();
          }
      } catch (e) {
          console.warn("Could not load cloud data, falling back to local", e);
          loadLocalData();
      }
  };

  // --- PERSISTENCE ---
  // We now save to BOTH LocalStorage (cache) and Supabase (cloud)
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
      setScreen('PERMISSIONS');
  };

  const handleLogin = async (streekxId: string, password: string) => {
    // We let errors bubble up to the Auth component so they can be displayed in the UI
    const userData = await authService.signIn(streekxId, password);
    handleAuthSuccess(userData);
  };

  const handleSignup = async (data: any) => {
    // We let errors bubble up to the Auth component
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
        setSessions([]); // Clear data from view on logout
        setProjects([]);
        setScreen('INTRO');
    }
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('streekx_active_user', JSON.stringify(updatedUser));
    setAuthUsers(prev => prev.map(u => u.streekx_id === updatedUser.streekx_id ? updatedUser : u));
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
    setScreen('PERMISSIONS');
  };

  const handlePermissionsGranted = () => {
      initWeather();
      setScreen('HOME');
  };

  // --- DATA OPERATIONS (Wrapped to Sync with DB) ---
  const startSearch = (query: string, attachments?: Attachment[], projectContextId?: string) => {
    const newId = crypto.randomUUID();
    const newSession: SearchSession = {
      id: newId,
      query,
      timestamp: Date.now(),
      messages: [{ 
          role: 'user', 
          content: query, 
          timestamp: Date.now(),
          attachments: attachments || [] 
      }],
      projectId: projectContextId || activeProjectId || undefined 
    };
    
    setSessions(prev => [newSession, ...prev]);
    if (user) db.saveSession(newSession, user.id); // SYNC

    setCurrentSessionId(newId);
    setInitialQuery(query);
    setScreen('SEARCH');
  };

  const updateSessionMessages = (sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => {
        const updated = prev.map(s => s.id === sessionId ? { ...s, messages } : s);
        // Find the specific session to sync
        const sess = updated.find(s => s.id === sessionId);
        if (user && sess) db.saveSession(sess, user.id); // SYNC
        return updated;
    });
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (user) db.deleteSession(sessionId); // SYNC
  };

  const clearHistory = () => {
      if (window.confirm("Are you sure you want to clear all history? This cannot be undone.")) {
          setSessions([]);
          // Note: Bulk delete not implemented in db helper for safety, 
          // but we can just clear local and let the user delete manually or add bulk endpoint.
          // For now, this clears UI state.
      }
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
      case 'PERMISSIONS': return <Permissions onGrant={handlePermissionsGranted} />;
      case 'HOME':
        return (
          <Home 
            user={user} 
            weather={weather} 
            onSearch={(q, att) => { setActiveProjectId(null); startSearch(q, att); }}
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
            activeProject={projects.find(p => p.id === activeProjectId)}
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
                onNewThread={() => { setInitialQuery(''); setCurrentSessionId(null); setActiveProjectId(project.id); startSearch('', [], project.id); }}
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
        return <HistoryScreen sessions={sessions} onOpenSession={(id) => { setCurrentSessionId(id); setInitialQuery(''); setScreen('SEARCH'); }} onDeleteSession={deleteSession} onClearAll={clearHistory} onBack={() => setScreen('PROFILE')} />;
      case 'NOTIFICATIONS':
        return <Notifications onBack={() => setScreen('HOME')} />;
      default:
        return <Intro onAuth={() => setScreen('AUTH')} onSkip={handleSkipAuth} />;
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans relative">
      {renderScreen()}
      {showAssistant && <StreekxAssistant onClose={() => setShowAssistant(false)} />}
    </div>
  );
};

export default App;
