
import React, { useState, useEffect, useRef } from 'react';
import { generateSmartResponse } from '../services/gemini';
import { ChatMessage } from '../types';

interface AssistantProps {
  onClose: () => void;
  userQuery?: string; // Optional initial query
}

export default function StreekxAssistant({ onClose, userQuery }: AssistantProps) {
  const [state, setState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
  const [transcript, setTranscript] = useState(userQuery || '');
  const [response, setResponse] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Services
  useEffect(() => {
    if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => setState('LISTENING');
        
        recognitionRef.current.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const final = event.results[i][0].transcript;
                    setTranscript(final);
                    handleQuery(final);
                } else {
                    interim += event.results[i][0].transcript;
                    setTranscript(interim);
                }
            }
        };

        recognitionRef.current.onend = () => {
            if (state === 'LISTENING') setState('IDLE');
        };

        recognitionRef.current.onerror = (e: any) => {
            console.error(e);
            setState('IDLE');
        };
    }

    // Auto-start if no query provided
    if (!userQuery) {
        startListening();
    } else {
        handleQuery(userQuery);
    }

    return () => {
        stopSpeaking();
        recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
      stopSpeaking();
      setTranscript('');
      setResponse('');
      try {
          recognitionRef.current?.start();
      } catch(e) {
          // Already started
      }
  };

  const stopSpeaking = () => {
      if (synthRef.current) {
          synthRef.current.cancel();
      }
  };

  const speak = (text: string) => {
      if (!synthRef.current) return;
      stopSpeaking();
      
      const cleanText = text.replace(/[*#]/g, '').replace(/https?:\/\/\S+/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.1;
      utterance.pitch = 1;
      
      utterance.onstart = () => setState('SPEAKING');
      utterance.onend = () => setState('IDLE');
      
      synthRef.current.speak(utterance);
  };

  const handleQuery = async (text: string) => {
      if (!text.trim()) return;
      setState('PROCESSING');
      historyRef.current.push({ role: 'user', content: text, timestamp: Date.now() });

      let fullResponse = '';
      try {
          await generateSmartResponse(
              text, 
              historyRef.current.slice(0, -1), // Pass history excluding current message to avoid duplication
              () => {}, // onStatusUpdate - optional for voice mode
              () => {}, // onSourcesFound - optional for voice mode
              (chunk) => {
                  fullResponse = chunk;
                  setResponse(chunk);
              }
          );
          historyRef.current.push({ role: 'model', content: fullResponse, timestamp: Date.now() });
          speak(fullResponse);
      } catch (e) {
          setResponse("Connection error.");
          speak("Connection error.");
          setState('IDLE');
      }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          onClose();
      }
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
    >
        {/* Assistant Sheet */}
        <div 
            ref={containerRef}
            className="w-full bg-[#1c1c1e] rounded-t-[2.5rem] p-6 pb-10 shadow-2xl animate-slide-up relative overflow-hidden border-t border-[#2c2c2e]"
            style={{ maxHeight: '85vh' }}
        >
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6 opacity-50"></div>

            {/* Content Area */}
            <div className="flex flex-col items-center min-h-[250px] justify-between">
                
                {/* Visualizer / Glow */}
                <div className="relative w-full flex items-center justify-center h-32 mb-4">
                    {/* Idle State */}
                    {state === 'IDLE' && (
                        <button 
                            onClick={startListening}
                            className="w-16 h-16 rounded-full bg-streekx-primary flex items-center justify-center text-white shadow-lg shadow-streekx-primary/40 hover:scale-105 transition-transform"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        </button>
                    )}

                    {/* Active States (Listening/Processing/Speaking) */}
                    {(state === 'LISTENING' || state === 'PROCESSING' || state === 'SPEAKING') && (
                        <div className="relative flex items-center justify-center">
                             {/* The Glow */}
                             <div className={`absolute w-full h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-streekx-primary blur-2xl opacity-60 rounded-full transition-all duration-500 ${state === 'SPEAKING' ? 'scale-110 opacity-80' : 'scale-100'}`}></div>
                             
                             {/* The Bar Animation */}
                             <div className="flex items-center gap-2 z-10 h-10">
                                 {[1,2,3,4].map(i => (
                                     <div key={i} className={`w-3 rounded-full bg-white transition-all duration-300 ${
                                         state === 'LISTENING' ? 'h-3 animate-pulse' : 
                                         state === 'PROCESSING' ? 'h-6 animate-bounce' : 
                                         state === 'SPEAKING' ? `h-${Math.floor(Math.random() * 8) + 4} animate-pulse` : 'h-3'
                                     }`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* Text Display */}
                <div className="w-full text-center space-y-4">
                     {state === 'LISTENING' ? (
                         <h3 className="text-2xl font-bold text-white tracking-tight animate-pulse">Listening...</h3>
                     ) : transcript ? (
                         <div className="text-left w-full bg-black/20 p-4 rounded-2xl border border-white/5">
                             <p className="text-gray-400 text-sm font-bold mb-1 uppercase tracking-wider">You said</p>
                             <p className="text-lg text-white font-medium leading-tight mb-4">"{transcript}"</p>
                             
                             {response && (
                                 <div className="animate-fade-in">
                                     <div className="h-px bg-white/10 w-full mb-4"></div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <div className="w-4 h-4 rounded-full bg-streekx-primary flex items-center justify-center text-[8px] text-white font-bold">S</div>
                                         <p className="text-streekx-primary text-sm font-bold uppercase tracking-wider">StreekX</p>
                                     </div>
                                     <p className="text-base text-gray-200 leading-relaxed">{response}</p>
                                 </div>
                             )}
                         </div>
                     ) : (
                         <h3 className="text-gray-500 font-medium">Tap the mic to start</h3>
                     )}
                </div>

                {/* Footer Controls */}
                <div className="w-full flex justify-between items-center mt-6 pt-4 border-t border-[#2c2c2e]">
                     <button className="p-3 bg-[#2c2c2e] rounded-full hover:bg-[#3a3a3c] transition-colors">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                     </button>
                     <button onClick={onClose} className="px-6 py-2 bg-[#2c2c2e] rounded-full font-bold text-sm text-gray-300 hover:text-white hover:bg-[#3a3a3c] transition-colors">
                         Close
                     </button>
                     <button className="p-3 bg-[#2c2c2e] rounded-full hover:bg-[#3a3a3c] transition-colors">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                     </button>
                </div>

            </div>
        </div>
    </div>
  );
}
