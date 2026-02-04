
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateSmartResponse } from '../services/gemini';
import { ChatMessage } from '../types';

// --- TYPES ---
type VoiceMode = 'PUSH' | 'FREE';
type VoiceStyleName = 'Kyrin' | 'Velox' | 'Tylis' | 'Torma' | 'Mylva' | 'Syla' | 'Gravo' | 'Solva';

// We map global settings structure to internal structure
interface VoiceSettings {
  backgroundMode: boolean;
  subtitles: boolean;
  mode: VoiceMode;
  voiceStyle: VoiceStyleName;
  rate: number;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  backgroundMode: true,
  subtitles: true,
  mode: 'FREE',
  voiceStyle: 'Kyrin',
  rate: 1.1 
};

const VOICE_STYLES: VoiceStyleName[] = ['Kyrin', 'Velox', 'Tylis', 'Torma', 'Mylva', 'Syla', 'Gravo', 'Solva'];

interface AssistantProps {
  onClose: () => void;
  userQuery?: string;
}

// --- MAIN ASSISTANT COMPONENT ---
export default function StreekxAssistant({ onClose, userQuery }: AssistantProps) {
  // State
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'BLOCKED'>('IDLE');
  const [transcript, setTranscript] = useState(userQuery || '');
  const [assistantText, setAssistantText] = useState("Tap to speak");
  
  // Read Global Settings
  const [settings, setSettings] = useState<VoiceSettings>(() => {
      const savedGlobal = localStorage.getItem('streekx_settings');
      if (savedGlobal) {
          const parsed = JSON.parse(savedGlobal);
          return {
              backgroundMode: true,
              subtitles: true,
              mode: parsed.voiceMode === 'PUSH' ? 'PUSH' : 'FREE', // Map to internal type
              voiceStyle: parsed.voiceStyle || 'Kyrin',
              rate: 1.1
          };
      }
      return DEFAULT_SETTINGS;
  });
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Interactive Orb State
  const rotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Logic Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const isComponentMounted = useRef(true);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const processingRef = useRef(false);
  const isAutoStart = useRef(false);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    isComponentMounted.current = true;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
        const vs = window.speechSynthesis.getVoices();
        if (vs.length > 0) setVoices(vs);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.interimResults = true;
        
        // Use Global Speech Language Setting
        const savedGlobal = localStorage.getItem('streekx_settings');
        if (savedGlobal) {
            const parsed = JSON.parse(savedGlobal);
            recognition.lang = parsed.speechRecognition || 'en-US';
        } else {
            recognition.lang = 'en-US';
        }
        
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
             if (isComponentMounted.current) {
                 setStatus('LISTENING');
                 setAssistantText("Listening...");
                 isAutoStart.current = false;
             }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
                handleQuery(finalTranscript);
            } else if (interimTranscript) {
                setTranscript(interimTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.log("Voice Error:", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                if (isAutoStart.current) {
                    setStatus('IDLE');
                    setAssistantText("Tap to speak");
                } else {
                    setStatus('BLOCKED');
                    setAssistantText("Microphone blocked. Check settings.");
                }
            } else if (event.error === 'no-speech') {
                if (settings.mode === 'FREE' && isComponentMounted.current && !processingRef.current && status !== 'SPEAKING') {
                     setStatus('IDLE'); 
                } else {
                    setStatus('IDLE');
                    setAssistantText("I didn't hear anything.");
                }
            } else {
                if (status !== 'PROCESSING' && status !== 'SPEAKING') setStatus('IDLE');
            }
            isAutoStart.current = false;
        };

        recognition.onend = () => {
            if (status === 'LISTENING' && !processingRef.current && isComponentMounted.current) {
                setStatus('IDLE');
            }
        };

        recognitionRef.current = recognition;
    } else {
        setAssistantText("Voice input not supported.");
    }

    // Smart Auto-Start
    if (!userQuery) {
        setTimeout(() => {
             if (isComponentMounted.current && !processingRef.current && status !== 'BLOCKED') {
                 isAutoStart.current = true;
                 startListening();
             }
        }, 600);
    } else {
        setTranscript(userQuery);
        handleQuery(userQuery);
    }

    return () => {
        isComponentMounted.current = false;
        stopSpeaking();
        if (recognitionRef.current) recognitionRef.current.abort();
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // --- 2. INPUT HANDLERS (Orb Physics) ---
  const updateMousePos = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { 
          x: clientX - rect.left - rect.width/2, 
          y: clientY - rect.top - rect.height/2,
          active: true 
      };
  };

  const handleStart = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      updateMousePos(clientX, clientY, canvas);
      dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
  };

  const handleMove = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      updateMousePos(clientX, clientY, canvas);
      if (mouseRef.current.active) {
         rotationRef.current.y += (clientX - dragStartRef.current.x) * 0.00003;
         rotationRef.current.x += (clientY - dragStartRef.current.y) * 0.00003;
      }
  };

  const handleEnd = (clientX: number, clientY: number) => {
      mouseRef.current.active = false;
      mouseRef.current.x = -10000; 
      const dist = Math.sqrt(Math.pow(clientX - dragStartRef.current.x, 2) + Math.pow(clientY - dragStartRef.current.y, 2));
      const timeDiff = Date.now() - dragStartRef.current.time;
      if (dist < 10 && timeDiff < 400) {
          handleOrbClick();
      }
  };

  const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -10000;
  }

  const handleOrbClick = () => {
      isAutoStart.current = false;
      if (status === 'BLOCKED') startListening();
      else if (status === 'SPEAKING') { stopSpeaking(); setTimeout(startListening, 150); }
      else if (status === 'LISTENING') stopListening();
      else if (status === 'IDLE') startListening();
      else if (status === 'PROCESSING') { processingRef.current = false; stopListening(); setAssistantText("Cancelled."); setStatus('IDLE'); }
  };

  // --- 3. CONTROL FUNCTIONS ---
  const startListening = useCallback(() => {
      if (!recognitionRef.current || processingRef.current) return;
      if (synthRef.current?.speaking) synthRef.current.cancel();
      try { recognitionRef.current.start(); } catch (e) { console.debug("Ignored start listening"); }
  }, []);

  const stopListening = useCallback(() => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setStatus('IDLE');
  }, []);

  const stopSpeaking = useCallback(() => {
      if (synthRef.current) synthRef.current.cancel();
      setStatus('IDLE');
  }, []);

  // --- 4. PROCESSING LOOP ---
  const handleQuery = async (text: string) => {
      if (!text.trim()) return;
      processingRef.current = true;
      setStatus('PROCESSING');
      setAssistantText("Thinking...");
      if (recognitionRef.current) recognitionRef.current.stop();
      historyRef.current.push({ role: 'user', content: text, timestamp: Date.now() });

      try {
          const aiPromise = generateSmartResponse(
              text,
              historyRef.current.slice(0, -1),
              () => {}, () => {}, 
              (chunk) => { if (chunk.length < 200) setAssistantText(chunk); },
              undefined, 'Standard', undefined, undefined, true 
          );
          const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
          let responseText = await Promise.race([aiPromise, timeoutPromise]);
          if (!isComponentMounted.current) return;
          if (!responseText) responseText = "I didn't quite catch that. Could you say it again?";
          setAssistantText(responseText);
          historyRef.current.push({ role: 'model', content: responseText, timestamp: Date.now() });
          speakResponse(responseText);
      } catch (error) {
          console.error("AI Assistant Error:", error);
          setAssistantText("Connection Error");
          speakResponse("I'm having trouble connecting right now.");
      }
  };

  const speakResponse = (text: string) => {
      if (!synthRef.current) { processingRef.current = false; setStatus('IDLE'); return; }
      const cleanText = text.replace(/\*\*/g, '').replace(/https?:\/\/\S+/g, 'link');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const preferredVoices = voices.filter(v => v.lang.startsWith('en'));
      
      // Voice Selection Strategy
      const googleVoice = preferredVoices.find(v => v.name.includes("Google US English"));
      if (googleVoice) {
          utterance.voice = googleVoice;
      } else if (preferredVoices.length > 0) {
          // Fallback map based on Style Name if Google Voice unavailable
          const styleIdx = VOICE_STYLES.indexOf(settings.voiceStyle);
          const targetIndex = styleIdx % preferredVoices.length;
          utterance.voice = preferredVoices[targetIndex];
      }

      utterance.rate = settings.rate;
      utterance.onstart = () => { if (isComponentMounted.current) setStatus('SPEAKING'); };
      utterance.onend = () => {
          if (isComponentMounted.current) {
              processingRef.current = false;
              setStatus('IDLE');
              if (settings.mode === 'FREE') {
                  setTimeout(() => {
                      if (isComponentMounted.current && status !== 'LISTENING' && status !== 'BLOCKED') {
                          isAutoStart.current = true;
                          startListening();
                      }
                  }, 400); 
              }
          }
      };
      utterance.onerror = (e) => { processingRef.current = false; setStatus('IDLE'); };
      synthRef.current.speak(utterance);
  };

  // --- 5. VISUALS (ORB) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (particlesRef.current.length === 0) {
        const particleCount = 1600; const radius = 230;
        for (let i = 0; i < particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            particlesRef.current.push({
                ox: radius * Math.cos(theta) * Math.sin(phi),
                oy: radius * Math.sin(theta) * Math.sin(phi),
                oz: radius * Math.cos(phi),
                x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0,
                size: Math.random() * 1.5 + 0.5
            });
        }
    }

    let time = 0;
    const render = () => {
        if (!canvas || !ctx) return;
        const width = canvas.width = canvas.parentElement?.clientWidth || 300;
        const height = canvas.height = canvas.parentElement?.clientHeight || 300;
        const cx = width / 2; const cy = height / 2;
        ctx.clearRect(0, 0, width, height);
        time += 0.015;
        rotationRef.current.y += 0.003; rotationRef.current.x = Math.sin(time * 0.5) * 0.05;

        let scale = 1, r=180, g=180, b=180;
        if (status === 'LISTENING') { scale = 1.05 + Math.sin(time * 4) * 0.03; r=0; g=194; b=203; }
        else if (status === 'PROCESSING') { scale = 0.9; r=255; g=255; b=255; rotationRef.current.y += 0.08; }
        else if (status === 'SPEAKING') { scale = 1 + Math.sin(time * 8) * 0.08; r=0; g=194; b=203; }
        else if (status === 'BLOCKED') { r=255; g=80; b=80; scale = 0.9; }

        particlesRef.current.forEach(p => {
            let x1 = p.ox, y1 = p.oy, z1 = p.oz;
            const cosY = Math.cos(rotationRef.current.y), sinY = Math.sin(rotationRef.current.y);
            let tx = x1 * cosY - z1 * sinY, tz = x1 * sinY + z1 * cosY; x1 = tx; z1 = tz;
            const cosX = Math.cos(rotationRef.current.x), sinX = Math.sin(rotationRef.current.x);
            let ty = y1 * cosX - z1 * sinX; tz = y1 * sinX + z1 * cosX; y1 = ty; z1 = tz;

            const perspective = 400 / (400 + z1 + 200);
            const finalX = cx + x1 * scale * perspective;
            const finalY = cy + y1 * scale * perspective;
            const alpha = Math.min(1, Math.max(0.1, 0.6 + (z1 / 300)));
            
            if (perspective > 0.1) {
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.beginPath(); ctx.arc(finalX, finalY, p.size * perspective, 0, Math.PI * 2); ctx.fill();
            }
        });
        animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [status]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#101010] flex flex-col items-center justify-between font-sans animate-fade-in text-white select-none">
        
        {/* Top Header */}
        <div className="w-full flex justify-between items-center p-6 pt-8 z-10 absolute top-0 left-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <button onClick={onClose} className="pointer-events-auto w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2c2c2e] border border-[#2c2c2e]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-streekx-primary tracking-widest uppercase flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'IDLE' ? 'bg-gray-600' : (status === 'BLOCKED' ? 'bg-red-500' : 'bg-streekx-primary animate-pulse')}`}></span>
                    StreekX Live
                </span>
            </div>
            <div className="w-10"></div>
        </div>

        {/* Central Visuals */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative mt-10">
            <div className="w-full h-[550px] flex items-center justify-center relative touch-none"
                onMouseDown={(e) => handleStart(e.clientX, e.clientY, e.currentTarget.querySelector('canvas')!)}
                onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget.querySelector('canvas')!)}
                onMouseUp={(e) => handleEnd(e.clientX, e.clientY)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.querySelector('canvas')!)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.querySelector('canvas')!)}
                onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                onClick={handleOrbClick}
            >
                <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
            </div>
            <div className="px-8 text-center max-w-xl min-h-[80px]">
                {status === 'LISTENING' ? <h2 className="text-2xl font-bold text-white leading-tight animate-fade-in">{transcript || "Listening..."}</h2> : 
                 status === 'PROCESSING' ? <h2 className="text-2xl font-bold text-streekx-primary animate-pulse">Thinking...</h2> : 
                 status === 'BLOCKED' ? <h2 className="text-xl font-bold text-red-400">Microphone Blocked</h2> : 
                 <p className="text-xl font-medium text-gray-200 leading-relaxed line-clamp-3">{assistantText}</p>}
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="w-full p-8 pb-12 flex items-center justify-center gap-10 relative z-20">
             <button className="p-4 rounded-full bg-[#1c1c1e] text-gray-500 border border-[#2c2c2e] hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
             </button>
            <button onClick={handleOrbClick} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    status === 'LISTENING' ? 'bg-white text-black scale-110 shadow-white/30' : 
                    status === 'SPEAKING' ? 'bg-[#00c2cb] text-black scale-110 shadow-[#00c2cb]/30' :
                    status === 'PROCESSING' ? 'bg-[#1c1c1e] text-streekx-primary border-2 border-streekx-primary animate-pulse' :
                    status === 'BLOCKED' ? 'bg-red-500/10 text-red-500 border-2 border-red-500 animate-pulse' :
                    'bg-[#2c2c2e] text-white border border-[#3a3a3c] hover:bg-[#3a3a3c]'
                }`}>
                {status === 'LISTENING' ? <div className="w-6 h-6 bg-black rounded-sm animate-pulse"></div> : 
                 status === 'SPEAKING' ? <div className="flex gap-1 h-6"><div className="w-1.5 h-3 bg-black rounded-full animate-bounce"></div><div className="w-1.5 h-5 bg-black rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-3 bg-black rounded-full animate-bounce delay-150"></div></div> : 
                 status === 'PROCESSING' ? <div className="w-6 h-6 border-2 border-streekx-primary border-t-transparent rounded-full animate-spin"></div> : 
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>}
            </button>
            <button onClick={onClose} className="p-4 rounded-full bg-[#1c1c1e] text-red-400 border border-[#2c2c2e] hover:bg-red-900/20 transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    </div>
  );
}
