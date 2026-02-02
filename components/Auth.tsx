
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (id: string, pass: string) => void;
  onSignup: (data: any) => void;
}

export default function Auth({ onLogin, onSignup }: AuthProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError(null); // Clear errors on type
    
    // For StreekX ID, prevent spaces and special chars that mess up email gen
    if (e.target.name === 'streekx_id') {
        const val = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
        setFormData({ ...formData, [e.target.name]: val });
    } else {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        if (!formData.streekx_id || !formData.password) {
            throw new Error("Please enter your ID and Password.");
        }

        const loginId = formData.streekx_id.includes('√streekx.not') 
            ? formData.streekx_id 
            : `${formData.streekx_id}√streekx.not`;
        
        await onLogin(loginId, formData.password);
      } else {
        // --- VALIDATION START ---

        // 1. Basic Fields Check
        if (!formData.streekx_id || !formData.password || !formData.full_name || !formData.username || !formData.dob) {
          throw new Error("Please fill all required fields.");
        }

        // 2. Name Validation (Letters, spaces, hyphens, dots)
        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        if (!nameRegex.test(formData.full_name)) {
            throw new Error("Name is invalid. Please use letters only.");
        }

        // 3. Username Validation (Auto-fix @)
        let finalUsername = formData.username.trim();
        if (!finalUsername.startsWith('@')) {
             finalUsername = '@' + finalUsername;
        }
        if (finalUsername.length < 3) {
             throw new Error("Username is too short.");
        }

        // 4. Age Validation (16+)
        const age = calculateAge(formData.dob);
        if (age < 16) {
            throw new Error(`You must be at least 16 years old to create an identity. (Current age: ${age})`);
        }

        // 5. High-Quality Password
        // Relaxed regex: 8+ chars, at least 1 uppercase, 1 lowercase, 1 digit OR special char
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
        if (!strongPasswordRegex.test(formData.password)) {
             throw new Error("Password too weak. Use 8+ chars with uppercase, lowercase, and a number/symbol.");
        }

        // --- VALIDATION END ---

        const signupData = {
            ...formData,
            username: finalUsername,
            streekx_id: `${formData.streekx_id}√streekx.not`
        };
        await onSignup(signupData);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center px-6 bg-[#000000] overflow-y-auto font-sans">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-streekx-primary mb-2 tracking-tight">STREEKX</h1>
          <p className="text-gray-400 font-medium">{mode === 'LOGIN' ? 'Welcome back.' : 'Secure your identity.'}</p>
        </div>

        {/* Error Box */}
        {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3 animate-fade-in">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm text-red-200 font-bold">{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'SIGNUP' && (
             <div className="animate-slide-up space-y-4">
                <input 
                  type="text" 
                  name="full_name"
                  placeholder="Full Name" 
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary focus:ring-1 focus:ring-streekx-primary outline-none transition-all placeholder-gray-500 font-bold"
                />
                <input 
                  type="text" 
                  name="username"
                  placeholder="@username" 
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary focus:ring-1 focus:ring-streekx-primary outline-none transition-all placeholder-gray-500 font-bold"
                />
             </div>
          )}

          <div>
             <div className="flex items-center w-full bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] focus-within:border-streekx-primary focus-within:ring-1 focus-within:ring-streekx-primary transition-all overflow-hidden relative">
                  <input 
                      type="text" 
                      name="streekx_id"
                      placeholder={mode === 'LOGIN' ? "Enter your ID" : "ID (alphanumeric only)"}
                      value={formData.streekx_id}
                      onChange={handleChange}
                      required
                      className="flex-1 p-4 bg-transparent outline-none font-mono text-sm text-white z-10 relative placeholder-gray-500 font-bold"
                      autoComplete="off"
                  />
                  <div className="bg-[#2c2c2e] h-full border-l border-[#3a3a3c] px-4 flex items-center justify-center text-sm text-gray-400 font-medium select-none whitespace-nowrap">
                      √streekx.not
                  </div>
              </div>
              {mode === 'SIGNUP' && <p className="text-xs text-gray-500 mt-2 ml-2">Unique identifier. No spaces.</p>}
          </div>

          <div className="relative">
            <input 
                type="password" 
                name="password"
                placeholder={mode === 'SIGNUP' ? "Password (8+ chars)" : "Password"}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] focus:border-streekx-primary focus:ring-1 focus:ring-streekx-primary outline-none transition-all placeholder-gray-500 font-bold"
            />
            {mode === 'SIGNUP' && (
                <div className="px-2 mt-2 flex flex-wrap gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${formData.password.length >= 8 ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>8+ chars</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${/[A-Z]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Uppercase</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${/[a-z]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Lowercase</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${/[\d\W]/.test(formData.password) ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-gray-800'}`}>Number/Symbol</span>
                </div>
            )}
          </div>

          {mode === 'SIGNUP' && (
            <div className="animate-slide-up space-y-4">
              <div className="flex gap-2">
                 <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Date of Birth</label>
                    <input 
                        type="date" 
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] outline-none placeholder-gray-500 font-bold"
                    />
                 </div>
                 <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase ml-2 mb-1 block">Gender</label>
                    <select 
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] outline-none placeholder-gray-500 font-bold h-[58px]"
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                 </div>
              </div>
              <input 
                type="tel" 
                name="mobile"
                placeholder="Mobile (Optional)"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full p-4 bg-[#1c1c1e] text-white rounded-2xl border border-[#2c2c2e] outline-none placeholder-gray-500 font-bold"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-4 bg-streekx-primary text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-streekx-primaryDark transition-all active:scale-95 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                mode === 'LOGIN' ? 'Authenticate' : 'Create Identity'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {mode === 'LOGIN' ? "Need a StreekX ID? " : "Already have an ID? "}
            <button 
              onClick={() => {
                setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                setError(null);
                setFormData({
                    streekx_id: '',
                    username: '',
                    password: '',
                    full_name: '',
                    dob: '',
                    mobile: '',
                    gender: 'Prefer not to say'
                }); 
              }}
              className="text-streekx-primary font-bold hover:underline"
            >
              {mode === 'LOGIN' ? 'Create One' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
