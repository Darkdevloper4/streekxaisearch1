
import React, { useState } from 'react';

export default function Permissions({ onGrant }: { onGrant: () => void }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
      // Simulate system dialog delay
      setTimeout(() => {
          if (step < 2) {
              setStep(step + 1);
          } else {
              onGrant();
          }
      }, 300);
  };

  const steps = [
      {
          icon: '📍',
          color: 'bg-blue-100 text-blue-600',
          title: 'Location Access',
          desc: 'For precise local weather, news, and maps results nearby.',
          btn: 'Allow Location'
      },
      {
          icon: '🎤',
          color: 'bg-purple-100 text-purple-600',
          title: 'Microphone Access',
          desc: 'To enable real-time voice conversations with StreekX.',
          btn: 'Enable Microphone'
      },
      {
          icon: '🤖',
          color: 'bg-streekx-primary/20 text-streekx-primary',
          title: 'Default Assistant',
          desc: 'Set StreekX as your system default assistant for hands-free help anytime.',
          btn: 'Set as Default'
      }
  ];

  const currentStep = steps[step];

  return (
    <div className="flex flex-col h-full w-full bg-black text-white p-8 justify-between animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-streekx-primary/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-900/20 rounded-full blur-[80px]"></div>

      <div className="mt-10 z-10">
        <div className="flex gap-2 mb-6">
            {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-streekx-primary' : 'bg-[#2c2c2e]'}`}></div>
            ))}
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Let's get connected</h1>
        <p className="text-gray-400 mb-12 text-lg leading-relaxed">
            StreekX works best when it's deeply integrated with your device.
        </p>

        <div className="flex flex-col items-center justify-center py-8">
            <div className={`w-24 h-24 ${currentStep.color} rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg animate-slide-up transition-all duration-300`}>
                {currentStep.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center animate-fade-in">{currentStep.title}</h3>
            <p className="text-center text-gray-400 max-w-xs animate-fade-in">{currentStep.desc}</p>
        </div>
      </div>

      <div className="z-10 space-y-4">
          <button 
            onClick={handleNext}
            className="w-full py-4 bg-streekx-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-streekx-primaryDark transition-all active:scale-95"
          >
            {currentStep.btn}
          </button>
          
          <button 
            onClick={onGrant}
            className="w-full py-4 text-gray-500 font-bold text-sm hover:text-white transition-colors"
          >
            Skip for now
          </button>
      </div>
    </div>
  );
}
