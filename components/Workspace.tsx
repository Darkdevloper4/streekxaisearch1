
import React, { useState } from 'react';
import { Workspace } from '../types';

// --- HELPER ---
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(!enabled); }} 
        className={`w-[44px] h-[24px] rounded-full p-1 transition-all duration-300 relative ${enabled ? 'bg-streekx-primary' : 'bg-[#3a3a3c]'}`}
    >
        <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
    </button>
);

interface WorkspaceProps {
    workspaces: Workspace[];
    onAdd: (w: Workspace) => void;
    onSetActive: (id: string) => void;
    onBack: () => void;
}

export default function WorkspaceManager({ workspaces, onAdd, onSetActive, onBack }: WorkspaceProps) {
    const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
    const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
    
    const activeDetailWs = workspaces.find(w => w.id === activeDetailId);

    // Create Form State
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('🏢');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<'Personal' | 'Team' | 'Education'>('Personal');

    const handleCreate = () => {
        if (!name) return;
        const newWs: Workspace = {
            id: crypto.randomUUID(),
            name,
            emoji,
            description: desc,
            type,
            is_active: false
        };
        onAdd(newWs);
        setView('LIST');
        setName('');
        setDesc('');
        setEmoji('🏢');
    };

    if (view === 'CREATE') {
        return (
            <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans">
                 <div className="flex items-center justify-between px-4 py-4 border-b border-[#1c1c1e] bg-[#000000]">
                    <button onClick={() => setView('LIST')} className="text-gray-400 font-bold text-sm hover:text-white">Cancel</button>
                    <h2 className="font-bold text-white">New Workspace</h2>
                    <button onClick={handleCreate} disabled={!name} className={`text-streekx-primary font-bold text-sm ${!name ? 'opacity-50' : ''}`}>Create</button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                         <div className="w-24 h-24 bg-[#1c1c1e] rounded-full flex items-center justify-center text-5xl mb-4 border border-[#2c2c2e]">
                             {emoji}
                         </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Workspace Name</label>
                         <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" className="w-full p-4 bg-[#1c1c1e] text-white rounded-xl outline-none focus:ring-1 focus:ring-streekx-primary transition-all font-bold text-lg border border-[#2c2c2e]" />
                    </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                         <div className="flex gap-2 mt-2">
                             {['Personal', 'Team', 'Education'].map((t: any) => (
                                 <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-lg text-sm font-bold border transition-all ${type === t ? 'bg-streekx-primary text-white border-streekx-primary' : 'bg-[#1c1c1e] text-gray-400 border-[#2c2c2e]'}`}>
                                     {t}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'DETAIL' && activeDetailWs) {
        return <WorkspaceDetail workspace={activeDetailWs} onBack={() => setView('LIST')} />;
    }

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200 font-sans">
            <div className="flex items-center justify-between px-4 py-4 bg-[#000000] sticky top-0 z-20 border-b border-[#1c1c1e]">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c1c1e] rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 className="ml-3 text-[19px] font-semibold text-gray-200 tracking-tight">Workspaces</h2>
                </div>
                <button onClick={() => setView('CREATE')} className="text-streekx-primary text-3xl font-bold leading-none pr-2 hover:text-white transition-colors">+</button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    {workspaces.map(w => (
                        <div key={w.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${w.is_active ? 'border-streekx-primary bg-streekx-primary/10' : 'border-[#2c2c2e] bg-[#1c1c1e]'}`}>
                            <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onSetActive(w.id)}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold bg-[#000000] border border-[#2c2c2e]`}>
                                    {w.emoji || w.name[0]}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${w.is_active ? 'text-streekx-primary' : 'text-gray-200'}`}>{w.name}</h3>
                                    <p className="text-xs text-gray-500">{w.type} • {w.is_active ? 'Active' : 'Switch'}</p>
                                </div>
                            </div>
                            <button onClick={() => { setActiveDetailId(w.id); setView('DETAIL'); }} className="p-2 text-gray-500 hover:text-white bg-[#000000] rounded-lg border border-[#2c2c2e]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: DETAIL (TEAM MANAGEMENT) ---
const WorkspaceDetail = ({ workspace, onBack }: { workspace: Workspace, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'MEMBERS' | 'SETTINGS'>('MEMBERS');
    const [inviteId, setInviteId] = useState('');
    const [inviteStatus, setInviteStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
    const [members, setMembers] = useState([
        { id: '1', streekx_id: 'you', role: 'Owner', status: 'Active' },
        { id: '2', streekx_id: 'alex_tech', role: 'Member', status: 'Active' }
    ]);

    const handleInvite = () => {
        if (!inviteId) return;
        setInviteStatus('SENDING');
        setTimeout(() => {
            setMembers(prev => [...prev, { id: crypto.randomUUID(), streekx_id: inviteId, role: 'Member', status: 'Pending' }]);
            setInviteStatus('SENT');
            setInviteId('');
            setTimeout(() => setInviteStatus('IDLE'), 3000);
        }, 1500);
    };

    // NATIVE SHARE WORKSPACE
    const handleShareWorkspace = async () => {
        const shareData = {
            title: `Workspace: ${workspace.name}`,
            text: `Join the ${workspace.name} workspace on StreekX.`,
            url: window.location.href
        };
        if (navigator.share && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); } catch (e) { console.log("Share dismissed"); }
        } else {
            alert("Share not supported on this device");
        }
    };

    return (
        <div className="h-full bg-[#000000] flex flex-col animate-slide-up text-gray-200">
             <div className="flex items-center justify-between px-4 py-4 border-b border-[#1c1c1e] bg-[#000000]">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div className="ml-3 flex items-center gap-2">
                        <span className="text-xl">{workspace.emoji}</span>
                        <h2 className="font-bold text-white text-lg">{workspace.name}</h2>
                    </div>
                </div>
                <button onClick={handleShareWorkspace} className="p-2 text-streekx-primary hover:text-white bg-[#1c1c1e] rounded-full">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </button>
            </div>

            <div className="flex border-b border-[#1c1c1e]">
                <button onClick={() => setActiveTab('MEMBERS')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MEMBERS' ? 'border-streekx-primary text-white' : 'border-transparent text-gray-500'}`}>Members</button>
                <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SETTINGS' ? 'border-streekx-primary text-white' : 'border-transparent text-gray-500'}`}>Settings</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'MEMBERS' && (
                    <div className="space-y-6">
                        <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e]">
                            <h3 className="font-bold text-gray-300 text-sm mb-3">Invite Team Member</h3>
                            <div className="flex gap-2">
                                <input 
                                    value={inviteId}
                                    onChange={e => setInviteId(e.target.value)}
                                    placeholder="Enter StreekX ID" 
                                    className="flex-1 bg-[#000000] rounded-xl px-4 py-3 text-sm outline-none border border-[#2c2c2e] focus:border-streekx-primary transition-colors text-white"
                                />
                                <button 
                                    onClick={handleInvite}
                                    disabled={inviteStatus !== 'IDLE' || !inviteId}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold text-black transition-all ${inviteStatus === 'SENT' ? 'bg-green-500' : 'bg-white hover:bg-gray-200'}`}
                                >
                                    {inviteStatus === 'IDLE' ? 'Invite' : (inviteStatus === 'SENDING' ? '...' : 'Sent!')}
                                </button>
                            </div>
                        </div>

                        <div>
                             <h3 className="font-bold text-gray-500 text-xs uppercase mb-3">Team List</h3>
                             <div className="space-y-2">
                                 {members.map(m => (
                                     <div key={m.id} className="flex items-center justify-between p-3 bg-[#1c1c1e] rounded-xl border border-[#2c2c2e]">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                 {m.streekx_id[0]}
                                             </div>
                                             <div>
                                                 <div className="text-sm font-bold text-gray-200">{m.streekx_id}</div>
                                                 <div className="text-[10px] text-gray-500">{m.role}</div>
                                             </div>
                                         </div>
                                         <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${m.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                             {m.status}
                                         </span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'SETTINGS' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e]">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div className="font-bold text-white text-sm">Allow Public Invites</div>
                                    <div className="text-xs text-gray-500">Anyone with link can join</div>
                                </div>
                                <ToggleSwitch enabled={true} onChange={() => {}} />
                            </div>
                            <div className="h-px bg-[#2c2c2e] my-3"></div>
                            <button className="text-red-400 text-sm font-bold w-full text-left">Leave Workspace</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
