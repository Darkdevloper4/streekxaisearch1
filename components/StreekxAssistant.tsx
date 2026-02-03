
import React, { useState, useEffect, useRef } from 'react';
import { generateSmartResponse } from '../services/gemini';
import { ChatMessage } from '../types';

// --- TYPES ---
type VoiceMode = 'PUSH' | 'FREE';
type VoiceStyleName = 'Kyrin' | 'Velox' | 'Tylis' | 'Torma' | 'Mylva' | 'Syla' | 'Gravo' | 'Solva';

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
  rate: 1.0
};

const VOICE_STYLES: VoiceStyleName[] = ['Kyrin', 'Velox', 'Tylis', 'Torma', 'Mylva', 'Syla', 'Gravo', 'Solva'];

interface AssistantProps {
  onClose: () => void;
  userQuery?: string;
}

// --- SETTINGS COMPONENT ---
const SettingsView = ({ 
    settings, 
    updateSettings, 
    onClose, 
    availableVoices 
}: { 
    settings: VoiceSettings, 
    updateSettings: (s: Partial<VoiceSettings>) => void, 
    onClose: () => void,
    availableVoices: SpeechSynthesisVoice[]
}) => {
    
    const playPreview = (style: VoiceStyleName) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Hello, I am ${style}.`);
        const voiceIndex = VOICE_STYLES.indexOf(style) % availableVoices.length;
        if (availableVoices[voiceIndex]) {
            utterance.voice = availableVoices[voiceIndex];
        }
        utterance.rate = settings.rate;
        window.speechSynthesis.speak(utterance);
    };

    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
        <div onClick={() => onChange(!checked)} className={`w-[50px] h-[30px] rounded-full p-1 cursor-pointer transition-all relative ${checked ? 'bg-[#00c2cb]' : 'bg-[#3a3a3c]'}`}>
            <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
        </div>
    );

    const SectionTitle = ({ label }: { label: string }) => (
        <h3 className="text-[#00c2cb] text-[13px] font-bold uppercase tracking-wider mb-3 mt-6 px-4">{label}</h3>
    );

    const Row = ({ label, sub, action, onClick }: { label: string, sub?: string, action?: React.ReactNode, onClick?: () => void }) => (
        <div onClick={onClick} className={`flex items-center justify-between py-4 px-4 active:bg-[#1c1c1e] transition-colors ${onClick ? 'cursor-pointer' : ''}`}>
            <div>
                <div className="text-white text-[17px] font-medium">{label}</div>
                {sub && <div className="text-gray-500 text-[13px] mt-0.5">{sub}</div>}
            </div>
            {action}
        </div>
    );

    const Check = () => <svg className="w-5 h-5 text-[#00c2cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>;

    return (
        <div className="absolute inset-0 z-50 bg-[#121212] flex flex-col animate-slide-up font-sans overflow-hidden">
            <div className="flex items-center px-4 py-4 border-b border-[#2c2c2e]">
                <button onClick={onClose} className="p-2 -ml-2 text-white hover:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 className="ml-4 text-[20px] font-medium text-white">Voice Settings</h2>
            </div>

            <div className="flex-1 overflow-y-auto pb-10">
                <SectionTitle label="Conversation" />
                <Row 
                    label="Background voice mode" 
                    action={<Toggle checked={settings.backgroundMode} onChange={(v) => updateSettings({ backgroundMode: v })} />} 
                />
                <Row 
                    label="Subtitles" 
                    sub="See the response transcript"
                    action={<Toggle checked={settings.subtitles} onChange={(v) => updateSettings({ subtitles: v })} />} 
                />

                <SectionTitle label="Voice Mode" />
                <Row 
                    label="Push to talk" 
                    sub="Press and hold the button to ask questions"
                    onClick={() => updateSettings({ mode: 'PUSH' })}
                    action={settings.mode === 'PUSH' ? <Check /> : null}
                />
                <Row 
                    label="Hands free" 
                    sub="Automatic speech detection"
                    onClick={() => updateSettings({ mode: 'FREE' })}
                    action={settings.mode === 'FREE' ? <Check /> : null}
                />

                <SectionTitle label="Voice Style" />
                {VOICE_STYLES.map(style => (
                    <div key={style} className="flex items-center justify-between py-3 px-4 active:bg-[#1c1c1e] transition-colors cursor-pointer" onClick={() => updateSettings({ voiceStyle: style })}>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); playPreview(style); }}
                                className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3a3a3c]"
                            >
                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                            </button>
                            <span className="text-white text-[17px] font-medium">{style}</span>
                        </div>
                        {settings.voiceStyle === style && <Check />}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN ASSISTANT COMPONENT ---
export default function StreekxAssistant({ onClose, userQuery }: AssistantProps) {
  // State
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [transcript, setTranscript] = useState(userQuery || '');
  const [assistantText, setAssistantText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(() => {
      const saved = localStorage.getItem('streekx_voice_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const animationFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<any>(null);
  
  // Interactive Particles Refs
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            setVoices(vs);
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; 
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
             setStatus('LISTENING');
             clearTimeout(silenceTimerRef.current);
        };
        
        recognitionRef.current.onresult = (event: any) => {
            clearTimeout(silenceTimerRef.current);
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                     setTranscript(event.results[i][0].transcript);
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
                handleQuery(finalTranscript);
            }
        };

        recognitionRef.current.onend = () => {
             if (status === 'LISTENING') {
                 setStatus('IDLE'); 
             }
        };

        recognitionRef.current.onerror = (e: any) => {
            if (e.error !== 'no-speech') setStatus('IDLE');
        };
    }

    // Auto-start if not initially querying
    if (!userQuery && settings.mode === 'FREE') {
        startListening();
    } else if (userQuery) {
        handleQuery(userQuery);
    }

    return () => {
        stopSpeaking();
        recognitionRef.current?.stop();
        clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // --- VISUALIZER ENGINE (Interactive Orb) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Particles
    if (particlesRef.current.length === 0) {
        const particleCount = 800; // High density for the orb
        const radius = 120;
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute on sphere surface using Fibonacci sphere algorithm
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);
            
            particlesRef.current.push({
                ox: x, oy: y, oz: z, // Original Sphere Coords
                x: x, y: y, z: z,    // Current Coords
                vx: 0, vy: 0, vz: 0, // Velocity
                size: Math.random() * 1.5 + 0.5
            });
        }
    }

    let rotationX = 0;
    let rotationY = 0;
    let time = 0;

    const render = () => {
        if (!canvas || !ctx) return;
        const width = canvas.width = canvas.parentElement?.clientWidth || 300;
        const height = canvas.height = canvas.parentElement?.clientHeight || 300;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        time += 0.05;

        // Dynamic Status Variables
        let baseColorR = 255, baseColorG = 255, baseColorB = 255; // White (Idle/Listening)
        let rotationSpeed = 0.003;
        let expansion = 0;
        
        if (status === 'LISTENING') {
            expansion = Math.sin(time * 0.5) * 10; // Breathing
            baseColorR = 255; baseColorG = 255; baseColorB = 255;
        } else if (status === 'THINKING') {
            rotationSpeed = 0.05; // Fast spin
            baseColorR = 255; baseColorG = 165; baseColorB = 0; // Orange
        } else if (status === 'SPEAKING') {
            expansion = Math.sin(time * 2) * 15; // Fast vibration
            baseColorR = 0; baseColorG = 194; baseColorB = 203; // Teal
        }

        rotationX += rotationSpeed;
        rotationY += rotationSpeed * 0.6;

        particlesRef.current.forEach(p => {
            // 1. Rotate basic sphere structure
            let x = p.ox; 
            let y = p.oy; 
            let z = p.oz;

            // Apply Status Expansion
            const scaleExp = 1 + (expansion / 120);
            x *= scaleExp; y *= scaleExp; z *= scaleExp;

            // 3D Rotation Math
            let y1 = y * Math.cos(rotationX) - z * Math.sin(rotationX);
            let z1 = y * Math.sin(rotationX) + z * Math.cos(rotationX);
            let x1 = x * Math.cos(rotationY) - z1 * Math.sin(rotationY);
            let z2 = x * Math.sin(rotationY) + z1 * Math.cos(rotationY);
            
            // 2. Project to 2D Screen Space
            const perspective = 300 / (300 + z2);
            let screenX = centerX + x1 * perspective;
            let screenY = centerY + y1 * perspective;

            // 3. INTERACTIVE REPULSION (Perplexity Finger Effect)
            if (mouseRef.current.active) {
                const dx = screenX - mouseRef.current.x;
                const dy = screenY - mouseRef.current.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const repelRadius = 150;

                if (dist < repelRadius) {
                    const force = (repelRadius - dist) / repelRadius;
                    const angle = Math.atan2(dy, dx);
                    // Push particle away
                    p.vx += Math.cos(angle) * force * 5;
                    p.vy += Math.sin(angle) * force * 5;
                }
            }

            // Apply Physics to current position (spring back to projected sphere pos)
            // Note: We are simulating physics on 2D projection for the scattering effect
            p.x += p.vx;
            p.y += p.vy;
            
            // Damping (friction)
            p.vx *= 0.9;
            p.vy *= 0.9;

            // Spring force back to calculated sphere position
            // Since we calculated screenX/Y above based on rotation, we consider that the "target"
            // But we render at p.x/p.y which tracks the physics offset
            // Initialize p.x/p.y to screenX/Y if this is the first frame or drift is huge
            if (Math.abs(p.x - screenX) > 500) { p.x = screenX; p.y = screenY; }

            const ax = (screenX - p.x) * 0.1; // Spring stiffness
            const ay = (screenY - p.y) * 0.1;
            p.vx += ax;
            p.vy += ay;

            // 4. Draw
            const alpha = (0.5 + z2/200); // Depth fading
            ctx.fillStyle = `rgba(${baseColorR}, ${baseColorG}, ${baseColorB}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * perspective, 0, Math.PI * 2);
            ctx.fill();
        });

        animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [status]);

  // --- MOUSE/TOUCH HANDLERS ---
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let x, y;

      if ('touches' in e) {
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
      } else {
          x = (e as React.MouseEvent).clientX - rect.left;
          y = (e as React.MouseEvent).clientY - rect.top;
      }
      mouseRef.current = { x, y, active: true };
  };

  const handlePointerLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, active: false };
  };


  // --- LOGIC FUNCTIONS ---
  const startListening = () => {
      stopSpeaking();
      setTranscript('');
      setAssistantText('');
      try { recognitionRef.current?.start(); } catch(e) { /* already started */ }
  };

  const stopListening = () => {
      recognitionRef.current?.stop();
      setStatus('IDLE');
  };

  const stopSpeaking = () => {
      if (synthRef.current) synthRef.current.cancel();
  };

  const speak = (text: string) => {
      if (!synthRef.current) return;
      stopSpeaking();
      
      const cleanText = text.replace(/[*#]/g, '').replace(/https?:\/\/\S+/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const sortedVoices = voices.sort((a, b) => {
          const aGood = a.name.includes('Google') || a.name.includes('Samantha') || a.name.includes('Daniel');
          const bGood = b.name.includes('Google') || b.name.includes('Samantha') || b.name.includes('Daniel');
          return (aGood === bGood) ? 0 : aGood ? -1 : 1;
      });

      const styleIndex = VOICE_STYLES.indexOf(settings.voiceStyle);
      const voiceIndex = styleIndex % sortedVoices.length;
      if (sortedVoices[voiceIndex]) utterance.voice = sortedVoices[voiceIndex];
      utterance.rate = settings.rate;
      
      utterance.onstart = () => setStatus('SPEAKING');
      utterance.onend = () => {
          setStatus('IDLE');
          if (settings.mode === 'FREE') {
               setTimeout(() => { try { recognitionRef.current?.start(); } catch(e){} }, 500);
          }
      };
      
      synthRef.current.speak(utterance);
  };

  const handleQuery = async (text: string) => {
      if (!text.trim()) return;
      setStatus('THINKING');
      recognitionRef.current?.stop();

      historyRef.current.push({ role: 'user', content: text, timestamp: Date.now() });

      let fullResponse = '';
      try {
          await generateSmartResponse(
              text, 
              historyRef.current.slice(0, -1),
              () => {}, 
              () => {}, 
              (chunk) => {
                  fullResponse = chunk;
                  setAssistantText(chunk);
              }
          );
          historyRef.current.push({ role: 'model', content: fullResponse, timestamp: Date.now() });
          speak(fullResponse);
      } catch (e) {
          const err = "I'm having trouble connecting right now.";
          setAssistantText(err);
          speak(err);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#101010] flex flex-col items-center justify-between font-sans animate-fade-in text-white">
        
        {/* SETTINGS OVERLAY */}
        {showSettings && (
            <SettingsView 
                settings={settings} 
                updateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))} 
                onClose={() => setShowSettings(false)}
                availableVoices={voices}
            />
        )}

        {/* TOP BAR */}
        <div className="w-full flex justify-between items-center p-6 pt-8 z-10 absolute top-0 left-0 bg-gradient-to-b from-[#101010] to-transparent">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2c2c2e] border border-[#2c2c2e]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-streekx-primary tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-streekx-primary rounded-full animate-pulse"></span>
                    StreekX Live
                </span>
            </div>

            <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2c2c2e] border border-[#2c2c2e]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
        </div>

        {/* CENTRAL ORB CONTENT */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative mt-10">
            
            {/* Interactive Canvas */}
            <div 
                className="w-full h-[380px] flex items-center justify-center mb-4 relative cursor-pointer"
                onMouseMove={handlePointerMove}
                onTouchMove={handlePointerMove}
                onMouseLeave={handlePointerLeave}
                onTouchEnd={handlePointerLeave}
                onClick={() => status === 'LISTENING' ? stopListening() : startListening()} // Tap orb to toggle
            >
                 <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Transcripts */}
            <div className={`px-8 text-center max-w-lg transition-all duration-300 min-h-[100px] flex flex-col items-center justify-center ${settings.subtitles ? 'opacity-100' : 'opacity-0'}`}>
                {status === 'IDLE' && !transcript && (
                    <h2 className="text-2xl font-bold text-gray-500 animate-pulse tracking-tight">
                        {settings.mode === 'FREE' ? "Listening..." : "Tap orb to speak"}
                    </h2>
                )}

                {status === 'LISTENING' && (
                     <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-2 leading-snug">"{transcript || '...'}"</h2>
                     </div>
                )}
                
                {status === 'THINKING' && (
                    <h2 className="text-2xl font-bold text-streekx-primary animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-streekx-primary rounded-full animate-bounce"></span>
                        Thinking
                        <span className="w-2 h-2 bg-streekx-primary rounded-full animate-bounce delay-75"></span>
                    </h2>
                )}

                {(status === 'SPEAKING' || (status === 'IDLE' && assistantText)) && (
                    <div className="animate-fade-in bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
                        <p className="text-lg font-medium text-gray-100 leading-relaxed line-clamp-5">
                            {assistantText}
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="w-full p-8 pb-12 flex items-center justify-center gap-8 relative z-20">
             
             {/* Text Input Trigger */}
             <button className="p-4 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white border border-[#2c2c2e] hover:border-gray-500 transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
             </button>

            {/* Main Mic Action */}
            <button 
                onClick={status === 'LISTENING' ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    status === 'LISTENING' ? 'bg-white text-black scale-110 shadow-white/20' : 
                    status === 'SPEAKING' ? 'bg-[#00c2cb] text-black scale-110 shadow-[#00c2cb]/30' :
                    'bg-[#2c2c2e] text-white border-2 border-transparent hover:border-gray-500'
                }`}
            >
                {status === 'LISTENING' ? (
                     <div className="w-6 h-6 bg-black rounded-sm"></div> 
                ) : status === 'SPEAKING' ? (
                     <div className="flex gap-1 items-center h-6">
                         <div className="w-1 h-3 bg-black rounded-full animate-bounce"></div>
                         <div className="w-1 h-5 bg-black rounded-full animate-bounce delay-75"></div>
                         <div className="w-1 h-3 bg-black rounded-full animate-bounce delay-150"></div>
                     </div>
                ) : (
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                )}
            </button>

             {/* Close/End */}
            <button onClick={onClose} className="p-4 rounded-full bg-[#1c1c1e] text-red-400 hover:text-red-300 border border-[#2c2c2e] hover:border-red-900/50 transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    </div>
  );
}
