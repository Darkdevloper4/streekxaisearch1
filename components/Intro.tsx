
import React from 'react';

interface IntroProps {
  onAuth: () => void;
  onSkip: () => void;
}

export default function Intro({ onAuth, onSkip }: IntroProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#000000] relative animate-fade-in overflow-hidden text-white">
      
      <div className="flex-1 flex flex-col items-center justify-center pt-16 px-6 text-center z-10">
        <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
          Ready, set, search
        </h1>
        <p className="text-gray-400 text-[17px] max-w-xs leading-relaxed">
          Get started by signing in<br/>or creating an account.
        </p>

        <div className="relative w-full max-w-sm h-80 mt-8 mb-4">
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-80 border-4 border-[#2c2c2e] rounded-[2.5rem] bg-[#1c1c1e] overflow-hidden shadow-2xl z-10">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20"></div>
                
                <div className="absolute inset-0 pt-8 flex flex-col items-center">
                    <div className="absolute top-10 left-[-20px] w-20 h-20 bg-gray-700 rounded-full opacity-30"></div>
                    <div className="absolute top-16 right-[-10px] w-16 h-16 bg-gray-700 rounded-full opacity-20"></div>
                    
                    <div className="absolute top-20 right-[-30px] w-40 h-40 bg-streekx-primary/40 rounded-full opacity-90"></div>
                    <div className="absolute top-32 right-8 w-4 h-20 bg-[#2c2c2e] transform -rotate-12"></div>

                    <div className="absolute bottom-10 right-4 z-20">
                         <div className="absolute -top-6 -left-2 w-10 h-12 bg-purple-900 rounded-lg border-2 border-black"></div>
                         <div className="w-12 h-20 bg-streekx-primary rounded-t-full border-2 border-black relative z-10"></div>
                         <div className="absolute -top-8 left-2 w-8 h-8 bg-[#8d6e63] rounded-full border-2 border-black"></div>
                    </div>

                    <div className="absolute bottom-8 left-4 z-20">
                         <div className="w-10 h-12 bg-yellow-600 rounded-tl-xl rounded-tr-md border-2 border-black transform -scale-x-100"></div>
                         <div className="absolute -top-4 -right-2 w-6 h-6 bg-yellow-600 rounded-full border-2 border-black"></div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-24 bg-[#000000]/50 rounded-t-[50%] transform scale-150"></div>
                </div>
             </div>
             
             <div className="absolute top-[35%] left-[calc(50%-100px)] w-2 h-10 bg-streekx-primary rounded-l-md"></div>
             <div className="absolute top-[45%] left-[calc(50%-100px)] w-2 h-10 bg-streekx-primary rounded-l-md"></div>
             
             <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-4 bg-streekx-primary/20 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="px-6 pb-12 w-full max-w-md mx-auto z-20 bg-[#000000]">
        <button 
          onClick={onAuth}
          className="w-full py-4 bg-streekx-primary text-white text-lg font-bold rounded-full shadow-lg hover:bg-streekx-primaryDark transition-all active:scale-95 mb-6"
        >
          Sign in or create account
        </button>

        <button 
          onClick={onSkip}
          className="w-full text-center text-streekx-primary font-bold text-lg hover:opacity-80 transition-opacity"
        >
          Not now
        </button>
      </div>

    </div>
  );
}
