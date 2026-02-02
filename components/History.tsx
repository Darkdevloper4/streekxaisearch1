
import React, { useState } from 'react';
import { SearchSession, Project, Workspace } from '../types';

interface HistoryProps {
    sessions: SearchSession[];
    projects: Project[];
    workspaces: Workspace[]; // To group projects if needed, or just for context
    onOpenSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onAddToProject: (sessionId: string, projectId: string) => void;
    onClearAll: () => void;
    onBack: () => void;
    onNavigateToProjects: () => void; // Fallback if they need to create a project
}

export default function History({ 
    sessions, 
    projects, 
    workspaces,
    onOpenSession, 
    onDeleteSession, 
    onAddToProject,
    onClearAll, 
    onBack,
    onNavigateToProjects
}: HistoryProps) {
    
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [moveModalSessionId, setMoveModalSessionId] = useState<string | null>(null);

    // --- HELPER: FORMAT DATE ---
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // --- SUB-COMPONENT: PROJECT SELECTOR MODAL ---
    const ProjectSelectorModal = () => {
        if (!moveModalSessionId) return null;
        const sessionToMove = sessions.find(s => s.id === moveModalSessionId);
        if (!sessionToMove) return null;

        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setMoveModalSessionId(null)}>
                <div className="bg-[#1c1c1e] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-[#2c2c2e] overflow-hidden flex flex-col max-h-[85vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="p-6 border-b border-[#2c2c2e] flex justify-between items-center bg-[#1c1c1e]">
                        <div>
                            <h3 className="text-xl font-bold text-white">Add to Space</h3>
                            <p className="text-sm text-gray-400 truncate max-w-[250px]">
                                Moving "{sessionToMove.query}"
                            </p>
                        </div>
                        <button onClick={() => setMoveModalSessionId(null)} className="p-2 bg-[#2c2c2e] rounded-full text-gray-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {projects.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-4">📂</div>
                                <p className="text-gray-400 mb-4">You don't have any projects/spaces yet.</p>
                                <button 
                                    onClick={() => { setMoveModalSessionId(null); onNavigateToProjects(); }}
                                    className="px-6 py-3 bg-streekx-primary rounded-full text-white font-bold text-sm"
                                >
                                    Create New Space
                                </button>
                            </div>
                        ) : (
                            projects.map(project => (
                                <div 
                                    key={project.id} 
                                    onClick={() => {
                                        onAddToProject(moveModalSessionId, project.id);
                                        setMoveModalSessionId(null);
                                        setActiveMenuId(null);
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#000000] border border-[#2c2c2e] hover:border-streekx-primary cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#1c1c1e] flex items-center justify-center text-2xl border border-[#2c2c2e]">
                                        {project.emoji}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-base">{project.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{project.description || "No description"}</p>
                                    </div>
                                    {sessionToMove.projectId === project.id && (
                                        <span className="text-xs font-bold text-streekx-primary bg-streekx-primary/10 px-2 py-1 rounded">Current</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-right text-gray-200 font-sans relative" onClick={() => setActiveMenuId(null)}>
            
            {/* Modal */}
            <ProjectSelectorModal />

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20 border-b border-[#1c1c1e]">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c1c1e] rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 className="ml-3 text-[19px] font-semibold text-gray-200 tracking-tight">Library</h2>
                </div>
                {sessions.length > 0 && (
                    <button onClick={onClearAll} className="text-xs font-bold bg-[#1c1c1e] px-3 py-1.5 rounded-full border border-[#2c2c2e] hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-colors">
                        Clear All
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 no-scrollbar">
                 {sessions.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                         <div className="w-20 h-20 bg-[#1c1c1e] rounded-full flex items-center justify-center mb-6 border border-[#2c2c2e]">
                             <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         </div>
                         <p className="font-bold text-lg text-gray-400">No search history</p>
                         <p className="text-sm">Threads you create will appear here.</p>
                     </div>
                 )}

                 {sessions.map(s => {
                     // Content Preview Logic
                     const aiMsg = s.messages?.find(m => m.role === 'model');
                     const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
                     
                     let preview = "Start the conversation...";
                     if (aiMsg?.content) {
                         preview = aiMsg.content.substring(0, 140).replace(/[*#_`\[\]]/g, '') + (aiMsg.content.length > 140 ? '...' : '');
                     } else if (lastMsg?.content) {
                         preview = lastMsg.content.substring(0, 140) + "...";
                     }

                     const project = projects.find(p => p.id === s.projectId);

                     return (
                        <div key={s.id} onClick={() => onOpenSession(s.id)} className="group bg-[#1c1c1e] p-5 rounded-[24px] border border-[#2c2c2e] active:scale-[0.99] transition-all cursor-pointer relative shadow-lg hover:border-gray-600">
                             
                             {/* Header */}
                             <div className="flex items-start justify-between mb-3 relative z-10">
                                 <div className="flex items-center gap-3 min-w-0 pr-8">
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-[#2c2c2e] flex items-center justify-center text-lg shadow-inner flex-shrink-0">
                                         {project ? project.emoji : '🔍'}
                                     </div>
                                     <div className="min-w-0">
                                         <h4 className="font-bold text-white text-[17px] leading-tight truncate">{s.query}</h4>
                                         <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                                             <span>{formatDate(s.timestamp)}</span>
                                             <span>•</span>
                                             <span>{s.messages?.length || 0} msgs</span>
                                             {project && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-streekx-primary truncate max-w-[100px]">{project.title}</span>
                                                </>
                                             )}
                                         </div>
                                     </div>
                                 </div>

                                 {/* 3-Dot Menu Trigger */}
                                 <button 
                                     onClick={(e) => { 
                                         e.stopPropagation(); 
                                         setActiveMenuId(activeMenuId === s.id ? null : s.id); 
                                     }} 
                                     className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-[#2c2c2e] transition-colors"
                                 >
                                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                 </button>
                             </div>
                             
                             {/* Preview Box */}
                             <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-1">
                                 <p className="text-gray-400 text-[13px] leading-relaxed line-clamp-3">
                                     {preview}
                                 </p>
                             </div>

                             {/* Popover Menu */}
                             {activeMenuId === s.id && (
                                 <div className="absolute top-14 right-4 z-30 bg-[#2c2c2e] rounded-xl shadow-2xl border border-gray-600 animate-fade-in w-48 overflow-hidden flex flex-col py-1">
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMoveModalSessionId(s.id);
                                            setActiveMenuId(null);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-streekx-primary transition-colors text-left"
                                     >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                                         Add to Space
                                     </button>
                                     <div className="h-px bg-gray-600 mx-2"></div>
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(s.id);
                                            setActiveMenuId(null);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-900/30 transition-colors text-left"
                                     >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                         Delete Thread
                                     </button>
                                 </div>
                             )}
                        </div>
                     );
                 })}
            </div>
        </div>
    );
}
