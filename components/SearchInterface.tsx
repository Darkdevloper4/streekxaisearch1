
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, SearchSession, Attachment, Project, SearchResult } from '../types';
import { generateSmartResponse } from '../services/gemini';

interface SearchProps {
  sessionId: string;
  initialSessions: SearchSession[];
  onBack: () => void;
  onUpdateMessages: (id: string, msgs: ChatMessage[]) => void;
  initialQuery: string;
  activeProject?: Project; 
}

export default function SearchInterface({ sessionId, initialSessions, onBack, onUpdateMessages, initialQuery, activeProject }: SearchProps) {
  const session = initialSessions.find(s => s.id === sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(session ? session.messages : []);
  const [input, setInput] = useState('');
  
  // State for Perplexity-like UX
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(''); // "Searching...", "Reading..."
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasExecutedInitial = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
        // Smooth scroll to bottom only if we are close to bottom or it's a new message
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, currentStatus]);

  // Handle Initial Query Execution
  useEffect(() => {
    if (initialQuery && !hasExecutedInitial.current && messages.length === 1 && messages[0].role === 'user') {
        hasExecutedInitial.current = true;
        executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (queryText: string) => {
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
            activeProject?.ai_prompt
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
    setInput('');
    setAttachments([]);
    executeSearch(txt);
  };

  // --- RENDERERS ---

  // Renders the [1] citations as clickable links
  const renderMarkdownWithCitations = (text: string, sources: SearchResult[] = []) => {
      if (!text) return null;
      
      // Split by citation markers [1], [2], etc.
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
          // Basic Markdown formatting (Simplified)
          return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />;
      });
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white font-sans animate-fade-in relative">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-20 bg-[#000000]/90 backdrop-blur-md border-b border-[#1c1c1e]">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <span className="font-bold text-sm tracking-widest text-streekx-primary uppercase opacity-80">StreekX AI</span>
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
                            
                            {/* 1. SOURCES ROW (Perplexity Style) */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sources</span>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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

                            {/* 4. ACTION BUTTONS */}
                            {!isStreaming && msg.content && (
                                <div className="flex gap-4 mt-6 ml-12 border-t border-[#2c2c2e] pt-4">
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1e] text-xs font-bold text-gray-400 hover:text-white hover:bg-[#2c2c2e] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        Copy
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1e] text-xs font-bold text-gray-400 hover:text-white hover:bg-[#2c2c2e] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                        Share
                                    </button>
                                </div>
                            )}
                         </div>
                     )}
                 </div>
             ))}
             {isStreaming && <div className="h-20"></div>}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#000000]">
            <div className="bg-[#1c1c1e] rounded-[2rem] border border-[#2c2c2e] focus-within:border-gray-500 transition-colors flex items-center p-2 relative">
                <button className="p-3 text-gray-500 hover:text-white rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                    placeholder="Ask follow-up..." 
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 ml-2"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isStreaming}
                    className={`p-2 rounded-full transition-all ${input.trim() ? 'bg-streekx-primary text-white' : 'bg-[#2c2c2e] text-gray-500'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        </div>
    </div>
  );
}
