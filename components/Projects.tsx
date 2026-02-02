
import React, { useState } from 'react';
import { Project, SearchSession } from '../types';

// --- HELPER COMPONENTS ---
const Toast = ({ message, show }: { message: string, show: boolean }) => (
    <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-2xl transition-all duration-300 z-[100] font-bold text-sm ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {message}
    </div>
);

const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(!enabled); }} 
        className={`w-[44px] h-[24px] rounded-full p-1 transition-all duration-300 relative ${enabled ? 'bg-streekx-primary' : 'bg-[#3a3a3c]'}`}
    >
        <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
    </button>
);

// --- TYPES ---
interface ProjectsProps {
    projects: Project[];
    onAdd: (p: Project) => void;
    onDelete: (id: string) => void;
    onBack: () => void;
    onOpenProject: (p: Project) => void;
    activeProject?: Project; // If a project is currently open
    sessions?: SearchSession[]; // For the detail view
    onNewThread?: () => void;
    onOpenSession?: (id: string) => void;
    // We add an updater for edits
    onUpdateProject?: (p: Project) => void; 
}

// --- MAIN COMPONENT ---
export default function Projects({ 
    projects, 
    onAdd, 
    onDelete, 
    onBack, 
    onOpenProject, 
    activeProject, 
    sessions = [], 
    onNewThread, 
    onOpenSession,
    onUpdateProject
}: ProjectsProps) {

    // If activeProject is passed, render the Detail View
    if (activeProject) {
        return (
            <ProjectDetailView 
                project={activeProject} 
                sessions={sessions} 
                onNewThread={onNewThread!} 
                onOpenSession={onOpenSession!} 
                onBack={onBack}
                onUpdate={(updated) => onUpdateProject && onUpdateProject(updated)}
                onDelete={() => { onDelete(activeProject.id); onBack(); }}
            />
        );
    }

    // Otherwise render List/Create View
    return <ProjectListView projects={projects} onAdd={onAdd} onBack={onBack} onOpenProject={onOpenProject} />;
}

