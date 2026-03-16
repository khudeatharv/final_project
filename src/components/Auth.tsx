import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-indigo-200">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">StudyFlow AI</h1>
        <p className="text-gray-500 mb-10 leading-relaxed">
          The all-in-one AI study assistant. Summarize notes, generate quizzes, and master your subjects faster than ever.
        </p>

        <button
          onClick={onLogin}
          className="w-full py-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
          Continue with Google
        </button>

        <div className="mt-8 pt-8 border-t border-gray-50 w-full">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Trusted by 10,000+ Students</p>
        </div>
      </div>
    </div>
  );
}
