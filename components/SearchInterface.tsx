
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, SearchSession, Attachment, Project, SearchResult, SearchMode, SourceFlags } from '../types';
import { generateSmartResponse } from '../services/gemini';

interface SearchProps {
  sessionId: string;
  initialSessions: SearchSession[];
  onBack: () => void;
  onUpdateMessages: (id: string, msgs: ChatMessage[]) => void;
  initialQuery: string;
  initialAttachments?: Attachment[];
  initialMode?: SearchMode;
  initialSourceFlags?: SourceFlags;
  activeProject?: Project; 
  onOpenAssistant: () => void;
}

const ToggleSwitch = ({ checked, onChange, colorClass }: { checked: boolean, onChange: (v: boolean) => void, colorClass?: string }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className={`w-[44px] h-[24px] rounded-full p-1 transition-all duration-300 relative cursor-pointer ${checked ? (colorClass || 'bg-streekx-primary') : 'bg-gray-300 dark:bg-[#3a3a3c]'}`}>
        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
    </div>
);

export default function SearchInterface({ 
    sessionId, 
    initialSessions, 
    onBack, 
    onUpdateMessages, 
    initialQuery, 
    initialAttachments = [],
    initialMode = 'Standard',
    initialSourceFlags,
    activeProject, 
    onOpenAssistant 
}: SearchProps) {
  
  const session = initialSessions.find(s => s.id === sessionId);
  
  // Initialize state with props
  const [messages, setMessages] = useState<ChatMessage[]>(session ? session.messages : []);
  const [input, setInput] = useState('');
  
  // State for UX
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(''); // "Searching...", "Reading..."
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [expandedSourceMsgId, setExpandedSourceMsgId] = useState<number | null>(null);

  // Search Context State
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [sourceFlags, setSourceFlags] = useState<SourceFlags>(initialSourceFlags || {
      web: true,
      academic: false,
      finance: false,
      social: false
  });
  
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasExecutedInitial = useRef(false);
  
  // Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        // Smooth scroll to bottom only if we are close to bottom or it's a new message
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, currentStatus]);

  // Handle Initial Query Execution
  useEffect(() => {
    if (initialQuery && !hasExecutedInitial.current) {
        // Check if messages already have content (from session restore) or if this is fresh
        if (messages.length === 1 && messages[0].role === 'user') {
            hasExecutedInitial.current = true;
            // Execute using initial params
            executeSearch(initialQuery, initialAttachments);
        }
    }
  }, [initialQuery]);

  const executeSearch = async (queryText: string, currentAttachments: Attachment[] = []) => {
    setIsStreaming(true);
    setCurrentStatus("Initializing...");

    // Create a placeholder AI message
    const aiMsgId = Date.now();
    const aiMsg: ChatMessage = { 
        role: 'model', 
        content: '', 
        timestamp: aiMsgId,
        sources: [] 
    };
    
    setMessages(prev => {
        const next = [...prev, aiMsg];
        onUpdateMessages(sessionId, next);
        return next;
    });

    let accumulatedText = "";

    try {
        await generateSmartResponse(
            queryText, 
            messages.slice(0, -1), // Don't include the empty AI msg in history yet
            (status) => setCurrentStatus(status),
            (sources) => {
                // Update the message with sources immediately when found
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'model') {
                        lastMsg.sources = sources;
                    }
                    return newMsgs;
                });
            },
            (chunk) => {
                accumulatedText = chunk;
                // Real-time text update
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === 'model') {
                        lastMsg.content = accumulatedText;
                    }
                    return newMsgs;
                });
            },
            activeProject?.ai_prompt,
            searchMode, // Use current search mode (allows switching mid-thread)
            sourceFlags, // Use current source flags
            currentAttachments // Pass images if any
        );
    } catch (e) {
        console.error("Search failed", e);
    } finally {
        setIsStreaming(false);
        setCurrentStatus(""); // Clear status
        
        // Final save to persist
        setMessages(prev => {
             const next = [...prev];
             onUpdateMessages(sessionId, next);
             return next;
        });
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    const userMsg: ChatMessage = { 
        role: 'user', 
        content: input, 
        timestamp: Date.now(),
        attachments: attachments
    };

    setMessages(prev => {
        const next = [...prev, userMsg];
        onUpdateMessages(sessionId, next);
        return next;
    });

    const txt = input;
    const atts = [...attachments];
    setInput('');
    setAttachments([]);
    executeSearch(txt, atts);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const newAtt: Attachment = {
                    id: crypto.randomUUID(),
                    type: file.type.startsWith('image') ? 'image' : 'file',
                    url: ev.target.result as string,
                    name: file.name
                };
                setAttachments(prev => [...prev, newAtt]);
                setShowSources(false); // Close modal if open
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    }
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  // --- RENDERERS ---

  // Renders the [1] citations as clickable links
  const renderMarkdownWithCitations = (text: string, sources: SearchResult[] = []) => {
      if (!text) return null;
      const parts = text.split(/(\[\d+\])/g);
      return parts.map((part, i) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
              const index = parseInt(match[1]) - 1;
              const source = sources[index];
              if (source) {
                  return (
                      <a 
                        key={i} 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-5 h-5 ml-0.5 text-[10px] font-bold text-streekx-primary bg-streekx-primary/10 rounded-full hover:bg-streekx-primary hover:text-white transition-colors align-top transform -translate-y-1 no-underline"
                        title={source.title}
                      >
                          {match[1]}
                      </a>
                  );
              }
          }
          return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />;
      });
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white font-sans animate-fade-in relative" onClick={() => { setShowModeSelector(false); }}>
        
        {/* SOURCES MODAL (Perplexity Style) */}
        {showSources && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-fade-in" onClick={() => setShowSources(false)}>
                <div className="w-full bg-[#1c1c1e] rounded-t-[2rem] border-t border-[#2c2c2e] overflow-hidden animate-slide-up p-6 pb-12 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Handle */}
                    <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6 opacity-40"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-6">Add sources</h2>

                    {/* Media Buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <button onClick={() => mediaInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span className="text-[13px] font-bold text-gray-300">Photos</span>
                        </button>
                        <button onClick={() => cameraInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="text-[13px] font-bold text-gray-300">Camera</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl bg-[#2c2c2e] flex flex-col items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors border border-transparent hover:border-gray-500 active:scale-95">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span className="text-[13px] font-bold text-gray-300">File</span>
                        </button>
                    </div>

                    {/* Toggles List */}
                    <div className="space-y-1">
                        {[
                            { id: 'web', label: 'Web', sub: 'Search across the entire Internet', icon: '🌐' },
                            { id: 'academic', label: 'Academic', sub: 'Search academic papers', icon: '🎓' },
                            { id: 'finance', label: 'Finance', sub: 'Search SEC filings', icon: '💰' },
                            { id: 'social', label: 'Social', sub: 'Discussions and opinions', icon: '💬' }
                        ].map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#2c2c2e] cursor-pointer" onClick={() => setSourceFlags(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl opacity-80">{item.icon}</span>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-white">{item.label}</h3>
                                        <p className="text-[13px] text-gray-400">{item.sub}</p>
                                    </div>
                                </div>
                                <ToggleSwitch colorClass="bg-[#00c2cb]" checked={sourceFlags[item.id as keyof typeof sourceFlags]} onChange={() => setSourceFlags(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-20 bg-[#000000]/90 backdrop-blur-md border-b border-[#1c1c1e]">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="flex flex-col items-center">
                 <span className="font-bold text-sm tracking-widest text-streekx-primary uppercase opacity-80">StreekX AI</span>
                 <span className="text-[10px] text-gray-500 font-bold">{searchMode} Mode</span>
            </div>
            <div className="w-10"></div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 no-scrollbar" ref={scrollRef}>
             
             {/* Project Context Badge */}
             {activeProject && messages.length <= 2 && (
                 <div className="flex justify-center mb-6">
                     <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-full px-4 py-1.5 text-xs font-bold text-gray-400 flex items-center gap-2">
                         <span>{activeProject.emoji}</span>
                         <span>Using context: {activeProject.title}</span>
                     </div>
                 </div>
             )}

             {messages.map((msg, idx) => (
                 <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                     
                     {/* USER MESSAGE */}
                     {msg.role === 'user' && (
                        <div className="max-w-[85%] animate-slide-up">
                             <div className="text-[28px] font-medium text-white leading-tight tracking-tight mb-2">
                                 {msg.content}
                             </div>
                             {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex gap-2 mt-2 justify-end flex-wrap">
                                    {msg.attachments.map(att => (
                                        att.type === 'image' ? (
                                            <img key={att.id} src={att.url} className="w-16 h-16 rounded-lg object-cover border border-gray-800" />
                                        ) : (
                                            <div key={att.id} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">📎 {att.name}</div>
                                        )
                                    ))}
                                </div>
                             )}
                        </div>
                     )}

                     {/* AI MESSAGE */}
                     {msg.role === 'model' && (
                         <div className="w-full max-w-full animate-fade-in">
                            
                            {/* COLLAPSIBLE SOURCES BUTTON */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mb-4">
                                    <button 
                                        onClick={() => setExpandedSourceMsgId(expandedSourceMsgId === msg.timestamp ? null : msg.timestamp)}
                                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-streekx-primary transition-colors bg-[#1c1c1e] px-3 py-1.5 rounded-full border border-[#2c2c2e]"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                                        {expandedSourceMsgId === msg.timestamp ? 'Hide Sources' : `View ${msg.sources.length} Sources`}
                                    </button>
                                    
                                    {/* Sources List (Conditional) */}
                                    {expandedSourceMsgId === msg.timestamp && (
                                        <div className="flex gap-3 overflow-x-auto pb-2 mt-3 no-scrollbar animate-fade-in">
                                            {msg.sources.map((source, i) => (
                                                <a 
                                                    key={i} 
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0 w-40 p-3 bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] hover:border-gray-600 transition-all group flex flex-col justify-between h-24"
                                                >
                                                    <div className="text-[11px] font-bold text-gray-300 line-clamp-2 leading-snug group-hover:text-streekx-primary transition-colors">
                                                        {source.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {source.favicon && <img src={source.favicon} className="w-4 h-4 rounded-full" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                                                        <div className="text-[10px] text-gray-500 truncate">{source.source}</div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 2. STATUS INDICATOR (While Streaming) */}
                            {idx === messages.length - 1 && isStreaming && currentStatus && (
                                <div className="flex items-center gap-3 mb-4 text-streekx-primary animate-pulse">
                                    <div className="w-4 h-4 border-2 border-streekx-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold">{currentStatus}</span>
                                </div>
                            )}

                            {/* 3. ANSWER CONTENT */}
                            <div className="flex gap-4">
                                <div className="w-8 flex-shrink-0 pt-1">
                                    <div className="w-6 h-6 rounded-full bg-streekx-primary flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-bold text-white">StreekX Answer</span>
                                        {activeProject && <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Context-Aware</span>}
                                        {searchMode === 'Pro' && <span className="text-[10px] bg-streekx-primary text-white px-1.5 py-0.5 rounded font-bold">PRO</span>}
                                    </div>
                                    <div className="text-[16px] leading-7 text-gray-300 font-normal markdown-content">
                                        {msg.content ? (
                                            renderMarkdownWithCitations(msg.content, msg.sources)
                                        ) : (
                                            !currentStatus && <span className="text-gray-600 italic">Thinking...</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                         </div>
                     )}
                 </div>
             ))}
             {isStreaming && <div className="h-20"></div>}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#000000]">
             {/* Mode Selector Popover (Bottom Up in Chat) */}
             {showModeSelector && (
                 <div className="absolute bottom-20 left-4 bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] shadow-2xl p-2 w-48 animate-slide-up z-30">
                     {['Standard', 'Pro', 'Research', 'Labs'].map((m) => (
                         <button 
                            key={m} 
                            onClick={() => { setSearchMode(m as SearchMode); setShowModeSelector(false); }}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex justify-between items-center ${searchMode === m ? 'bg-streekx-primary text-white' : 'text-gray-400 hover:bg-[#2c2c2e] hover:text-white'}`}
                         >
                             {m}
                             {searchMode === m && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                         </button>
                     ))}
                 </div>
             )}
            
            {/* Attachments Preview above input */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 px-2 overflow-x-auto pb-2">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group flex-shrink-0 animate-fade-in">
                             {att.type === 'image' ? (
                                <img src={att.url} className="w-12 h-12 object-cover rounded-lg border border-gray-600" />
                            ) : (
                                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-lg border border-gray-600">📄</div>
                            )}
                            <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="absolute -top-1 -right-1 bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white">✕</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-[#1c1c1e] rounded-[2rem] border border-[#2c2c2e] focus-within:border-gray-500 transition-colors flex items-center p-2 relative shadow-lg">
                
                {/* Mode Icon (Left) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowModeSelector(!showModeSelector); }} 
                    className="p-3 text-gray-500 hover:text-white rounded-full transition-colors"
                >
                     {searchMode === 'Pro' ? <span className="text-[10px] bg-streekx-primary text-white px-1 rounded font-bold">PRO</span> : 
                      searchMode === 'Research' ? '⚡️' :
                      searchMode === 'Labs' ? '🧪' : 
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>}
                </button>

                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                    placeholder="Ask follow-up..." 
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 ml-2"
                />

                {/* Attach/Sources Icon (Right) - Now Toggles Full Modal */}
                <button onClick={() => setShowSources(true)} className="p-2 text-gray-500 hover:text-streekx-primary hover:bg-streekx-primary/10 rounded-full transition-all mr-1">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
                
                {/* Hidden Inputs for different file types */}
                <input type="file" ref={mediaInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                <input type="file" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.md,.csv,.json" />

                {/* DYNAMIC ACTION BUTTON */}
                {hasContent ? (
                    <button 
                        onClick={(e) => handleSend(e)}
                        disabled={isStreaming}
                        className="p-2.5 rounded-full transition-all bg-streekx-primary text-white hover:bg-streekx-primaryDark animate-fade-in"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg>
                    </button>
                ) : (
                    <button 
                        onClick={onOpenAssistant} 
                        className="p-1.5 rounded-full transition-transform active:scale-95 hover:opacity-80"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#00c2cb] flex items-center justify-center gap-[3px]">
                            <div className="w-[3px] bg-[#1c1c1e] rounded-full animate-wave-1"></div>
                            <div className="w-[3px] bg-[#1c1c1e] rounded-full animate-wave-2"></div>
                            <div className="w-[3px] bg-[#1c1c1e] rounded-full animate-wave-3"></div>
                            <div className="w-[3px] bg-[#1c1c1e] rounded-full animate-wave-2"></div>
                            <div className="w-[3px] bg-[#1c1c1e] rounded-full animate-wave-1"></div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    </div>
  );
}