// --- SUB-COMPONENT: LIST VIEW ---
const ProjectListView = ({ projects, onAdd, onBack, onOpenProject }: { projects: Project[], onAdd: (p: Project) => void, onBack: () => void, onOpenProject: (p: Project) => void }) => {
    const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
    
    // Create Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [emoji, setEmoji] = useState('📂');
    const [aiPrompt, setAiPrompt] = useState('');
    const [visibility, setVisibility] = useState<'Public' | 'Private'>('Private');

    const handleCreate = () => {
        if (!title) return;
        const newProject: Project = {
            id: crypto.randomUUID(),
            title,
            description: desc,
            emoji,
            ai_prompt: aiPrompt,
            visibility,
            created_at: Date.now(),
            updated_at: Date.now()
        };
        onAdd(newProject);
        setView('LIST');
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setDesc('');
        setEmoji('📂');
        setAiPrompt('');
        setVisibility('Private');
    };

    const handleShareProject = async (e: React.MouseEvent, p: Project) => {
        e.stopPropagation();
        const shareData = {
            title: p.title,
            text: p.description || `Check out ${p.title} on StreekX`,
            url: window.location.href // Simplified
        };
        if (navigator.share && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); } catch(err) { console.log("Share dismissed"); }
        } else {
            alert("Share not supported");
        }
    };

    const commonEmojis = ['📂', '🚀', '🎓', '🔬', '🎨', '💻', '📝', '📚', '💡', '🧠', '🌍', '💼'];

    if (view === 'CREATE') {
        return (
            <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans">
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1c1c1e] sticky top-0 bg-[#000000] z-20">
                    <button onClick={() => setView('LIST')} className="text-gray-400 font-medium text-sm hover:text-white">Cancel</button>
                    <h2 className="font-bold text-white">New Collection</h2>
                    <button onClick={handleCreate} disabled={!title} className={`text-streekx-primary font-bold text-sm ${!title ? 'opacity-50' : ''}`}>Create</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Icon Picker */}
                    <div className="flex flex-col items-center">
                         <div className="w-24 h-24 bg-[#1c1c1e] rounded-full flex items-center justify-center text-5xl mb-6 border border-[#2c2c2e] shadow-lg">
                             {emoji}
                         </div>
                         <div className="flex gap-3 overflow-x-auto w-full pb-2 px-1 justify-center no-scrollbar">
                             {commonEmojis.slice(0, 6).map(e => (
                                 <button key={e} onClick={() => setEmoji(e)} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#1c1c1e] rounded-full transition-colors">{e}</button>
                             ))}
                         </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Title</label>
                            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Name your collection" className="w-full p-4 bg-[#1c1c1e] text-white rounded-xl outline-none focus:ring-1 focus:ring-streekx-primary transition-all font-bold text-lg border border-transparent focus:border-streekx-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description</label>
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this about?" className="w-full p-4 bg-[#1c1c1e] text-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-streekx-primary h-24 resize-none transition-all border border-transparent focus:border-streekx-primary" />
                        </div>
                    </div>

                    {/* AI Prompt Configuration */}
                    <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-[#2c2c2e]">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-lg">🤖</span>
                             <label className="text-sm font-bold text-gray-300 uppercase">AI System Persona</label>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Customize how StreekX answers in this collection. Define a role, format, or strict rules.</p>
                        <textarea 
                            value={aiPrompt} 
                            onChange={e => setAiPrompt(e.target.value)} 
                            placeholder="e.g., 'You are a senior python engineer. Only provide code solutions.' or 'Summarize all news in bullet points.'" 
                            className="w-full p-3 bg-black/50 text-white rounded-lg outline-none border border-[#2c2c2e] focus:border-streekx-primary text-sm h-32 resize-none font-mono" 
                        />
                    </div>

                    {/* Visibility */}
                    <div className="bg-[#1c1c1e] p-4 rounded-xl flex items-center justify-between border border-[#2c2c2e]">
                         <div>
                             <div className="font-bold text-white text-sm flex items-center gap-2">
                                 {visibility === 'Public' ? '🌐 Public' : '🔒 Private'}
                             </div>
                             <div className="text-xs text-gray-500 mt-1">
                                 {visibility === 'Public' ? 'Anyone with the link can view' : 'Only you can access this'}
                             </div>
                         </div>
                         <ToggleSwitch enabled={visibility === 'Public'} onChange={(val) => setVisibility(val ? 'Public' : 'Private')} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans">
             <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20 border-b border-[#1c1c1e]">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c1c1e] rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 className="ml-3 text-[19px] font-semibold text-gray-200 tracking-tight">Library</h2>
                </div>
                <button onClick={() => setView('CREATE')} className="text-streekx-primary font-bold text-3xl leading-none pr-2 hover:text-white transition-colors">+</button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => onOpenProject(p)} className="bg-[#1c1c1e] p-5 rounded-2xl border border-[#2c2c2e] relative group aspect-[4/3] flex flex-col justify-between cursor-pointer hover:border-streekx-primary/50 transition-all active:scale-[0.98]">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-3xl">{p.emoji}</div>
                                    <button onClick={(e) => handleShareProject(e, p)} className="text-gray-500 hover:text-streekx-primary bg-black/40 rounded-full p-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                    </button>
                                </div>
                                <h3 className="font-bold text-white leading-tight mb-1 truncate">{p.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">{p.description || "No description"}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{p.visibility}</span>
                                <div className="flex -space-x-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-700 border border-[#1c1c1e]"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div onClick={() => setView('CREATE')} className="bg-[#1c1c1e]/50 border-2 border-dashed border-[#2c2c2e] rounded-2xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-[#1c1c1e] hover:text-gray-300 transition-all aspect-[4/3]">
                        <span className="text-3xl mb-1">+</span>
                        <span className="text-xs font-bold uppercase">New Collection</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: DETAIL VIEW ---
const ProjectDetailView = ({ 
    project, 
    sessions, 
    onNewThread, 
    onOpenSession, 
    onBack,
    onUpdate,
    onDelete
}: { 
    project: Project, 
    sessions: SearchSession[], 
    onNewThread: () => void, 
    onOpenSession: (id: string) => void, 
    onBack: () => void,
    onUpdate: (p: Project) => void,
    onDelete: () => void
}) => {
    const [toast, setToast] = useState({ show: false, msg: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(project);

    // States for functional buttons
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    const showToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 2000);
    };

    // REAL-TIME NATIVE SHARE
    const handleShare = async () => {
        const url = `https://streekx.ai/p/${project.id}`; // Hypothetical URL for demo
        const shareData = {
            title: project.title,
            text: project.description || `Check out ${project.title} on StreekX`,
            url: url
        };

        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Share sheet closed or failed
                console.log("Share cancelled");
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard');
        }
    };

    const handleSendInvite = () => {
        if(!inviteEmail) return;
        setShowInvite(false);
        showToast(`Invite sent to ${inviteEmail}`);
        setInviteEmail('');
    };

    const saveEdits = () => {
        onUpdate(editForm);
        setIsEditing(false);
        showToast('Project updated successfully');
    };

    // Edit Mode View
    if (isEditing) {
        return (
             <div className="h-full bg-[#000000] flex flex-col animate-fade-in text-gray-200">
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1c1c1e]">
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 font-bold text-sm">Cancel</button>
                    <h2 className="font-bold text-white">Edit Project</h2>
                    <button onClick={saveEdits} className="text-streekx-primary font-bold text-sm">Save</button>
                </div>
                <div className="p-6 space-y-4">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Emoji</label>
                        <input value={editForm.emoji} onChange={e => setEditForm({...editForm, emoji: e.target.value})} className="w-16 p-4 bg-[#1c1c1e] text-white rounded-xl text-center text-2xl mt-1 border border-[#2c2c2e]" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Title</label>
                        <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-4 bg-[#1c1c1e] text-white rounded-xl font-bold border border-[#2c2c2e]" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-4 bg-[#1c1c1e] text-white rounded-xl h-24 border border-[#2c2c2e]" />
                     </div>
                     <button onClick={() => { 
                         if(confirm("Are you sure you want to delete this project?")) onDelete(); 
                     }} className="w-full py-4 text-red-500 font-bold bg-[#1c1c1e] rounded-xl border border-red-900/30 mt-8">
                         Delete Project
                     </button>
                </div>
             </div>
        );
    }

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans relative">
            <Toast message={toast.msg} show={toast.show} />

            {/* Invite Modal Overlay */}
            {showInvite && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#1c1c1e] w-full max-w-sm rounded-2xl p-6 border border-[#2c2c2e] shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Invite to {project.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter an email address to collaborate.</p>
                        <input 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@streekx.ai"
                            className="w-full p-3 bg-[#000000] border border-[#2c2c2e] rounded-xl text-white outline-none focus:border-streekx-primary mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowInvite(false)} className="flex-1 py-3 bg-[#2c2c2e] rounded-xl font-bold text-gray-400">Cancel</button>
                            <button onClick={handleSendInvite} className="flex-1 py-3 bg-streekx-primary rounded-xl font-bold text-white">Send</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="flex items-center gap-2">
                     <button onClick={handleShare} className="p-2 text-streekx-primary hover:text-white transition-colors bg-[#1c1c1e] rounded-full" title="Share">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                     </button>
                     <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white transition-colors bg-[#1c1c1e] rounded-full" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                     </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
                 {/* Project Info Card */}
                 <div className="bg-[#1c1c1e] p-6 rounded-3xl border border-[#2c2c2e] mb-8 text-center relative overflow-hidden shadow-lg">
                     {/* Background decorative glow */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-streekx-primary to-transparent opacity-50"></div>
                     
                     <div className="text-5xl mb-4 animate-bounce hover:scale-110 transition-transform cursor-pointer select-none">{project.emoji}</div>
                     <h1 className="text-2xl font-bold text-white mb-2">{project.title}</h1>
                     <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto mb-4">{project.description || "A collection of knowledge."}</p>
                     
                     <div className="flex justify-center items-center gap-3">
                         <div className="flex -space-x-2">
                             <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#1c1c1e] flex items-center justify-center text-[10px] font-bold text-white">ME</div>
                             <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#1c1c1e] flex items-center justify-center text-[10px] font-bold text-white">+0</div>
                         </div>
                         <button onClick={() => setShowInvite(true)} className="px-4 py-1.5 bg-[#2c2c2e] rounded-full text-xs font-bold hover:bg-[#3a3a3c] transition-colors border border-gray-700 text-gray-200">
                             Invite
                         </button>
                     </div>

                     {project.ai_prompt && (
                         <div className="mt-6 bg-black/40 rounded-xl p-3 border border-streekx-primary/30 text-left flex items-start gap-3">
                             <span className="text-lg">✨</span>
                             <div>
                                 <div className="text-[10px] font-bold text-streekx-primary uppercase">Custom AI Model</div>
                                 <p className="text-xs text-gray-400 line-clamp-2 italic">"{project.ai_prompt}"</p>
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Threads List */}
                 <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Project Threads</h3>
                </div>

                <div className="space-y-3">
                    <div onClick={onNewThread} className="p-4 bg-streekx-primary/10 rounded-xl border border-streekx-primary/30 text-streekx-primary font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-streekx-primary/20 transition-all active:scale-[0.98]">
                        <span className="text-xl leading-none">+</span> New Thread
                    </div>

                    {sessions.map(s => (
                        <div key={s.id} onClick={() => onOpenSession(s.id)} className="p-4 bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] hover:border-gray-600 transition-all cursor-pointer group active:scale-[0.98]">
                            <h4 className="font-bold text-gray-200 text-sm truncate group-hover:text-white">{s.query}</h4>
                            <div className="flex justify-between mt-2">
                                <p className="text-[10px] text-gray-500">{new Date(s.timestamp).toLocaleDateString()}</p>
                                <span className="text-[10px] text-gray-600 group-hover:text-streekx-primary">View &rarr;</span>
                            </div>
                        </div>
                    ))}
                    
                    {sessions.length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-sm">
                            No threads yet. Start searching!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
