
import React, { useState, useEffect } from 'react';

interface AuthProps {
  onLogin: (id: string, pass: string) => void;
  onSignup: (data: any) => void;
}

type SignupStep = 'NAME' | 'INFO' | 'ID' | 'PASSWORD';
type AuthMode = 'LOGIN' | 'SIGNUP';

export default function Auth({ onLogin, onSignup }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [step, setStep] = useState<SignupStep>('NAME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    streekx_id: '',
    username: '',
    password: '',
    full_name: '',
    dob: '',
    mobile: '',
    gender: 'Prefer not to say'
  });

  // Clear error when changing inputs
  useEffect(() => {
    setError(null);
  }, [step, mode, formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'streekx_id') {
        const val = value.replace(/[^a-zA-Z0-9._-]/g, '');
        setFormData(prev => ({ ...prev, [name]: val }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateAge = (dob: string) => {
      if (!dob) return 0;
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  // --- NAVIGATION & VALIDATION ---

  const handleNext = () => {
      setError(null);
      
      if (step === 'NAME') {
          if (!formData.full_name.trim() || !formData.username.trim()) {
              setError("Please enter your name and username.");
              return;
          }
          if (formData.username.trim().length < 3) {
              setError("Username must be at least 3 characters.");
              return;
          }
          // Auto-suggest ID if empty
          if (!formData.streekx_id) {
             const suggested = formData.username.replace('@', '').toLowerCase().replace(/[^a-z0-9]/g, '');
             setFormData(prev => ({ ...prev, streekx_id: suggested }));
          }
          setStep('INFO');
      } 
      else if (step === 'INFO') {
          if (!formData.dob) {
              setError("Please enter your date of birth.");
              return;
          }
          const age = calculateAge(formData.dob);
          if (age < 16) {
              setError(`You must be at least 16 years old. (Age: ${age})`);
              return;
          }
          setStep('ID');
      }
      else if (step === 'ID') {
          if (!formData.streekx_id.trim()) {
              setError("Please create a StreekX ID.");
              return;
          }
          setStep('PASSWORD');
      }
  };

  const handleBack = () => {
      setError(null);
      if (step === 'NAME') setMode('LOGIN'); // Go back to login choice
      else if (step === 'INFO') setStep('NAME');
      else if (step === 'ID') setStep('INFO');
      else if (step === 'PASSWORD') setStep('ID');
  };

  // --- SUBMISSION ---

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
        if (mode === 'LOGIN') {
            if (!formData.streekx_id || !formData.password) {
                throw new Error("Enter ID and Password.");
            }
            const loginId = formData.streekx_id.includes('√streekx.not') 
                ? formData.streekx_id 
                : `${formData.streekx_id}√streekx.not`;
            
            await onLogin(loginId, formData.password);
        } else {
             // SIGNUP VALIDATION
             const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
             if (!strongPasswordRegex.test(formData.password)) {
                  throw new Error("Password too weak. Needs 8+ chars, Uppercase, Lowercase & Number/Symbol.");
             }

             let finalUsername = formData.username.trim();
             if (!finalUsername.startsWith('@')) finalUsername = '@' + finalUsername;

             await onSignup({
                 ...formData,
                 username: finalUsername,
                 streekx_id: `${formData.streekx_id}√streekx.not`
             });
        }
    } catch (err: any) {
        setError(err.message || "Authentication failed.");
    } finally {
        setLoading(false);
    }
  };

  // --- HEADER COMPONENT ---
  const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
      <div className="flex items-center justify-between py-6 px-2 mb-4">
          <div className="w-10">
            {showBack && (
                <button onClick={mode === 'LOGIN' ? () => setMode('SIGNUP') : handleBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full transition-colors active:bg-[#1c1c1e]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
            )}
          </div>
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-streekx-primary tracking-widest uppercase mb-1">StreekX ID</span>
             <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <div className="w-10"></div>
      </div>
  );

  // --- RENDER SCREENS ---

  if (mode === 'LOGIN') {
      return (
        <div className="h-screen w-full flex flex-col bg-[#000000] font-sans overflow-hidden">
            <div className="flex-1 flex flex-col justify-center px-8 animate-fade-in max-w-md mx-auto w-full">
                <div className="mb-10 text-center">
                     <div className="w-16 h-16 bg-streekx-primary rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-2xl">S</div>
                     <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                     <p className="text-gray-400">Enter your credentials to access your space.</p>
                </div>

                {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm font-bold text-center">{error}</div>}

                <form onSubmit={handleFinalSubmit} className="space-y-4">
                     <div className="flex items-center w-full bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] focus-within:border-streekx-primary transition-all overflow-hidden relative h-[60px]">
                        <input 
                            type="text" 
                            name="streekx_id"
                            placeholder="StreekX ID"
                            value={formData.streekx_id}
                            onChange={handleChange}
                            className="flex-1 px-4 bg-transparent outline-none text-white font-bold h-full"
                            autoComplete="off"
                        />
                         <div className="bg-[#2c2c2e] h-full px-3 flex items-center justify-center text-xs text-gray-400 font-bold select-none whitespace-nowrap">
                            √streekx.not
                        </div>
                    </div>
                    <input 
                        type="password" 
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full h-[60px] px-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none transition-all font-bold"
                    />
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-4 bg-white text-black rounded-full font-extrabold text-lg shadow-lg hover:bg-gray-200 transition-all active:scale-95"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button onClick={() => { setMode('SIGNUP'); setStep('NAME'); setError(null); }} className="text-streekx-primary font-bold text-sm hover:underline">
                        Create new identity
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- SIGNUP WIZARD ---

  return (
    <div className="h-screen w-full flex flex-col bg-[#000000] font-sans overflow-hidden px-6">
        
        {/* STEP 1: NAME */}
        {step === 'NAME' && (
            <div className="flex-1 flex flex-col animate-slide-right max-w-md mx-auto w-full">
                <Header title="Create your identity" />
                <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">What's your name?</h3>
                    <p className="text-gray-400 text-center mb-8 text-sm">Enter the name you use in real life.</p>
                    
                    {error && <div className="text-red-400 text-sm font-bold text-center mb-4">{error}</div>}

                    <div className="space-y-4">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Full Name</label>
                             <input 
                                type="text"
                                name="full_name"
                                autoFocus
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Username</label>
                             <div className="relative">
                                 <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">@</span>
                                 <input 
                                    type="text"
                                    name="username"
                                    value={formData.username.replace('@', '')}
                                    onChange={handleChange}
                                    className="w-full p-4 pl-8 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg"
                                 />
                             </div>
                        </div>
                    </div>

                    <div className="mt-auto pb-8">
                        <button onClick={handleNext} className="w-full py-4 bg-streekx-primary text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 2: INFO */}
        {step === 'INFO' && (
            <div className="flex-1 flex flex-col animate-slide-right max-w-md mx-auto w-full">
                <Header title="Basic information" />
                <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">Basic Info</h3>
                    <p className="text-gray-400 text-center mb-8 text-sm">Enter your birthday and gender.</p>

                    {error && <div className="text-red-400 text-sm font-bold text-center mb-4">{error}</div>}

                    <div className="space-y-6">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Date of Birth</label>
                             <input 
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg"
                             />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Gender</label>
                             <select 
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg h-[62px]"
                             >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                             </select>
                        </div>
                    </div>

                    <div className="mt-auto pb-8">
                        <button onClick={handleNext} className="w-full py-4 bg-streekx-primary text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 3: ID */}
        {step === 'ID' && (
             <div className="flex-1 flex flex-col animate-slide-right max-w-md mx-auto w-full">
                <Header title="Secure Identity" />
                <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">Your StreekX ID</h3>
                    <p className="text-gray-400 text-center mb-8 text-sm">This is your unique digital address.</p>

                    {error && <div className="text-red-400 text-sm font-bold text-center mb-4">{error}</div>}

                    <div>
                        <div className="flex items-center w-full bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] focus-within:border-streekx-primary transition-all overflow-hidden relative h-[64px]">
                            <input 
                                type="text" 
                                name="streekx_id"
                                value={formData.streekx_id}
                                onChange={handleChange}
                                className="flex-1 px-4 bg-transparent outline-none text-white font-mono font-bold text-lg h-full"
                                placeholder="unique-id"
                                autoComplete="off"
                            />
                             <div className="bg-[#2c2c2e] h-full px-4 flex items-center justify-center text-sm text-gray-400 font-bold select-none whitespace-nowrap">
                                √streekx.not
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 ml-2">
                            Suggestion based on your username. You can change this now, but not later.
                        </p>
                    </div>

                    <div className="mt-auto pb-8">
                        <button onClick={handleNext} className="w-full py-4 bg-streekx-primary text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 4: PASSWORD */}
        {step === 'PASSWORD' && (
             <div className="flex-1 flex flex-col animate-slide-right max-w-md mx-auto w-full">
                <Header title="Security" />
                <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">Create Password</h3>
                    <p className="text-gray-400 text-center mb-8 text-sm">Secure your account with a strong password.</p>

                    {error && <div className="text-red-400 text-sm font-bold text-center mb-4">{error}</div>}

                    <div className="space-y-6">
                        <input 
                            type="password" 
                            name="password"
                            placeholder="Password"
                            autoFocus
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg"
                        />
                         <input 
                            type="tel" 
                            name="mobile"
                            placeholder="Phone Number (Optional)"
                            value={formData.mobile}
                            onChange={handleChange}
                            className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary outline-none font-bold text-lg"
                        />
                        
                         <div className="px-2 mt-2 flex flex-wrap gap-2">
                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${formData.password.length >= 8 ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>8+ chars</span>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${/[A-Z]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Uppercase</span>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${/[a-z]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Lowercase</span>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${/[\d\W]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Number/Symbol</span>
                        </div>
                    </div>

                    <div className="mt-auto pb-8">
                        <button 
                            onClick={handleFinalSubmit} 
                            disabled={loading}
                            className="w-full py-4 bg-streekx-primary text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {loading ? 'Creating Identity...' : 'I Agree & Create Account'}
                        </button>
                        <p className="text-center text-[10px] text-gray-500 mt-4">
                            By creating an account, you agree to the Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
}
